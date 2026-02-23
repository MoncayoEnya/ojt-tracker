// ============================================================
// src/hooks/useTrainees.js
// Real-time Firebase listener hook
// Returns live trainees array from Firestore
// ============================================================

import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";

export function useTrainees() {
  const [trainees, setTrainees] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "trainees"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTrainees(data);
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsub();
  }, []);

  return { trainees, loading };
}