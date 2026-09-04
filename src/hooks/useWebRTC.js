import { useEffect, useRef, useState, useCallback } from "react";
import { db } from "../firebase/firebase";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  collection,
  addDoc,
  getDocs,
} from "firebase/firestore";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export default function useWebRTC(roomId) {
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const remoteDescSet = useRef(false);
  const unsubscribers = useRef([]);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionState, setConnectionState] = useState("new"); // new | connecting | connected | disconnected | failed
  const [error, setError] = useState(null);

  const cleanup = useCallback(async () => {
    unsubscribers.current.forEach((unsub) => unsub());
    unsubscribers.current = [];

    pcRef.current?.close();
    pcRef.current = null;

    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;

    // Clean up Firestore room data
    try {
      const callRef = doc(db, "calls", roomId);
      const offerSnap = await getDocs(collection(db, "calls", roomId, "offerCandidates"));
      const answerSnap = await getDocs(collection(db, "calls", roomId, "answerCandidates"));
      const chatSnap = await getDocs(collection(db, "calls", roomId, "chat"));

      const deletes = [];
      offerSnap.forEach((d) => deletes.push(deleteDoc(d.ref)));
      answerSnap.forEach((d) => deletes.push(deleteDoc(d.ref)));
      chatSnap.forEach((d) => deletes.push(deleteDoc(d.ref)));
      deletes.push(deleteDoc(callRef));
      await Promise.all(deletes);
    } catch (e) {
      console.warn("Firestore cleanup error:", e);
    }
  }, [roomId]);

  const start = useCallback(async () => {
    try {
      setConnectionState("connecting");

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      pc.onconnectionstatechange = () => {
        setConnectionState(pc.connectionState);
      };

      // Get local media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Set up remote stream
      const remote = new MediaStream();
      remoteStreamRef.current = remote;
      setRemoteStream(remote);

      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          remote.addTrack(track);
        });
      };

      // Firestore signaling
      const callRef = doc(db, "calls", roomId);
      const offerCandidates = collection(db, "calls", roomId, "offerCandidates");
      const answerCandidates = collection(db, "calls", roomId, "answerCandidates");

      pc.onicecandidate = (e) => {
        if (!e.candidate) return;
        const data = e.candidate.toJSON();
        if (pc.signalingState === "have-local-offer") {
          addDoc(offerCandidates, data);
        } else {
          addDoc(answerCandidates, data);
        }
      };

      const callData = await getDoc(callRef);

      if (!callData.exists()) {
        // Creator: make offer
        await setDoc(callRef, { roomId });

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await updateDoc(callRef, {
          offer: { type: offer.type, sdp: offer.sdp },
        });

        const unsubCall = onSnapshot(callRef, (snap) => {
          const data = snap.data();
          if (data?.answer && !remoteDescSet.current) {
            remoteDescSet.current = true;
            pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          }
        });

        const unsubAnswer = onSnapshot(answerCandidates, (snap) => {
          snap.docChanges().forEach((c) => {
            if (c.type === "added") {
              pc.addIceCandidate(new RTCIceCandidate(c.doc.data()));
            }
          });
        });

        unsubscribers.current.push(unsubCall, unsubAnswer);
      } else {
        // Joiner: answer
        const offer = callData.data().offer;
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await updateDoc(callRef, {
          answer: { type: answer.type, sdp: answer.sdp },
        });

        const unsubOffer = onSnapshot(offerCandidates, (snap) => {
          snap.docChanges().forEach((c) => {
            if (c.type === "added") {
              pc.addIceCandidate(new RTCIceCandidate(c.doc.data()));
            }
          });
        });

        unsubscribers.current.push(unsubOffer);
      }
    } catch (err) {
      console.error("WebRTC start error:", err);
      setError(err.name === "NotAllowedError"
        ? "Camera and microphone access denied. Please allow access in your browser settings."
        : err.name === "NotFoundError"
          ? "No camera or microphone found. Please connect a device."
          : "Failed to start video call. Please try again."
      );
      setConnectionState("failed");
    }
  }, [roomId]);

  return {
    localStream,
    remoteStream,
    connectionState,
    error,
    pcRef,
    localStreamRef,
    start,
    cleanup,
  };
}
