import { useEffect, useState, useCallback } from "react";
import { db } from "../firebase/firebase";
import { collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from "firebase/firestore";

export default function useReactions(roomId, userName) {
  const [reactions, setReactions] = useState([]);

  useEffect(() => {
    if (!roomId) return;

    // Listen for new reactions
    const q = query(
      collection(db, "calls", roomId, "reactions"),
      orderBy("timestamp", "desc"),
      limit(10) // only care about recent ones
    );

    let initialLoad = true;

    const unsub = onSnapshot(q, (snap) => {
      if (initialLoad) {
        initialLoad = false;
        return; // Skip existing reactions when joining
      }

      const newReactions = [];
      snap.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          // Only show reactions from the last 10 seconds to avoid ghosts
          if (data.timestamp && Date.now() - data.timestamp < 10000) {
            newReactions.push({ id: change.doc.id, ...data });
          }
        }
      });

      if (newReactions.length > 0) {
        setReactions((prev) => [...prev, ...newReactions]);
        
        // Auto-remove after animation (3s)
        setTimeout(() => {
          setReactions((prev) => prev.filter(r => !newReactions.find(nr => nr.id === r.id)));
        }, 3000);
      }
    });

    return () => unsub();
  }, [roomId]);

  const sendReaction = useCallback(async (emoji) => {
    if (!roomId) return;
    try {
      await addDoc(collection(db, "calls", roomId, "reactions"), {
        emoji,
        sender: userName,
        timestamp: Date.now()
      });
    } catch (e) {
      console.warn("Reaction failed", e);
    }
  }, [roomId, userName]);

  return { reactions, sendReaction };
}

