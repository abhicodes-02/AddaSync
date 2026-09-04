import { useEffect, useRef, useState, useCallback } from "react";
import { db } from "../firebase/firebase";
import {
  doc, setDoc, deleteDoc, onSnapshot, collection, addDoc, getDocs, getDoc, updateDoc
} from "firebase/firestore";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const getLocalUid = (roomId) => {
  const key = `meetflow_uid_${roomId}`;
  let uid = localStorage.getItem(key);
  if (!uid) {
    uid = Math.random().toString(36).substring(2, 12);
    localStorage.setItem(key, uid);
  }
  return uid;
};

export default function useWebRTC(roomId, userName) {
  const peersRef = useRef(new Map());
  const localStreamRef = useRef(null);
  const myUid = useRef(null);
  const unsubscribers = useRef([]);
  
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [participantNames, setParticipantNames] = useState(new Map());
  const [connectionState, setConnectionState] = useState("new");
  const [error, setError] = useState(null);
  
  // Host & Knocking State
  const [isHost, setIsHost] = useState(false);
  const [pendingKnockers, setPendingKnockers] = useState([]);

  const removePeer = (uid) => {
     if (peersRef.current.has(uid)) {
       peersRef.current.get(uid).close();
       peersRef.current.delete(uid);
     }
     setRemoteStreams(prev => {
       const next = new Map(prev);
       next.delete(uid);
       return next;
     });
     setParticipantNames(prev => {
       const next = new Map(prev);
       next.delete(uid);
       return next;
     });
  };

  const cleanup = useCallback(async () => {
    unsubscribers.current.forEach((unsub) => unsub());
    unsubscribers.current = [];

    peersRef.current.forEach(pc => pc.close());
    peersRef.current.clear();

    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStreams(new Map());
    setParticipantNames(new Map());

    try {
      if (myUid.current) {
        const myPartRef = doc(db, "calls", roomId, "participants", myUid.current);
        await deleteDoc(myPartRef);
      }
    } catch (e) {
      console.warn("Cleanup error:", e);
    }
  }, [roomId]);

  const createPeerConnection = (targetUid) => {
    if (peersRef.current.has(targetUid)) return peersRef.current.get(targetUid);

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current.set(targetUid, pc);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.ontrack = (event) => {
      setRemoteStreams(prev => {
        const next = new Map(prev);
        next.set(targetUid, event.streams[0]);
        return next;
      });
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
         const col = collection(db, "calls", roomId, "participants", targetUid, "candidates");
         addDoc(col, {
            senderUid: myUid.current,
            candidate: event.candidate.toJSON()
         });
      }
    };

    pc.onconnectionstatechange = () => {
       if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          removePeer(targetUid);
       }
    };

    return pc;
  };

  const startWebRTC = async (uid) => {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24 } }, 
      audio: true 
    });
    localStreamRef.current = stream;
    setLocalStream(stream);

    const myPartRef = doc(db, "calls", roomId, "participants", uid);
    await setDoc(myPartRef, { joinedAt: Date.now(), userName: userName, isSharingScreen: false });

    const handleScreenShareStatus = async (e) => {
      try {
         await updateDoc(myPartRef, { isSharingScreen: e.detail });
      } catch (err) {}
    };
    window.addEventListener('screenshare-status', handleScreenShareStatus);
    unsubscribers.current.push(() => window.removeEventListener('screenshare-status', handleScreenShareStatus));

    const offersRef = collection(myPartRef, "offers");
    const unsubOffers = onSnapshot(offersRef, (snap) => {
      snap.docChanges().forEach(async (change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          const pc = createPeerConnection(data.senderUid);
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          const targetAnswersRef = collection(db, "calls", roomId, "participants", data.senderUid, "answers");
          await addDoc(targetAnswersRef, {
            senderUid: uid,
            answer: { type: answer.type, sdp: answer.sdp }
          });
        }
      });
    });

    const answersRef = collection(myPartRef, "answers");
    const unsubAnswers = onSnapshot(answersRef, (snap) => {
      snap.docChanges().forEach(async (change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          const pc = peersRef.current.get(data.senderUid);
          if (pc && pc.signalingState !== 'stable') {
             await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          }
        }
      });
    });

    const candidatesRef = collection(myPartRef, "candidates");
    const unsubCandidates = onSnapshot(candidatesRef, (snap) => {
      snap.docChanges().forEach(async (change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          const pc = peersRef.current.get(data.senderUid);
          if (pc) {
             await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          }
        }
      });
    });

    const participantsRef = collection(db, "calls", roomId, "participants");
    const unsubParticipants = onSnapshot(participantsRef, (snap) => {
       snap.docChanges().forEach(async (change) => {
          const targetUid = change.doc.id;
          const data = change.doc.data();
          
          if (change.type === "added" || change.type === "modified") {
             if (targetUid !== uid) {
               setParticipantNames(prev => {
                 const next = new Map(prev);
                 next.set(targetUid, data.userName || "Participant");
                 return next;
               });
               
               // Dispatch screen share status for VideoGrid layout pinning
               window.dispatchEvent(new CustomEvent('remote-screen-status', {
                  detail: { uid: targetUid, isSharingScreen: !!data.isSharingScreen }
               }));
             }
          }
          
          if (change.type === "added") {
             if (targetUid !== uid && !peersRef.current.has(targetUid)) {
                if (data.joinedAt > Date.now() - 5000) {
                    const pc = createPeerConnection(targetUid);
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);

                    const targetOffersRef = collection(db, "calls", roomId, "participants", targetUid, "offers");
                    await addDoc(targetOffersRef, {
                       senderUid: uid,
                       offer: { type: offer.type, sdp: offer.sdp }
                    });
                }
             }
          }
          
          if (change.type === "removed") {
             removePeer(targetUid);
          }
       });
    });

    unsubscribers.current.push(unsubOffers, unsubAnswers, unsubCandidates, unsubParticipants);
    setConnectionState("connected");
  };

  const start = useCallback(async () => {
    try {
      setConnectionState("connecting");
      const uid = getLocalUid(roomId);
      myUid.current = uid;

      const callDocRef = doc(db, "calls", roomId);
      const callSnap = await getDoc(callDocRef);
      
      let hostStatus = false;
      if (!callSnap.exists()) {
         await setDoc(callDocRef, { hostUid: uid, createdAt: Date.now() });
         hostStatus = true;
      } else {
         hostStatus = callSnap.data().hostUid === uid;
      }
      setIsHost(hostStatus);

      if (!hostStatus) {
         // Guest: Check if admitted
         const allowedDoc = await getDoc(doc(db, "calls", roomId, "allowedUsers", uid));
         if (!allowedDoc.exists()) {
             setConnectionState("knocking");
             const knockRef = doc(db, "calls", roomId, "knockers", uid);
             await setDoc(knockRef, { userName, status: "waiting", timestamp: Date.now() });

             return new Promise((resolve, reject) => {
                 const unsub = onSnapshot(knockRef, async (snap) => {
                     if (snap.exists()) {
                         const status = snap.data().status;
                         if (status === "admitted") {
                             unsub();
                             await setDoc(doc(db, "calls", roomId, "allowedUsers", uid), { admittedAt: Date.now() });
                             await deleteDoc(knockRef);
                             setConnectionState("connecting");
                             await startWebRTC(uid);
                             resolve(true);
                         } else if (status === "denied") {
                             unsub();
                             setError("The host denied your entry to the room.");
                             setConnectionState("failed");
                             reject(new Error("denied"));
                         }
                     }
                 });
                 unsubscribers.current.push(unsub);
             });
         } else {
             // Already admitted in a previous session
             await startWebRTC(uid);
         }
      } else {
         // Host: Listen for knockers
         const knockersRef = collection(db, "calls", roomId, "knockers");
         const unsubKnockers = onSnapshot(knockersRef, (snap) => {
             const pending = [];
             snap.forEach(docSnap => {
                 if (docSnap.data().status === "waiting") {
                     pending.push({ uid: docSnap.id, ...docSnap.data() });
                 }
             });
             setPendingKnockers(pending);
         });
         unsubscribers.current.push(unsubKnockers);

         await startWebRTC(uid);
      }
    } catch (err) {
       if (err.message !== "denied") {
          console.error("WebRTC Error:", err);
          setError("Failed to start video call. Please allow camera and mic permissions.");
          setConnectionState("failed");
       }
    }
  }, [roomId, userName]);

  const resolveKnock = async (uid, status) => {
    try {
      const knockRef = doc(db, "calls", roomId, "knockers", uid);
      await updateDoc(knockRef, { status });
    } catch (e) {
      console.error("Failed to resolve knock:", e);
    }
  };

  return {
    localStream,
    remoteStreams,
    participantNames,
    connectionState,
    error,
    peersRef,
    localStreamRef,
    isHost,
    pendingKnockers,
    resolveKnock,
    start,
    cleanup
  };
}
