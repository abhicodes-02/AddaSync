import { useState, useEffect, useCallback, useRef } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  doc,
  setDoc,
} from "firebase/firestore";

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
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "https://tmpfiles.org/api/v1/upload", true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          if (onProgress) onProgress(progress);
        }
      };

      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            // tmpfiles returns url like https://tmpfiles.org/123/file.ext
            // to download directly, it needs to be https://tmpfiles.org/dl/123/file.ext
            const rawUrl = response.data.url;
            const downloadURL = rawUrl.replace("tmpfiles.org/", "tmpfiles.org/dl/");
            
            await sendMessage({
              type: "file",
              fileName: file.name,
              fileSize: file.size,
              fileUrl: downloadURL,
            });
            resolve(downloadURL);
          } catch (e) {
            reject(new Error("Failed to parse upload response"));
          }
        } else {
          reject(new Error("Upload failed with status " + xhr.status));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error during upload"));
      };

      xhr.send(formData);
    });
  }, [sendMessage]);

  return { messages, msg, setMsg, sendMessage, sendFile, messagesStartRef, typingUsers, setTyping };
}
