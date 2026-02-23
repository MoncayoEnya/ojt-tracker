// ============================================================
// src/components/CountdownBar.jsx
// Animated progress bar with urgency color
// ============================================================

import { useEffect, useRef } from "react";
import "../styles/TraineeCard.css";

export default function CountdownBar({ pct, urgency }) {
  const fillRef = useRef(null);

  useEffect(() => {
    if (!fillRef.current) return;
    // Start at 0 then animate to actual pct
    fillRef.current.style.width = "0%";
    const timer = setTimeout(() => {
      if (fillRef.current) fillRef.current.style.width = pct + "%";
    }, 150);
    return () => clearTimeout(timer);
  }, [pct]);

  return (
    <div className="bar-track">
      <div
        ref={fillRef}
        className={`bar-fill bar-fill--${urgency}`}
      />
    </div>
  );
}