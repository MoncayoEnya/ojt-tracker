// ============================================================
//  OJT TRACKER — src/App.jsx
//  Hours-based end date · Weekdays only (Mon–Fri)
//  Light / Dark theme toggle · SVG icons · Firebase
// ============================================================

import { useState, useEffect, useRef, useMemo } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc,
} from "firebase/firestore";

// ── FIREBASE ─────────────────────────────────────────────────
const app = initializeApp({
  apiKey:            "AIzaSyDB8jGoY3NWTbGeHFnP2qTELG6ccRzypqw",
  authDomain:        "ojt-tracker-51ed1.firebaseapp.com",
  projectId:         "ojt-tracker-51ed1",
  storageBucket:     "ojt-tracker-51ed1.firebasestorage.app",
  messagingSenderId: "446065872296",
  appId:             "1:446065872296:web:e1e614fa0535af7e90619d",
});
const db = getFirestore(app);

// ── WEEKDAY UTILS ─────────────────────────────────────────────
function isWeekday(date) {
  const d = new Date(date);
  const day = d.getDay();
  return day !== 0 && day !== 6;
}

function countWeekdaysBetween(startStr, endStr) {
  const start = new Date(startStr);
  const end   = new Date(endStr);
  if (end <= start) return 0;
  let count = 0;
  const cur = new Date(start);
  while (cur < end) {
    if (isWeekday(cur)) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function addWeekdays(startStr, days) {
  const date = new Date(startStr);
  while (!isWeekday(date)) date.setDate(date.getDate() + 1);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    if (isWeekday(date)) added++;
  }
  return date.toISOString().split("T")[0];
}

function weekdaysLeft(endStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endStr);
  end.setHours(0, 0, 0, 0);
  if (end <= today) return 0;
  return countWeekdaysBetween(today.toISOString().split("T")[0], endStr);
}

function weekdaysDone(startStr) {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const start = new Date(startStr);
  if (today <= start) return 0;
  const todayStr = new Date().toISOString().split("T")[0];
  return countWeekdaysBetween(startStr, todayStr);
}

function getUrgency(startStr, endStr) {
  const left  = weekdaysLeft(endStr);
  const total = countWeekdaysBetween(startStr, endStr);
  const done  = weekdaysDone(startStr);
  const pct   = total > 0 ? Math.round((done / total) * 100) : 100;
  if (left <= 0)               return "done";
  if (pct >= 85 || left <= 5)  return "critical";
  if (pct >= 60 || left <= 15) return "warning";
  return "ok";
}

function getPct(startStr, endStr) {
  const total = countWeekdaysBetween(startStr, endStr);
  const done  = weekdaysDone(startStr);
  return Math.min(100, Math.max(0, total > 0 ? Math.round((done / total) * 100) : 0));
}

const today = () => new Date().toISOString().split("T")[0];

const fDate = (d) =>
  new Date(d).toLocaleDateString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
  });

const fDateShort = (d) =>
  new Date(d).toLocaleDateString("en-PH", {
    month: "short", day: "numeric",
  });

// ── PH TIME ──────────────────────────────────────────────────
function usePHTime() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const ph = new Date(time.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  const hours   = ph.getHours();
  const minutes = ph.getMinutes().toString().padStart(2, "0");
  const seconds = ph.getSeconds().toString().padStart(2, "0");
  const ampm    = hours >= 12 ? "PM" : "AM";
  const h12     = ((hours % 12) || 12).toString().padStart(2, "0");
  const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const monNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const day  = dayNames[ph.getDay()];
  const date = `${monNames[ph.getMonth()]} ${ph.getDate()}, ${ph.getFullYear()}`;
  return { time: `${h12}:${minutes}:${seconds}`, ampm, day, date };
}

// ── MOTIVATIONAL CONFIG ───────────────────────────────────────
const MOTIV = {
  ok:       { label: "Crushing It",  message: "Smooth sailing — keep that momentum going!",        color: "ok" },
  warning:  { label: "Pick It Up",   message: "A little extra push makes all the difference!",    color: "wa" },
  critical: { label: "Final Push",   message: "The finish line is close — give it everything!",   color: "cr" },
  done:     { label: "Graduated!",   message: "OJT complete — incredible work, future is bright!", color: "dn" },
};

// ── SVG ICONS ────────────────────────────────────────────────
const Icon = {
  Sun: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
      <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
    </svg>
  ),
  Moon: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  Plus: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Search: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Edit: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Trash: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Clock: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Briefcase: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      <line x1="12" y1="12" x2="12" y2="12"/>
    </svg>
  ),
  X: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Clipboard: () => (
    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1"/>
      <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="12" y2="16"/>
    </svg>
  ),
  Info: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  Logo: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  ),
  SortAsc: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/>
      <line x1="8" y1="18" x2="12" y2="18"/>
      <polyline points="3 8 6 5 9 8"/><line x1="6" y1="5" x2="6" y2="19"/>
    </svg>
  ),
  Users: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
};

// ── CSS ───────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* LIGHT */
  :root {
    --bg:        #f4f6f9;
    --bg-card:   #ffffff;
    --bg-card2:  #f9fafb;
    --bg-input:  #ffffff;
    --bg-hover:  #f3f4f6;
    --bg-nav:    rgba(255,255,255,0.88);

    --bdr:       #e5e7eb;
    --bdr-soft:  #f0f1f3;
    --bdr-focus: #3b82f6;

    --t1: #111827;
    --t2: #374151;
    --t3: #6b7280;
    --t4: #9ca3af;

    --acc:       #2563eb;
    --acc-h:     #1d4ed8;
    --acc-ring:  rgba(37,99,235,0.18);
    --acc-soft:  rgba(37,99,235,0.07);

    --sh-sm: 0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
    --sh-md: 0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
    --sh-lg: 0 20px 50px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.06);
    --nav-shadow: 0 1px 0 var(--bdr);

    --ok-bg:#dcfce7; --ok-text:#15803d; --ok-bdr:#bbf7d0; --ok-bar:#22c55e; --ok-soft:rgba(34,197,94,0.1);
    --wa-bg:#fef9c3; --wa-text:#a16207; --wa-bdr:#fde047; --wa-bar:#eab308; --wa-soft:rgba(234,179,8,0.1);
    --cr-bg:#fee2e2; --cr-text:#dc2626; --cr-bdr:#fca5a5; --cr-bar:#ef4444; --cr-soft:rgba(239,68,68,0.1);
    --dn-bg:#ede9fe; --dn-text:#7c3aed; --dn-bdr:#c4b5fd; --dn-bar:#8b5cf6; --dn-soft:rgba(139,92,246,0.1);
    --to-bg:#eff6ff; --to-text:#1d4ed8; --to-bdr:#bfdbfe;
  }

  /* DARK */
  [data-theme="dark"] {
    --bg:        #0d1117;
    --bg-card:   #161b27;
    --bg-card2:  #111520;
    --bg-input:  #0d1117;
    --bg-hover:  #1e2537;
    --bg-nav:    rgba(13,17,23,0.9);

    --bdr:       #21293d;
    --bdr-soft:  #1a2030;
    --bdr-focus: #3b82f6;

    --t1: #f1f5f9;
    --t2: #cbd5e1;
    --t3: #64748b;
    --t4: #334155;

    --acc:       #3b82f6;
    --acc-h:     #2563eb;
    --acc-ring:  rgba(59,130,246,0.22);
    --acc-soft:  rgba(59,130,246,0.1);

    --sh-sm: 0 1px 3px rgba(0,0,0,0.35);
    --sh-md: 0 4px 16px rgba(0,0,0,0.5);
    --sh-lg: 0 20px 50px rgba(0,0,0,0.7);
    --nav-shadow: 0 1px 0 var(--bdr);

    --ok-bg:rgba(20,83,45,0.25); --ok-text:#4ade80; --ok-bdr:rgba(74,222,128,0.2); --ok-bar:#22c55e; --ok-soft:rgba(34,197,94,0.12);
    --wa-bg:rgba(113,63,18,0.25); --wa-text:#fbbf24; --wa-bdr:rgba(251,191,36,0.2); --wa-bar:#eab308; --wa-soft:rgba(234,179,8,0.12);
    --cr-bg:rgba(127,29,29,0.25); --cr-text:#f87171; --cr-bdr:rgba(248,113,113,0.2); --cr-bar:#ef4444; --cr-soft:rgba(239,68,68,0.12);
    --dn-bg:rgba(76,29,149,0.25); --dn-text:#a78bfa; --dn-bdr:rgba(167,139,250,0.2); --dn-bar:#8b5cf6; --dn-soft:rgba(139,92,246,0.12);
    --to-bg:rgba(30,58,138,0.25); --to-text:#60a5fa; --to-bdr:rgba(96,165,250,0.2);
  }

  html { scroll-behavior: smooth; }
  body {
    background: var(--bg); color: var(--t1);
    font-family: 'Outfit', sans-serif;
    min-height: 100vh; font-size: 15px; line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    transition: background .25s, color .25s;
  }
  button { font-family: 'Outfit', sans-serif; cursor: pointer; }
  input, select { font-family: 'Outfit', sans-serif; }

  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-thumb { background: var(--bdr); border-radius: 4px; }
  [data-theme="dark"] input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6); }

  @keyframes slideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes scaleIn { from{opacity:0;transform:scale(.97) translateY(6px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:.35} }
  @keyframes barLoad { 0%{opacity:.4} 60%{opacity:.4} 100%{opacity:1} }
  @keyframes popIn   { 0%{opacity:0;transform:scale(.88)} 70%{transform:scale(1.04)} 100%{opacity:1;transform:scale(1)} }

  /* ── NAV ── */
  .nav {
    position: sticky; top: 0; z-index: 100;
    background: var(--bg-nav);
    backdrop-filter: blur(18px) saturate(160%);
    -webkit-backdrop-filter: blur(18px) saturate(160%);
    border-bottom: 1px solid var(--bdr);
    box-shadow: var(--nav-shadow);
    transition: background .25s, border-color .25s;
  }
  .nav-inner {
    max-width: 1060px; margin: 0 auto; padding: 0 24px;
    height: 64px; display: flex; align-items: center; justify-content: space-between; gap: 16px;
  }
  .nav-brand   { display: flex; align-items: center; gap: 11px; }
  .nav-icon    { width: 36px; height: 36px; border-radius: 10px; background: var(--acc); color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 8px var(--acc-ring); }
  .nav-title   { font-size: 15.5px; font-weight: 800; color: var(--t1); letter-spacing: -.4px; }
  .nav-sub     { font-size: 11px; color: var(--t3); line-height: 1; margin-top: 2px; letter-spacing: .01em; }
  .nav-right   { display: flex; align-items: center; gap: 10px; }

  /* PH Time chip in nav */
  .ph-time-chip {
    display: flex; align-items: center; gap: 8px;
    background: var(--bg-card2); border: 1px solid var(--bdr);
    border-radius: 10px; padding: 6px 12px;
    font-family: 'JetBrains Mono', monospace;
  }
  .ph-time-left { display: flex; flex-direction: column; align-items: flex-end; gap: 0; }
  .ph-time-val  { font-size: 13.5px; font-weight: 700; color: var(--t1); line-height: 1.2; letter-spacing: .02em; }
  .ph-time-ampm { font-size: 9.5px; font-weight: 600; color: var(--acc); text-transform: uppercase; letter-spacing: .08em; }
  .ph-time-divider { width: 1px; height: 24px; background: var(--bdr); }
  .ph-time-right { display: flex; flex-direction: column; gap: 1px; }
  .ph-time-day  { font-size: 10px; font-weight: 700; color: var(--t2); letter-spacing: .04em; text-transform: uppercase; font-family: 'Outfit', sans-serif; }
  .ph-time-date { font-size: 10.5px; color: var(--t3); font-family: 'Outfit', sans-serif; font-weight: 500; }
  .ph-dot       { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; flex-shrink: 0; animation: blink 2s ease-in-out infinite; margin-right: 2px; }

  /* ── THEME TOGGLE ── */
  .theme-btn {
    width: 35px; height: 35px; border-radius: 8px;
    background: transparent; border: 1px solid var(--bdr);
    color: var(--t3); display: flex; align-items: center; justify-content: center;
    transition: all .18s;
  }
  .theme-btn:hover { background: var(--bg-hover); color: var(--t1); border-color: var(--t4); }

  /* ── BUTTONS ── */
  .btn { display:inline-flex; align-items:center; gap:6px; font-weight:600; font-size:13.5px; border-radius:8px; border:none; cursor:pointer; transition:all .16s ease; white-space:nowrap; line-height:1; }
  .btn-primary  { background:var(--acc); color:#fff; padding:9px 16px; box-shadow:0 1px 2px rgba(0,0,0,.12); }
  .btn-primary:hover  { background:var(--acc-h); transform:translateY(-1px); box-shadow:0 4px 14px var(--acc-ring); }
  .btn-primary:active { transform:translateY(0); }
  .btn-primary:disabled { opacity:.45; cursor:not-allowed; transform:none; }
  .btn-sec   { background:var(--bg-card); color:var(--t2); padding:9px 16px; border:1px solid var(--bdr); }
  .btn-sec:hover { background:var(--bg-hover); color:var(--t1); }
  .btn-sm    { background:transparent; border:1px solid var(--bdr); color:var(--t3); padding:5px 11px; font-size:12.5px; border-radius:6px; }
  .btn-sm:hover { background:var(--bg-hover); color:var(--t1); border-color:var(--t4); }
  .btn-del   { background:transparent; border:1px solid transparent; color:var(--t3); padding:5px 11px; font-size:12.5px; border-radius:6px; }
  .btn-del:hover { background:var(--cr-bg); color:var(--cr-text); border-color:var(--cr-bdr); }

  /* ── PAGE ── */
  .page { max-width: 1060px; margin: 0 auto; padding: 28px 24px 80px; }

  /* ════════════════════════════════════════════
     JOURNEY PANEL  (replaces the 4 stat cards)
     ════════════════════════════════════════════ */
  .journey-panel {
    background: var(--bg-card);
    border: 1px solid var(--bdr);
    border-radius: 16px;
    padding: 20px 22px;
    margin-bottom: 22px;
    box-shadow: var(--sh-sm);
    animation: slideUp .35s ease both;
  }

  /* Top row: total badge + donut */
  .journey-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    gap: 12px;
  }
  .journey-header-left { display: flex; align-items: center; gap: 13px; }
  .journey-total-badge {
    display: flex; align-items: center; gap: 8px;
    background: var(--acc-soft); border: 1px solid var(--acc-ring);
    border-radius: 10px; padding: 8px 14px;
    color: var(--acc); flex-shrink: 0;
  }
  .journey-total-num {
    font-family: 'JetBrains Mono', monospace;
    font-size: 20px; font-weight: 700; color: var(--t1);
  }
  .journey-title { font-size: 14px; font-weight: 700; color: var(--t1); letter-spacing: -.2px; }
  .journey-sub   { font-size: 12px; color: var(--t3); margin-top: 2px; }

  /* Donut chart */
  .journey-donut-wrap {
    position: relative; flex-shrink: 0;
    width: 52px; height: 52px;
    display: flex; align-items: center; justify-content: center;
  }
  .journey-donut { width: 52px; height: 52px; transform: rotate(-90deg); }
  .journey-donut-label {
    position: absolute; text-align: center; line-height: 1.1;
  }
  .journey-donut-pct {
    display: block;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; font-weight: 700; color: var(--t1);
  }
  .journey-donut-sub {
    display: block; font-size: 8.5px; color: var(--t3);
    text-transform: uppercase; letter-spacing: .04em;
  }

  /* 4 milestone cards */
  .milestones-row {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
  }
  .milestone-card {
    position: relative;
    background: var(--bg-card2);
    border: 1.5px solid var(--bdr-soft);
    border-radius: 12px;
    padding: 14px 14px 12px;
    cursor: pointer; text-align: left; outline: none;
    transition: all .2s ease;
    animation: popIn .4s ease both;
    overflow: hidden;
  }
  .milestone-card::after {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: var(--mc);
    border-radius: 12px 12px 0 0;
    opacity: 0; transition: opacity .2s;
  }
  .milestone-card:hover::after,
  .milestone-card.mc-active::after { opacity: 1; }
  .milestone-card:hover {
    border-color: var(--mc-bdr);
    background: var(--mc-bg);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px var(--mc-glow);
  }
  .milestone-card.mc-active {
    border-color: var(--mc) !important;
    background: var(--mc-bg) !important;
    box-shadow: 0 0 0 3px var(--mc-glow), 0 6px 20px var(--mc-glow) !important;
    transform: translateY(-2px);
  }
  .milestone-card.mc-empty { opacity: .55; }

  .mc-top {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 10px;
  }
  .mc-icon-wrap {
    width: 30px; height: 30px; border-radius: 8px;
    background: var(--mc-bg); border: 1px solid var(--mc-bdr);
    color: var(--mc); display: flex; align-items: center; justify-content: center;
  }
  .mc-emoji {
    font-size: 15px; line-height: 1; opacity: .7;
    transition: opacity .2s, transform .2s;
  }
  .milestone-card:hover .mc-emoji,
  .milestone-card.mc-active .mc-emoji { opacity: 1; transform: scale(1.2) rotate(-8deg); }

  .mc-count {
    font-family: 'JetBrains Mono', monospace;
    font-size: 26px; font-weight: 700; color: var(--t1); line-height: 1; margin-bottom: 2px;
  }
  .mc-label   { font-size: 12.5px; font-weight: 700; color: var(--t2); margin-bottom: 1px; }
  .mc-tagline { font-size: 11px; color: var(--t3); margin-bottom: 10px; }

  .mc-bar-track { height: 4px; background: var(--bdr); border-radius: 99px; overflow: hidden; }
  .mc-bar-fill  {
    height: 100%; background: var(--mc); border-radius: 99px;
    transition: width 1s cubic-bezier(.34,1.2,.64,1);
  }
  .mc-active-dot {
    position: absolute; top: 9px; right: 9px;
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--mc);
    animation: blink 1.4s ease-in-out infinite;
  }

  /* ── TOOLBAR ── */
  .toolbar { display:flex; gap:10px; align-items:center; margin-bottom:16px; flex-wrap:wrap; }
  .search-box { flex:1; min-width:200px; position:relative; }
  .search-ico { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--t3); display:flex; pointer-events:none; }
  .search-inp {
    width:100%; background:var(--bg-card); border:1px solid var(--bdr); border-radius:8px;
    padding:9px 13px 9px 37px; color:var(--t1); font-size:13.5px; outline:none;
    transition:border-color .18s, box-shadow .18s; box-shadow:var(--sh-sm);
  }
  .search-inp:focus { border-color:var(--bdr-focus); box-shadow:0 0 0 3px var(--acc-ring); }
  .search-inp::placeholder { color:var(--t4); }
  .sort-box { position:relative; display:flex; align-items:center; }
  .sort-ico { position:absolute; left:10px; color:var(--t3); pointer-events:none; display:flex; }
  .sort-sel {
    background:var(--bg-card); border:1px solid var(--bdr); border-radius:8px;
    padding:9px 32px 9px 30px; color:var(--t2); font-size:13px;
    outline:none; cursor:pointer; appearance:none; min-width:175px;
    box-shadow:var(--sh-sm); transition:border-color .18s;
  }
  .sort-sel:focus { border-color:var(--bdr-focus); }

  /* ── LIST HEADER ── */
  .list-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
  .list-title  { font-size:12.5px; font-weight:600; color:var(--t3); text-transform:uppercase; letter-spacing:.07em; }
  .list-count  { font-size:12.5px; color:var(--t4); }
  .list-count b { color:var(--t3); font-weight:600; }

  /* ── CARD ── */
  .card {
    background:var(--bg-card); border:1px solid var(--bdr);
    border-radius:12px; padding:20px 22px;
    transition:all .2s ease; animation:slideUp .4s ease both;
    box-shadow:var(--sh-sm); position:relative; overflow:hidden;
  }
  .card::before { content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background:var(--card-line); border-radius:3px 0 0 3px; }
  .card.ok       { --card-line: var(--ok-bar); }
  .card.warning  { --card-line: var(--wa-bar); }
  .card.critical { --card-line: var(--cr-bar); }
  .card.done     { --card-line: var(--dn-bar); }
  .card:hover { box-shadow:var(--sh-md); border-color:var(--t4); transform:translateY(-1px); }
  .card-list { display:flex; flex-direction:column; gap:9px; }

  /* ── CARD INNER ── */
  .card-top   { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:15px; }
  .card-left  { flex:1; min-width:0; }
  .card-name  { font-size:15.5px; font-weight:700; color:var(--t1); margin-bottom:8px; letter-spacing:-.2px; }
  .pills      { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:9px; }
  .pill {
    display:inline-flex; align-items:center; gap:5px;
    font-size:11.5px; color:var(--t3); font-weight:500;
    background:var(--bg-card2); border:1px solid var(--bdr-soft);
    border-radius:6px; padding:3px 9px;
    font-family:'JetBrains Mono',monospace;
  }
  /* Motivational line on card */
  .card-motiv {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; color: var(--t3); font-style: italic;
  }
  .card-motiv-emoji { font-style: normal; font-size: 13px; }

  .card-right { display:flex; flex-direction:column; align-items:flex-end; gap:7px; flex-shrink:0; }

  /* ── STATUS BADGE ── */
  .badge {
    display:inline-flex; align-items:center; gap:5px;
    font-size:11px; font-weight:600; padding:3px 9px; border-radius:20px;
    letter-spacing:.025em; white-space:nowrap;
    background:var(--b-bg); color:var(--b-text); border:1px solid var(--b-bdr);
  }
  .badge-dot { width:5px; height:5px; border-radius:50%; background:currentColor; flex-shrink:0; }
  .badge-dot.blink { animation:blink 1.4s ease-in-out infinite; }

  /* ── COUNTDOWN ── */
  .countdown     { text-align:right; }
  .cdown-num     { font-family:'JetBrains Mono',monospace; font-size:27px; font-weight:700; line-height:1; }
  .cdown-lbl     { font-size:10.5px; color:var(--t3); font-weight:500; margin-top:3px; text-transform:uppercase; letter-spacing:.07em; }
  .cdown-done    { font-family:'JetBrains Mono',monospace; font-size:14px; font-weight:700; }

  /* ── PROGRESS ── */
  .prog-wrap  { margin-bottom:13px; }
  .prog-top   { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:7px; }
  .prog-label { font-size:12px; color:var(--t3); font-weight:500; }
  .prog-pct   { font-family:'JetBrains Mono',monospace; font-size:12.5px; font-weight:700; }
  .prog-track { height:7px; background:var(--bg-card2); border-radius:99px; overflow:hidden; border:1px solid var(--bdr-soft); }
  .prog-fill  { height:100%; border-radius:99px; width:0%; transition:width 1s cubic-bezier(.34,1.2,.64,1); animation:barLoad .6s ease; }
  .prog-fill.ok       { background:var(--ok-bar); }
  .prog-fill.warning  { background:var(--wa-bar); }
  .prog-fill.critical { background:var(--cr-bar); animation:barLoad .6s ease, blink 2s ease-in-out infinite; }
  .prog-fill.done     { background:var(--dn-bar); }
  .prog-bot  { display:flex; justify-content:space-between; margin-top:6px; font-size:11px; color:var(--t4); font-family:'JetBrains Mono',monospace; }

  /* ── CARD FOOTER ── */
  .card-foot  { display:flex; align-items:center; justify-content:space-between; padding-top:13px; border-top:1px solid var(--bdr-soft); }
  .foot-end   { font-size:12px; color:var(--t3); }
  .foot-end b { color:var(--t2); font-weight:600; }
  .foot-acts  { display:flex; gap:5px; }

  /* ── COMPUTED DATE PREVIEW (inside form) ── */
  .calc-box {
    background:var(--acc-soft); border:1px solid var(--acc-ring);
    border-radius:9px; padding:14px 16px;
    display:flex; flex-direction:column; gap:6px;
  }
  .calc-row  { display:flex; justify-content:space-between; align-items:center; }
  .calc-key  { font-size:12.5px; color:var(--t3); display:flex; align-items:center; gap:5px; }
  .calc-val  { font-size:13px; font-weight:700; color:var(--t1); font-family:'JetBrains Mono',monospace; }
  .calc-title { font-size:12px; font-weight:600; color:var(--acc); text-transform:uppercase; letter-spacing:.06em; margin-bottom:4px; }
  .calc-note  { font-size:11.5px; color:var(--t3); margin-top:2px; display:flex; align-items:center; gap:4px; }

  /* ── EMPTY ── */
  .empty {
    text-align:center; padding:70px 24px;
    border:1.5px dashed var(--bdr); border-radius:14px;
    background:var(--bg-card); animation:fadeIn .35s ease;
  }
  .empty-ico   { color:var(--t4); margin-bottom:14px; display:flex; justify-content:center; }
  .empty-title { font-size:17px; font-weight:700; color:var(--t2); margin-bottom:7px; }
  .empty-desc  { font-size:13.5px; color:var(--t3); margin-bottom:22px; max-width:300px; margin-left:auto; margin-right:auto; line-height:1.7; }

  /* ── SKELETON ── */
  .skel-wrap { display:flex; flex-direction:column; gap:9px; }
  .skel-card { background:var(--bg-card); border:1px solid var(--bdr); border-radius:12px; padding:20px 22px; }
  .skel-line { background:var(--bdr-soft); border-radius:5px; animation:blink 1.6s ease infinite; }

  /* ── MODAL ── */
  .overlay {
    position:fixed; inset:0; z-index:200;
    background:rgba(0,0,0,.35);
    backdrop-filter:blur(5px);
    display:flex; align-items:center; justify-content:center; padding:20px;
    animation:fadeIn .2s ease;
  }
  [data-theme="dark"] .overlay { background:rgba(0,0,0,.6); }
  .modal {
    background:var(--bg-card); border:1px solid var(--bdr);
    border-radius:16px; width:100%; max-width:470px;
    box-shadow:var(--sh-lg); animation:scaleIn .22s ease;
  }
  .modal-head  { display:flex; justify-content:space-between; align-items:center; padding:19px 22px 17px; border-bottom:1px solid var(--bdr); }
  .modal-title { font-size:16px; font-weight:700; color:var(--t1); }
  .modal-x     { width:30px; height:30px; border-radius:6px; background:transparent; border:1px solid var(--bdr); color:var(--t3); display:flex; align-items:center; justify-content:center; transition:all .15s; }
  .modal-x:hover { background:var(--bg-hover); color:var(--t1); }

  /* ── DELETE CONFIRM MODAL ── */
  .del-modal {
    background:var(--bg-card); border:1px solid var(--bdr);
    border-radius:16px; width:100%; max-width:380px;
    box-shadow:var(--sh-lg); animation:scaleIn .22s ease;
    overflow:hidden;
  }
  .del-modal-top {
    display:flex; flex-direction:column; align-items:center;
    padding:28px 28px 20px; text-align:center; gap:12px;
  }
  .del-icon-ring {
    width:52px; height:52px; border-radius:50%;
    background:var(--cr-bg); border:1.5px solid var(--cr-bdr);
    display:flex; align-items:center; justify-content:center;
    color:var(--cr-text); flex-shrink:0;
  }
  .del-title   { font-size:16px; font-weight:700; color:var(--t1); }
  .del-name    { font-size:13.5px; font-weight:700; color:var(--acc); background:var(--acc-soft); border:1px solid var(--acc-ring); border-radius:6px; padding:3px 10px; display:inline-block; margin:2px 0; }
  .del-desc    { font-size:13px; color:var(--t3); line-height:1.6; }
  .del-foot    { display:flex; gap:9px; padding:16px 20px; border-top:1px solid var(--bdr); background:var(--bg-card2); }
  .btn-danger  { background:var(--cr-bar); color:#fff; padding:9px 16px; flex:1; justify-content:center; border:none; box-shadow:0 1px 2px rgba(0,0,0,.12); }
  .btn-danger:hover { background:#dc2626; transform:translateY(-1px); box-shadow:0 4px 14px rgba(239,68,68,0.35); }
  .btn-danger:active { transform:translateY(0); }
  .btn-cancel  { background:var(--bg-card); color:var(--t2); padding:9px 16px; flex:1; justify-content:center; border:1px solid var(--bdr); }
  .btn-cancel:hover { background:var(--bg-hover); color:var(--t1); }

  /* ── FORM ── */
  .form-body   { padding:20px 22px; display:flex; flex-direction:column; gap:16px; }
  .form-row    { display:grid; grid-template-columns:1fr 1fr; gap:13px; }
  .form-group  { display:flex; flex-direction:column; gap:5px; }
  .form-label  { font-size:13px; font-weight:600; color:var(--t2); }
  .req         { color:var(--cr-text); margin-left:2px; }
  .form-input  {
    background:var(--bg-input); border:1px solid var(--bdr); border-radius:8px;
    padding:10px 13px; color:var(--t1); font-size:14px; outline:none; width:100%;
    transition:border-color .18s, box-shadow .18s; box-shadow:var(--sh-sm);
  }
  .form-input:focus { border-color:var(--bdr-focus); box-shadow:0 0 0 3px var(--acc-ring); }
  .form-input::placeholder { color:var(--t4); }
  .form-hint   { font-size:11.5px; color:var(--t3); }
  .form-foot   { display:flex; gap:9px; justify-content:flex-end; padding:15px 22px; border-top:1px solid var(--bdr); background:var(--bg-card2); border-radius:0 0 16px 16px; }

  /* ── RESPONSIVE ── */
  @media (max-width: 860px) { .milestones-row { grid-template-columns: repeat(2,1fr); } }
  @media (max-width: 640px) {
    .nav-inner { padding:0 16px; }
    .page { padding:18px 16px 60px; }
    .ph-time-chip { display: none; }
    .milestones-row { grid-template-columns:repeat(2,1fr); gap:8px; }
    .mc-count { font-size:22px; }
    .toolbar { flex-direction:column; align-items:stretch; }
    .sort-box, .sort-sel { width:100%; }
    .card { padding:15px 17px; }
    .card-top { flex-direction:column; gap:10px; }
    .card-right { flex-direction:row; align-items:center; justify-content:space-between; width:100%; }
    .countdown { text-align:left; }
    .cdown-num { font-size:22px; }
    .card-foot { flex-direction:column; align-items:flex-start; gap:9px; }
    .foot-acts { width:100%; }
    .btn-sm, .btn-del { flex:1; justify-content:center; }
    .form-row { grid-template-columns:1fr; }
    .nav-sub { display:none; }
    .journey-panel { padding:16px; }
    .journey-header { flex-wrap:wrap; }
  }
  @media (min-width: 1024px) { .card { padding:22px 26px; } }
`;

// ── MILESTONE CONFIG ──────────────────────────────────────────
const MILESTONES = [
  {
    key: "ok",
    label: "Crushing It", tagline: "On track & flying",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
      </svg>
    ),
    mc: "#10b981", mcBg: "rgba(16,185,129,0.1)", mcBdr: "rgba(16,185,129,0.25)", mcGlow: "rgba(16,185,129,0.25)",
  },
  {
    key: "warning",
    label: "Pick It Up", tagline: "Needs a boost",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    mc: "#f59e0b", mcBg: "rgba(245,158,11,0.1)", mcBdr: "rgba(245,158,11,0.25)", mcGlow: "rgba(245,158,11,0.25)",
  },
  {
    key: "critical",
    label: "Final Push", tagline: "Sprint to the finish",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
      </svg>
    ),
    mc: "#ef4444", mcBg: "rgba(239,68,68,0.1)", mcBdr: "rgba(239,68,68,0.25)", mcGlow: "rgba(239,68,68,0.25)",
  },
  {
    key: "done",
    label: "Graduated!", tagline: "Mission complete",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
        <path d="M7 4H4a2 2 0 0 0-2 2v4a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4V6a2 2 0 0 0-2-2h-3"/>
        <path d="M7 4h10v8a5 5 0 0 1-10 0V4z"/>
      </svg>
    ),
    mc: "#8b5cf6", mcBg: "rgba(139,92,246,0.1)", mcBdr: "rgba(139,92,246,0.25)", mcGlow: "rgba(139,92,246,0.25)",
  },
];

// ── PROGRESS BAR ─────────────────────────────────────────────
function ProgressBar({ pct, urgency }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.width = "0%";
    const t = setTimeout(() => { if (ref.current) ref.current.style.width = pct + "%"; }, 100);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div className="prog-track">
      <div ref={ref} className={`prog-fill ${urgency}`} />
    </div>
  );
}

// ── PH TIME CHIP ─────────────────────────────────────────────
function PHTimeChip() {
  const { time, ampm, day, date } = usePHTime();
  return (
    <div className="ph-time-chip">
      <div className="ph-dot" />
      <div className="ph-time-left">
        <span className="ph-time-val">{time}</span>
        <span className="ph-time-ampm">{ampm} · PHT</span>
      </div>
      <div className="ph-time-divider" />
      <div className="ph-time-right">
        <span className="ph-time-day">{day}</span>
        <span className="ph-time-date">{date}</span>
      </div>
    </div>
  );
}

// ── SKELETON ─────────────────────────────────────────────────
function SkeletonList() {
  return (
    <div className="skel-wrap">
      {[75, 55, 65].map((w, i) => (
        <div key={i} className="skel-card">
          <div className="skel-line" style={{ width: `${w}%`, height: 14, marginBottom: 14 }} />
          <div className="skel-line" style={{ width: "40%", height: 10, marginBottom: 20 }} />
          <div className="skel-line" style={{ width: "100%", height: 7, borderRadius: 99, marginBottom: 8 }} />
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <div className="skel-line" style={{ width:"28%", height:10, marginBottom:0 }} />
            <div className="skel-line" style={{ width:"18%", height:10, marginBottom:0 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── JOURNEY PANEL ─────────────────────────────────────────────
function JourneyPanel({ counts, filter, onFilter }) {
  const total   = counts.all;
  const pctDone = total > 0 ? Math.round((counts.done / total) * 100) : 0;
  const circumference = 2 * Math.PI * 15.9; // r=15.9

  return (
    <div className="journey-panel">
      {/* Header */}
      <div className="journey-header">
        <div className="journey-header-left">
          <div className="journey-total-badge">
            <Icon.Users />
            <span className="journey-total-num">{total}</span>
          </div>
          <div>
            <div className="journey-title">Trainee Journey Board</div>
            <div className="journey-sub">
              {total === 0
                ? "No trainees yet — add your first!"
                : `${counts.done} of ${total} have completed their OJT`}
            </div>
          </div>
        </div>
        {total > 0 && (
          <div className="journey-donut-wrap">
            <svg className="journey-donut" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--bdr)" strokeWidth="3"/>
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke="#8b5cf6" strokeWidth="3"
                strokeDasharray={`${(pctDone / 100) * circumference} ${circumference}`}
                strokeDashoffset="0"
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray 1s ease" }}
              />
            </svg>
            <div className="journey-donut-label">
              <span className="journey-donut-pct">{pctDone}%</span>
              <span className="journey-donut-sub">done</span>
            </div>
          </div>
        )}
      </div>

      {/* Milestone cards */}
      <div className="milestones-row">
        {/* All Trainees card */}
        <button
          className={`milestone-card${filter === "all" ? " mc-active" : ""}`}
          style={{ "--mc": "#3b82f6", "--mc-bg": "rgba(59,130,246,0.1)", "--mc-bdr": "rgba(59,130,246,0.25)", "--mc-glow": "rgba(59,130,246,0.25)", animationDelay: "0s" }}
          onClick={() => onFilter("all")}
        >
          <div className="mc-top">
            <div className="mc-icon-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
          </div>
          <div className="mc-count">{total}</div>
          <div className="mc-label">All Trainees</div>
          <div className="mc-tagline">Everyone enrolled</div>
          <div className="mc-bar-track">
            <div className="mc-bar-fill" style={{ width: "100%" }} />
          </div>
          {filter === "all" && <div className="mc-active-dot" />}
        </button>

        {MILESTONES.map((m, i) => {
          const count   = counts[m.key] || 0;
          const isActive = filter === m.key;
          const barW    = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <button
              key={m.key}
              className={`milestone-card${isActive ? " mc-active" : ""}${count === 0 ? " mc-empty" : ""}`}
              style={{
                "--mc": m.mc, "--mc-bg": m.mcBg,
                "--mc-bdr": m.mcBdr, "--mc-glow": m.mcGlow,
                animationDelay: `${i * 0.08}s`,
              }}
              onClick={() => onFilter(filter === m.key ? "all" : m.key)}
            >
              <div className="mc-top">
                <div className="mc-icon-wrap">{m.icon}</div>
                
              </div>
              <div className="mc-count">{count}</div>
              <div className="mc-label">{m.label}</div>
              <div className="mc-tagline">{m.tagline}</div>
              <div className="mc-bar-track">
                <div className="mc-bar-fill" style={{ width: `${barW}%` }} />
              </div>
              {isActive && <div className="mc-active-dot" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── DELETE CONFIRM MODAL ─────────────────────────────────────
function DeleteModal({ name, onConfirm, onCancel }) {
  useEffect(() => {
    const fn = e => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onCancel]);
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="del-modal" onClick={e => e.stopPropagation()}>
        <div className="del-modal-top">
          <div className="del-icon-ring">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </div>
          <div>
            <div className="del-title">Remove Trainee?</div>
          </div>
          <div>
            <span className="del-name">{name}</span>
          </div>
          <div className="del-desc">
            This will permanently remove this trainee and all their progress data. This action cannot be undone.
          </div>
        </div>
        <div className="del-foot">
          <button className="btn btn-cancel" onClick={onCancel}>Keep Trainee</button>
          <button className="btn btn-danger" onClick={onConfirm}>Yes, Remove</button>
        </div>
      </div>
    </div>
  );
}

// ── TRAINEE CARD ─────────────────────────────────────────────
function TraineeCard({ t, onEdit, onDelete, idx }) {
  const urgency = getUrgency(t.startDate, t.endDate);
  const pct     = getPct(t.startDate, t.endDate);
  const wLeft   = weekdaysLeft(t.endDate);
  const wDone   = weekdaysDone(t.startDate);
  const wTotal  = countWeekdaysBetween(t.startDate, t.endDate);
  const motiv   = MOTIV[urgency];

  const pfx = urgency === "ok" ? "ok" : urgency === "warning" ? "wa" : urgency === "critical" ? "cr" : "dn";
  const badgeStyle = {
    "--b-bg":   `var(--${pfx}-bg)`,
    "--b-text": `var(--${pfx}-text)`,
    "--b-bdr":  `var(--${pfx}-bdr)`,
  };
  const countdownColor = `var(--${pfx}-text)`;

  return (
    <div className={`card ${urgency}`} style={{ animationDelay: `${idx * 0.055}s` }}>
      <div className="card-top">
        <div className="card-left">
          <div className="card-name">{t.name}</div>
          <div className="pills">
            <span className="pill"><Icon.Calendar /> {fDateShort(t.startDate)} — {fDate(t.endDate)}</span>
            <span className="pill"><Icon.Clock /> {t.hours} hrs · {t.hoursPerDay || 8} hrs/day</span>
            <span className="pill"><Icon.Briefcase /> {wTotal} working days</span>
          </div>
          <div className="card-motiv">
            
            <span>{motiv.message}</span>
          </div>
        </div>
        <div className="card-right">
          <span className="badge" style={badgeStyle}>
            <span className={`badge-dot ${urgency === "critical" ? "blink" : ""}`} />
            {motiv.label}
          </span>
          <div className="countdown">
            {wLeft <= 0 ? (
              <div className="cdown-done" style={{ color: countdownColor }}>Done!</div>
            ) : (
              <>
                <div className="cdown-num" style={{ color: countdownColor }}>{wLeft}</div>
                <div className="cdown-lbl">days to go</div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="prog-wrap">
        <div className="prog-top">
          <span className="prog-label">Journey Progress (weekdays)</span>
          <span className="prog-pct" style={{ color: countdownColor }}>{pct}%</span>
        </div>
        <ProgressBar pct={pct} urgency={urgency} />
        <div className="prog-bot">
          <span>{wDone} days in</span>
          <span>{Math.max(0, wTotal - wDone)} days left</span>
        </div>
      </div>

      <div className="card-foot">
        <div className="foot-end">Ends <b>{fDate(t.endDate)}</b></div>
        <div className="foot-acts">
          <button className="btn btn-sm" onClick={() => onEdit(t)}><Icon.Edit /> Edit</button>
          <button className="btn btn-del" onClick={() => onDelete(t.id)}><Icon.Trash /> Remove</button>
        </div>
      </div>
    </div>
  );
}

// ── FORM ─────────────────────────────────────────────────────
function TraineeForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || { name: "", startDate: today(), hours: "", hoursPerDay: "8" }
  );
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const computed = useMemo(() => {
    const hrs = Number(form.hours);
    const hpd = Number(form.hoursPerDay) || 8;
    if (!form.startDate || !hrs || hrs <= 0 || hpd <= 0) return null;
    const workingDaysNeeded = Math.ceil(hrs / hpd);
    const endDate = addWeekdays(form.startDate, workingDaysNeeded);
    return { workingDaysNeeded, endDate };
  }, [form.startDate, form.hours, form.hoursPerDay]);

  const valid = form.name.trim() && form.startDate && Number(form.hours) > 0 && computed;

  const handleSave = () => {
    if (!valid) return;
    onSave({
      name:        form.name.trim(),
      startDate:   form.startDate,
      endDate:     computed.endDate,
      hours:       form.hours,
      hoursPerDay: form.hoursPerDay || "8",
    });
  };

  return (
    <>
      <div className="form-body">
        <div className="form-group">
          <label className="form-label">Full Name <span className="req">*</span></label>
          <input className="form-input" value={form.name}
            onChange={e => set("name", e.target.value)}
            placeholder="e.g. Juan dela Cruz" />
        </div>

        <div className="form-group">
          <label className="form-label">Start Date <span className="req">*</span></label>
          <input className="form-input" type="date" value={form.startDate}
            onChange={e => set("startDate", e.target.value)} />
          <span className="form-hint">The first day of their OJT (weekends auto-adjusted to Monday)</span>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Required Hours <span className="req">*</span></label>
            <input className="form-input" type="number" min="1" value={form.hours}
              onChange={e => set("hours", e.target.value)}
              placeholder="e.g. 900" />
          </div>
          <div className="form-group">
            <label className="form-label">Hours per Day</label>
            <input className="form-input" type="number" min="1" max="12" value={form.hoursPerDay}
              onChange={e => set("hoursPerDay", e.target.value)}
              placeholder="8" />
          </div>
        </div>

        {computed ? (
          <div className="calc-box">
            <div className="calc-title">Calculated Schedule</div>
            <div className="calc-row">
              <span className="calc-key"><Icon.Calendar /> End Date</span>
              <span className="calc-val">{fDate(computed.endDate)}</span>
            </div>
            <div className="calc-row">
              <span className="calc-key"><Icon.Clock /> Working Days</span>
              <span className="calc-val">{computed.workingDaysNeeded} days</span>
            </div>
            <div className="calc-row">
              <span className="calc-key"><Icon.Briefcase /> Daily Hours</span>
              <span className="calc-val">{form.hoursPerDay || 8} hrs/day (Mon–Fri)</span>
            </div>
            <div className="calc-note">
              <Icon.Info /> Weekends are excluded. End date is automatically calculated.
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12.5, color: "var(--t3)", padding: "10px 14px", background: "var(--bg-card2)", borderRadius: 8, border: "1px solid var(--bdr-soft)" }}>
            Fill in start date and required hours to see the calculated end date.
          </div>
        )}
      </div>

      <div className="form-foot">
        <button className="btn btn-sec" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" disabled={!valid} onClick={handleSave}>
          {initial ? "Save Changes" : "Add Trainee"}
        </button>
      </div>
    </>
  );
}

// ── MODAL ────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  useEffect(() => {
    const fn = e => e.key === "Escape" && onClose();
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <span className="modal-title">{title}</span>
          <button className="modal-x" onClick={onClose}><Icon.X /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── APP ROOT ─────────────────────────────────────────────────
export default function App() {
  const [theme,    setTheme]    = useState(() => localStorage.getItem("ojt-theme") || "light");
  const [trainees, setTrainees] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showAdd,  setShowAdd]  = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [deleting, setDeleting] = useState(null); // { id, name }
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("all");
  const [sort,     setSort]     = useState("endDate");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ojt-theme", theme);
  }, [theme]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "trainees"), snap => {
      setTrainees(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAdd    = async (f) => { try { await addDoc(collection(db,"trainees"), f); setShowAdd(false); } catch(e){console.error(e);} };
  const handleEdit   = async (f) => { try { await updateDoc(doc(db,"trainees",editing.id), f); setEditing(null); } catch(e){console.error(e);} };
  const handleDelete    = (id, name) => setDeleting({ id, name });
  const confirmDelete   = async () => {
    if (!deleting) return;
    try { await deleteDoc(doc(db,"trainees",deleting.id)); } catch(e){console.error(e);}
    setDeleting(null);
  };

  const counts = {
    all:      trainees.length,
    ok:       trainees.filter(t => getUrgency(t.startDate,t.endDate)==="ok").length,
    warning:  trainees.filter(t => getUrgency(t.startDate,t.endDate)==="warning").length,
    critical: trainees.filter(t => getUrgency(t.startDate,t.endDate)==="critical").length,
    done:     trainees.filter(t => getUrgency(t.startDate,t.endDate)==="done").length,
  };

  const visible = trainees
    .filter(t => filter === "all" || getUrgency(t.startDate,t.endDate) === filter)
    .filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => {
      if(sort==="name")   return a.name.localeCompare(b.name);
      if(sort==="pct")    return getPct(b.startDate,b.endDate) - getPct(a.startDate,a.endDate);
      if(sort==="recent") return new Date(b.startDate) - new Date(a.startDate);
      return weekdaysLeft(a.endDate) - weekdaysLeft(b.endDate);
    });

  return (
    <>
      <style>{CSS}</style>

      {/* NAVBAR */}
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-brand">
            <div className="nav-icon"><Icon.Logo /></div>
            <div>
              <div className="nav-title">Progressa</div>
              <div className="nav-sub">On-the-Job Training Monitor</div>
            </div>
          </div>
          <div className="nav-right">
            <PHTimeChip />
            <button className="theme-btn" onClick={() => setTheme(t => t==="light"?"dark":"light")}
              title={`Switch to ${theme==="light"?"dark":"light"} mode`}>
              {theme === "light" ? <Icon.Moon /> : <Icon.Sun />}
            </button>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
              <Icon.Plus /> Add Trainee
            </button>
          </div>
        </div>
      </nav>

      {/* PAGE */}
      <main className="page">

        {/* Journey Panel */}
        <JourneyPanel counts={counts} filter={filter} onFilter={setFilter} />

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-box">
            <span className="search-ico"><Icon.Search /></span>
            <input className="search-inp" placeholder="Search trainee name..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="sort-box">
            <span className="sort-ico"><Icon.SortAsc /></span>
            <select className="sort-sel" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="endDate">Ending Soonest</option>
              <option value="name">Name A – Z</option>
              <option value="pct">Progress %</option>
              <option value="recent">Recently Started</option>
            </select>
          </div>
        </div>

        {/* List header */}
        {!loading && (
          <div className="list-header">
            <span className="list-title">Trainees</span>
            <span className="list-count">Showing <b>{visible.length}</b> of <b>{trainees.length}</b></span>
          </div>
        )}

        {/* Content */}
        {loading ? <SkeletonList />
        : visible.length === 0 ? (
          <div className="empty">
            <div className="empty-ico"><Icon.Clipboard /></div>
            <div className="empty-title">{trainees.length===0 ? "No trainees yet" : "No results found"}</div>
            <div className="empty-desc">
              {trainees.length===0
                ? "Add your first OJT trainee to start tracking their journey!"
                : "Try adjusting your search or clearing the active filter."}
            </div>
            {trainees.length===0 && (
              <button className="btn btn-primary" onClick={()=>setShowAdd(true)}>
                <Icon.Plus /> Add First Trainee
              </button>
            )}
          </div>
        ) : (
          <div className="card-list">
            {visible.map((t,i) => (
              <TraineeCard key={t.id} t={t} idx={i} onEdit={setEditing} onDelete={(id) => handleDelete(id, t.name)} />
            ))}
          </div>
        )}
      </main>

      {showAdd && (
        <Modal title="Add New Trainee" onClose={() => setShowAdd(false)}>
          <TraineeForm onSave={handleAdd} onCancel={() => setShowAdd(false)} />
        </Modal>
      )}
      {editing && (
        <Modal title="Edit Trainee" onClose={() => setEditing(null)}>
          <TraineeForm initial={{ ...editing, hoursPerDay: editing.hoursPerDay || "8" }} onSave={handleEdit} onCancel={() => setEditing(null)} />
        </Modal>
      )}
      {deleting && (
        <DeleteModal
          name={deleting.name}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}