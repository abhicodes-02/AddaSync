import { useState, useEffect, useCallback, useRef } from "react";

import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  doc,
  setDoc,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../../shared/lib/firebase";

export default function useChat(roomId, userName) {
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesStartRef = useRef(null);

  const prevCountRef = useRef(0);

  // Typing Listener
  useEffect(() => {
    if (!roomId) return;
    const typingRef = collection(db, "calls", roomId, "typing");
    const unsub = onSnapshot(typingRef, (snap) => {
      const now = Date.now();
      const typing = [];
      snap.forEach(d => {
        if (d.id !== userName && now - d.data().time < 4000) {
          typing.push(d.id);
        }
      });
      setTypingUsers(typing);
    });
    return () => unsub();
  }, [roomId, userName]);

  const setTyping = useCallback(() => {
    if (!userName || !roomId) return;
    const ref = doc(db, "calls", roomId, "typing", userName);
    setDoc(ref, { time: Date.now() }, { merge: true }).catch(() => {});
  }, [roomId, userName]);

  useEffect(() => {
    const chatRef = collection(db, "calls", roomId, "chat");
    const q = query(chatRef, orderBy("time", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      const newMessages = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(newMessages);

      // Dispatch bubble event for newly added messages only
      const added = snap.docChanges().filter(c => c.type === "added");
      added.forEach(change => {
        const data = change.doc.data();
        // Only dispatch for messages that arrived after the listener started
        if (prevCountRef.current > 0) {
          window.dispatchEvent(new CustomEvent("chat-bubble", {
            detail: { sender: data.sender, text: data.text, id: change.doc.id }
          }));
        }
      });
      prevCountRef.current = newMessages.length;
    });

    return () => unsub();
  }, [roomId]);

  useEffect(() => {
    messagesStartRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (customData = null) => {
    if (!msg.trim() && !customData) return;

    const chatRef = collection(db, "calls", roomId, "chat");
    await addDoc(chatRef, {
      ...(customData || { text: msg }),
      sender: userName || "Anonymous",
      time: Date.now(),
    });

    if (!customData) setMsg("");
  }, [msg, roomId, userName]);

  const sendFile = useCallback(async (file, onProgress) => {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error("No file selected"));
      
      const fileId = `${Date.now()}_${Math.random().toString(36).substring(7)}_${file.name}`;
      const fileRef = ref(storage, `chat_files/${roomId}/${fileId}`);
      
      const uploadTask = uploadBytesResumable(fileRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => {
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            await sendMessage({
              type: "file",
              fileName: file.name,
              fileSize: file.size,
              fileUrl: downloadURL,
            });
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }, [sendMessage, roomId]);

  return { messages, msg, setMsg, sendMessage, sendFile, messagesStartRef, typingUsers, setTyping };
}

