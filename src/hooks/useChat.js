import { useState, useEffect, useCallback, useRef } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

export default function useChat(roomId, userName) {
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const messagesStartRef = useRef(null);

  const prevCountRef = useRef(0);

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

  const sendMessage = useCallback(async () => {
    if (!msg.trim()) return;

    const chatRef = collection(db, "calls", roomId, "chat");
    await addDoc(chatRef, {
      text: msg,
      sender: userName || "Anonymous",
      time: Date.now(),
    });

    setMsg("");
  }, [msg, roomId, userName]);

  return { messages, msg, setMsg, sendMessage, messagesStartRef };
}
