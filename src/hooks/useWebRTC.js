// src/hooks/useWebRTC.js

import { useCallback, useRef, useState } from "react";
import { db } from "../firebase/firebase";
import {
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc
} from "firebase/firestore";
import { createNoiseSuppressedStream } from "../utils/audioProcessor";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ]
};

const getLocalUid = (roomId) => {
  const key = `addasync_uid_${roomId}`;
  let uid = null;

  try {
    uid = localStorage.getItem(key);
  } catch {}

  if (!uid) {
    uid = Math.random().toString(36).substring(2, 12);

    try {
      localStorage.setItem(key, uid);
    } catch {}
  }

  return uid;
};

export default function useWebRTC(roomId, userName) {
  const peersRef = useRef(new Map());
  const localStreamRef = useRef(null);
  const rawStreamRef = useRef(null);
  const myUid = useRef(null);
  const unsubscribers = useRef([]);
  const remoteJoinedAt = useRef(new Map());
  const pendingIceRef = useRef(new Map());
  const audioCleanupRef = useRef(null);
  const startedRef = useRef(false);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [participantNames, setParticipantNames] = useState(new Map());
  const [participantStates, setParticipantStates] = useState(new Map());
  const [connectionState, setConnectionState] = useState("new");
  const [error, setError] = useState(null);
  
  // Room State (Director Mode)
  const [roomState, setRoomState] = useState({
    spotlightUid: null,
    theme: "default",
    focusMode: false,
  });

  const [isHost, setIsHost] = useState(false);
  const [pendingKnockers, setPendingKnockers] = useState([]);
  const [facingMode, setFacingMode] = useState("user");

  const removePeer = useCallback((uid) => {
    const pc = peersRef.current.get(uid);

    if (pc) {
      try {
        pc.ontrack = null;
        pc.onicecandidate = null;
        pc.onconnectionstatechange = null;
        pc.close();
      } catch {}

      peersRef.current.delete(uid);
    }

    pendingIceRef.current.delete(uid);
    remoteJoinedAt.current.delete(uid);

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

    setParticipantStates(prev => {
      const next = new Map(prev);
      next.delete(uid);
      return next;
    });
  }, []);

  const queueOrAddIceCandidate = useCallback(async (uid, candidate) => {
    const pc = peersRef.current.get(uid);

    if (!pc) {
      const list = pendingIceRef.current.get(uid) || [];
      list.push(candidate);
      pendingIceRef.current.set(uid, list);
      return;
    }

    // ICE can arrive before the remote SDP. Queue it until the
    // remote description exists.
    if (!pc.remoteDescription) {
      const list = pendingIceRef.current.get(uid) || [];
      list.push(candidate);
      pendingIceRef.current.set(uid, list);
      return;
    }

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn("Failed to add remote ICE candidate:", err);
    }
  }, []);

  const flushPendingIce = useCallback(async (uid, pc) => {
    const list = pendingIceRef.current.get(uid) || [];

    if (!list.length || !pc.remoteDescription) return;

    pendingIceRef.current.delete(uid);

    for (const candidate of list) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("Failed to flush ICE candidate:", err);
      }
    }
  }, []);

  const createPeerConnection = useCallback((targetUid) => {
    const existing = peersRef.current.get(targetUid);
    if (existing) return existing;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current.set(targetUid, pc);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        try {
          pc.addTrack(track, localStreamRef.current);
        } catch (err) {
          console.warn("Failed to add local track:", err);
        }
      });
    }

    pc.ontrack = (event) => {
      const stream = event.streams?.[0];

      if (!stream) return;

      setRemoteStreams(prev => {
        const next = new Map(prev);
        next.set(targetUid, stream);
        return next;
      });
    };

    pc.onicecandidate = async (event) => {
      if (!event.candidate || !myUid.current) return;

      try {
        const candidatesRef = collection(
          db,
          "calls",
          roomId,
          "participants",
          targetUid,
          "candidates"
        );

        await addDoc(candidatesRef, {
          senderUid: myUid.current,
          candidate: event.candidate.toJSON()
        });
      } catch (err) {
        console.warn("Failed to write ICE candidate:", err);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setConnectionState("connected");
      }

      if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed" ||
        pc.connectionState === "closed"
      ) {
        removePeer(targetUid);
      }
    };

    return pc;
  }, [roomId, removePeer]);

  const cleanup = useCallback(async () => {
    startedRef.current = false;

    unsubscribers.current.forEach(unsub => {
      try { unsub(); } catch {}
    });
    unsubscribers.current = [];

    peersRef.current.forEach(pc => {
      try { pc.close(); } catch {}
    });
    peersRef.current.clear();

    pendingIceRef.current.clear();
    remoteJoinedAt.current.clear();

    // Stop the processed stream.
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch {}
      });
    }

    // Also stop the original microphone/camera stream. This is important
    // because the Web Audio destination creates a second audio track.
    if (rawStreamRef.current) {
      rawStreamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch {}
      });
    }

    localStreamRef.current = null;
    rawStreamRef.current = null;

    if (audioCleanupRef.current) {
      try { audioCleanupRef.current(); } catch {}
      audioCleanupRef.current = null;
    }

    setLocalStream(null);
    setRemoteStreams(new Map());
    setParticipantNames(new Map());
    setParticipantStates(new Map());
    setPendingKnockers([]);
    setConnectionState("new");

    try {
      if (myUid.current) {
        const myPartRef = doc(
          db,
          "calls",
          roomId,
          "participants",
          myUid.current
        );

        await deleteDoc(myPartRef);
      }
    } catch (err) {
      console.warn("Participant cleanup error:", err);
    }
  }, [roomId]);

  const startWebRTC = useCallback(async (uid, activeName) => {
    // Remove only stale signaling documents belonging to this participant.
    try {
      for (const col of ["offers", "answers", "candidates"]) {
        const snap = await getDocs(
          collection(db, "calls", roomId, "participants", uid, col)
        );

        await Promise.all(snap.docs.map(item => deleteDoc(item.ref)));
      }
    } catch (err) {
      console.warn("Pre-flight signaling cleanup failed:", err);
    }

    const myPartRef = doc(
      db,
      "calls",
      roomId,
      "participants",
      uid
    );

    const joinedAt = Date.now();

    await setDoc(myPartRef, {
      joinedAt,
      userName: activeName || "Participant",
      isSharingScreen: false,
      isMuted: false,
      isCameraOff: false
    });

    remoteJoinedAt.current.set(uid, joinedAt);

    const handleScreenShareStatus = async (event) => {
      try {
        await updateDoc(myPartRef, {
          isSharingScreen: !!event.detail
        });
      } catch {}
    };

    const handleMicStatus = async (event) => {
      try {
        await updateDoc(myPartRef, {
          isMuted: !!event.detail
        });
      } catch {}
    };

    const handleCameraStatus = async (event) => {
      try {
        await updateDoc(myPartRef, {
          isCameraOff: !!event.detail
        });
      } catch {}
    };

    window.addEventListener("screenshare-status", handleScreenShareStatus);
    window.addEventListener("mic-status", handleMicStatus);
    window.addEventListener("camera-status", handleCameraStatus);

    unsubscribers.current.push(() => {
      window.removeEventListener("screenshare-status", handleScreenShareStatus);
      window.removeEventListener("mic-status", handleMicStatus);
      window.removeEventListener("camera-status", handleCameraStatus);
    });

    // ---------------------------------------------------------
    // ROOM SETTINGS (Director Mode)
    // ---------------------------------------------------------
    const roomDocRef = doc(db, "calls", roomId);
    const unsubRoom = onSnapshot(roomDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setRoomState({
          spotlightUid: data.spotlightUid || null,
          theme: data.theme || "default",
          focusMode: data.focusMode || false,
          hostUid: data.hostUid || null,
        });
      }
    });
    unsubscribers.current.push(unsubRoom);

    // ---------------------------------------------------------
    // OFFERS
    // ---------------------------------------------------------
    const offersRef = collection(myPartRef, "offers");

    const unsubOffers = onSnapshot(offersRef, snap => {
      snap.docChanges().forEach(async change => {
        if (change.type !== "added") return;

        const data = change.doc.data();
        const senderUid = data.senderUid;
        if (!senderUid || senderUid === uid || !data.offer) return;

        try {
          let pc = peersRef.current.get(senderUid);

          if (!pc) {
            pc = createPeerConnection(senderUid);
          }

          // Deterministic glare handling:
          // the lexicographically larger UID is the offer initiator.
          // If we already made our own offer, ignore the competing offer.
          if (
            pc.signalingState !== "stable" &&
            pc.signalingState !== "have-remote-offer"
          ) {
            if (uid > senderUid) {
              return;
            }

            removePeer(senderUid);
            pc = createPeerConnection(senderUid);
          }

          if (pc.signalingState !== "stable") return;

          await pc.setRemoteDescription(
            new RTCSessionDescription(data.offer)
          );

          await flushPendingIce(senderUid, pc);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          const targetAnswersRef = collection(
            db,
            "calls",
            roomId,
            "participants",
            senderUid,
            "answers"
          );

          await addDoc(targetAnswersRef, {
            senderUid: uid,
            answer: {
              type: answer.type,
              sdp: answer.sdp
            }
          });
        } catch (err) {
          console.error("Offer handling failed:", err);
        }
      });
    });

    // ---------------------------------------------------------
    // ANSWERS
    // ---------------------------------------------------------
    const answersRef = collection(myPartRef, "answers");

    const unsubAnswers = onSnapshot(answersRef, snap => {
      snap.docChanges().forEach(async change => {
        if (change.type !== "added") return;

        const data = change.doc.data();
        const senderUid = data.senderUid;

        if (!senderUid || !data.answer) return;

        const pc = peersRef.current.get(senderUid);
        if (!pc) return;

        try {
          if (pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription(
              new RTCSessionDescription(data.answer)
            );

            await flushPendingIce(senderUid, pc);
          }
        } catch (err) {
          console.warn("Answer handling failed:", err);
        }
      });
    });

    // ---------------------------------------------------------
    // ICE CANDIDATES
    // ---------------------------------------------------------
    const candidatesRef = collection(myPartRef, "candidates");

    const unsubCandidates = onSnapshot(candidatesRef, snap => {
      snap.docChanges().forEach(change => {
        if (change.type !== "added") return;

        const data = change.doc.data();

        if (!data.senderUid || !data.candidate) return;

        queueOrAddIceCandidate(
          data.senderUid,
          data.candidate
        );
      });
    });

    // ---------------------------------------------------------
    // PARTICIPANTS
    // ---------------------------------------------------------
    const participantsRef = collection(
      db,
      "calls",
      roomId,
      "participants"
    );

    const unsubParticipants = onSnapshot(participantsRef, snap => {
      snap.docChanges().forEach(async change => {
        const targetUid = change.doc.id;

        if (targetUid === uid) {
          if (change.type === "removed") {
             setError("You have been removed from the meeting by the host.");
             cleanup();
          }
          return;
        }

        if (change.type === "removed") {
          removePeer(targetUid);

          window.dispatchEvent(
            new CustomEvent("remote-screen-status", {
              detail: {
                uid: targetUid,
                isSharingScreen: false
              }
            })
          );

          return;
        }

        if (change.type !== "added" && change.type !== "modified") {
          return;
        }

        const data = change.doc.data();

        // Ghost/reconnect detection.
        const existingJoinedAt =
          remoteJoinedAt.current.get(targetUid) || 0;

        const newJoinedAt = data.joinedAt || 0;

        if (
          existingJoinedAt &&
          newJoinedAt > existingJoinedAt &&
          peersRef.current.has(targetUid)
        ) {
          removePeer(targetUid);
        }

        remoteJoinedAt.current.set(targetUid, newJoinedAt);

        setParticipantNames(prev => {
          const next = new Map(prev);
          next.set(
            targetUid,
            data.userName || "Participant"
          );
          return next;
        });

        setParticipantStates(prev => {
          const next = new Map(prev);
          next.set(targetUid, {
            isMuted: !!data.isMuted,
            isCameraOff: !!data.isCameraOff
          });
          return next;
        });

        window.dispatchEvent(
          new CustomEvent("remote-screen-status", {
            detail: {
              uid: targetUid,
              isSharingScreen: !!data.isSharingScreen
            }
          })
        );

        // Only the lexicographically larger UID creates the offer.
        if (!peersRef.current.has(targetUid) && uid > targetUid) {
          try {
            const pc = createPeerConnection(targetUid);

            if (pc.signalingState !== "stable") return;

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            const targetOffersRef = collection(
              db,
              "calls",
              roomId,
              "participants",
              targetUid,
              "offers"
            );

            await addDoc(targetOffersRef, {
              senderUid: uid,
              offer: {
                type: offer.type,
                sdp: offer.sdp
              }
            });
          } catch (err) {
            console.error("Offer creation failed:", err);
            removePeer(targetUid);
          }
        }
      });
    });

    unsubscribers.current.push(
      unsubOffers,
      unsubAnswers,
      unsubCandidates,
      unsubParticipants
    );

    setConnectionState("connected");
  }, [
    roomId,
    createPeerConnection,
    flushPendingIce,
    queueOrAddIceCandidate,
    removePeer
  ]);

  const switchCamera = useCallback(async () => {
    if (!localStreamRef.current) return;

    try {
      const newMode =
        facingMode === "user" ? "environment" : "user";

      const newStream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: newMode,
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        });

      const newVideoTrack =
        newStream.getVideoTracks()[0];

      if (!newVideoTrack) {
        throw new Error("No camera track was returned.");
      }

      const oldVideoTrack =
        localStreamRef.current.getVideoTracks()[0];

      if (oldVideoTrack) {
        localStreamRef.current.removeTrack(oldVideoTrack);

        try {
          oldVideoTrack.stop();
        } catch {}
      }

      localStreamRef.current.addTrack(newVideoTrack);

      // Replace the outgoing video track in every active peer.
      peersRef.current.forEach(pc => {
        const sender = pc
          .getSenders()
          .find(
            item =>
              item.track &&
              item.track.kind === "video"
          );

        if (sender) {
          sender.replaceTrack(newVideoTrack).catch(err => {
            console.warn("replaceTrack failed:", err);
          });
        }
      });

      setLocalStream(
        new MediaStream(
          localStreamRef.current.getTracks()
        )
      );

      setFacingMode(newMode);

      window.dispatchEvent(
        new CustomEvent("streamchanged")
      );
    } catch (err) {
      console.error("Error switching camera:", err);
    }
  }, [facingMode]);

  const start = useCallback(async (overrideName) => {
    const activeName = overrideName || userName;

    if (startedRef.current && localStreamRef.current) {
      return true;
    }

    try {
      startedRef.current = true;
      setError(null);
      setConnectionState("connecting");

      // ---------------------------------------------------------
      // 1. CAPTURE MEDIA FIRST
      // ---------------------------------------------------------
      // autoGainControl is deliberately OFF because the custom
      // pipeline already controls level. Two AGCs fighting each
      // other can make speech pump and make the fan more audible.
      if (!localStreamRef.current) {
        if (
          !navigator.mediaDevices ||
          !navigator.mediaDevices.getUserMedia
        ) {
          throw new Error("unsupported_browser");
        }

        const rawStream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "user",
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 24, max: 30 }
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: false,
              channelCount: 1
            }
          });

        rawStreamRef.current = rawStream;

        const {
          processedStream,
          cleanup: audioCleanup
        } = await createNoiseSuppressedStream(
          rawStream
        );

        audioCleanupRef.current = audioCleanup;

        localStreamRef.current = processedStream;
        setLocalStream(processedStream);
      }

      // ---------------------------------------------------------
      // 2. FIREBASE / ROOM SETUP
      // ---------------------------------------------------------
      const uid = getLocalUid(roomId);
      myUid.current = uid;

      const callDocRef = doc(
        db,
        "calls",
        roomId
      );

      const callSnap =
        await getDoc(callDocRef);

      let hostStatus = false;

      if (!callSnap.exists()) {
        await setDoc(callDocRef, {
          hostUid: uid,
          createdAt: Date.now()
        });

        hostStatus = true;
      } else {
        hostStatus =
          callSnap.data().hostUid === uid;
      }

      setIsHost(hostStatus);

      // ---------------------------------------------------------
      // 3. GUEST KNOCK / HOST JOIN
      // ---------------------------------------------------------
      if (!hostStatus) {
        const allowedDoc = await getDoc(
          doc(
            db,
            "calls",
            roomId,
            "allowedUsers",
            uid
          )
        );

        if (!allowedDoc.exists()) {
          setConnectionState("knocking");

          const knockRef = doc(
            db,
            "calls",
            roomId,
            "knockers",
            uid
          );

          await setDoc(knockRef, {
            userName: activeName,
            status: "waiting",
            timestamp: Date.now()
          });

          return await new Promise(
            (resolve, reject) => {
              const unsub = onSnapshot(
                knockRef,
                async snap => {
                  if (!snap.exists()) return;

                  const status =
                    snap.data().status;

                  if (status === "admitted") {
                    try {
                      unsub();

                      await setDoc(
                        doc(
                          db,
                          "calls",
                          roomId,
                          "allowedUsers",
                          uid
                        ),
                        {
                          admittedAt: Date.now()
                        }
                      );

                      await deleteDoc(knockRef);

                      setConnectionState(
                        "connecting"
                      );

                      await startWebRTC(
                        uid,
                        activeName
                      );

                      resolve(true);
                    } catch (err) {
                      reject(err);
                    }
                  }

                  if (status === "denied") {
                    unsub();

                    setError(
                      "The host denied your entry to the room."
                    );

                    setConnectionState("failed");
                    startedRef.current = false;

                    reject(
                      new Error("denied")
                    );
                  }
                }
              );

              unsubscribers.current.push(unsub);
            }
          );
        }

        await startWebRTC(
          uid,
          activeName
        );
      } else {
        const knockersRef = collection(
          db,
          "calls",
          roomId,
          "knockers"
        );

        const unsubKnockers =
          onSnapshot(
            knockersRef,
            snap => {
              const pending = [];

              snap.forEach(docSnap => {
                if (
                  docSnap.data().status ===
                  "waiting"
                ) {
                  pending.push({
                    uid: docSnap.id,
                    ...docSnap.data()
                  });
                }
              });

              setPendingKnockers(pending);
            }
          );

        unsubscribers.current.push(
          unsubKnockers
        );

        await startWebRTC(
          uid,
          activeName
        );
      }

      return true;
    } catch (err) {
      startedRef.current = false;

      if (err?.message === "denied") {
        throw err;
      }

      console.error(
        "WebRTC start error:",
        err
      );

      if (
        err?.message ===
        "unsupported_browser"
      ) {
        setError(
          "Your browser does not support camera access. If you are using an in-app browser, please open the link in Safari or Chrome."
        );
      } else if (
        err?.name ===
        "NotAllowedError"
      ) {
        setError(
          "Camera and microphone permission was denied. Please allow access and try again."
        );
      } else if (
        err?.name ===
        "NotFoundError"
      ) {
        setError(
          "No camera or microphone was found on this device."
        );
      } else {
        setError(
          "Failed to start video call. Please allow camera and microphone permissions."
        );
      }

      setConnectionState("failed");

      // Release media if Firebase/WebRTC setup failed.
      if (localStreamRef.current) {
        localStreamRef.current
          .getTracks()
          .forEach(track => {
            try { track.stop(); } catch {}
          });
      }

      if (rawStreamRef.current) {
        rawStreamRef.current
          .getTracks()
          .forEach(track => {
            try { track.stop(); } catch {}
          });
      }

      if (audioCleanupRef.current) {
        try { audioCleanupRef.current(); } catch {}
      }

      localStreamRef.current = null;
      rawStreamRef.current = null;
      audioCleanupRef.current = null;
      setLocalStream(null);

      throw err;
    }
  }, [roomId, userName, startWebRTC]);

  const resolveKnock = useCallback(
    async (uid, status) => {
      try {
        const knockRef = doc(
          db,
          "calls",
          roomId,
          "knockers",
          uid
        );

        await updateDoc(knockRef, {
          status
        });
      } catch (err) {
        console.error(
          "Failed to resolve knock:",
          err
        );
      }
    },
    [roomId]
  );

  // Director Mode Actions
  const adminActions = {
    setSpotlight: async (uid) => {
      if (!isHost) return;
      await updateDoc(doc(db, "calls", roomId), { spotlightUid: uid });
    },
    setTheme: async (theme) => {
      if (!isHost) return;
      await updateDoc(doc(db, "calls", roomId), { theme });
    },
    toggleFocusMode: async () => {
      if (!isHost) return;
      await updateDoc(doc(db, "calls", roomId), { focusMode: !roomState.focusMode });
    },
    kickParticipant: async (uid) => {
      if (!isHost) return;
      // Delete participant's document, which triggers their kick logic
      await deleteDoc(doc(db, "calls", roomId, "participants", uid));
    }
  };

  return {
    localStream,
    setLocalStream,
    remoteStreams,
    participantNames,
    participantStates,
    connectionState,
    error,
    peersRef,
    localStreamRef,
    isHost,
    pendingKnockers,
    resolveKnock,
    start,
    cleanup,
    switchCamera,
    roomState,
    adminActions,
  };
}
