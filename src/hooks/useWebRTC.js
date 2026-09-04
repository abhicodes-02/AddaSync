import { useEffect, useRef, useState, useCallback } from "react";
import { db } from "../firebase/firebase";
import {
  doc, setDoc, deleteDoc, onSnapshot, collection, addDoc, getDocs
} from "firebase/firestore";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export default function useWebRTC(roomId, userName) {
  const peersRef = useRef(new Map());
  const localStreamRef = useRef(null);
  const myUid = useRef(Math.random().toString(36).substring(2, 12));
  const unsubscribers = useRef([]);
  
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [participantNames, setParticipantNames] = useState(new Map());
  const [connectionState, setConnectionState] = useState("new");
  const [error, setError] = useState(null);

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
      const myPartRef = doc(db, "calls", roomId, "participants", myUid.current);
      await deleteDoc(myPartRef);
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

  const start = useCallback(async () => {
    try {
      setConnectionState("connecting");

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setLocalStream(stream);

      const myPartRef = doc(db, "calls", roomId, "participants", myUid.current);
      await setDoc(myPartRef, { joinedAt: Date.now(), userName: userName || "Guest" });

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
              senderUid: myUid.current,
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

      // Listen for all participants to get their names and offer to new ones
      const participantsRef = collection(db, "calls", roomId, "participants");
      const unsubParticipants = onSnapshot(participantsRef, (snap) => {
         snap.docChanges().forEach(async (change) => {
            const targetUid = change.doc.id;
            const data = change.doc.data();
            
            if (change.type === "added" || change.type === "modified") {
               if (targetUid !== myUid.current) {
                 setParticipantNames(prev => {
                   const next = new Map(prev);
                   next.set(targetUid, data.userName || "Participant");
                   return next;
                 });
               }
            }
            
            if (change.type === "added") {
               if (targetUid !== myUid.current && !peersRef.current.has(targetUid)) {
                  // They joined, I will offer to them if they are newer
                  if (data.joinedAt > Date.now() - 5000) {
                      const pc = createPeerConnection(targetUid);
                      const offer = await pc.createOffer();
                      await pc.setLocalDescription(offer);

                      const targetOffersRef = collection(db, "calls", roomId, "participants", targetUid, "offers");
                      await addDoc(targetOffersRef, {
                         senderUid: myUid.current,
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

    } catch (err) {
       console.error("WebRTC Error:", err);
       setError("Failed to start video call. Please allow camera and mic permissions.");
       setConnectionState("failed");
    }
  }, [roomId, userName]);

  return {
    localStream,
    remoteStreams,
    participantNames,
    connectionState,
    error,
    peersRef,
    localStreamRef,
    start,
    cleanup
  };
}
