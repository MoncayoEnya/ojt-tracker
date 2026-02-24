// ============================================================
//  OJT TRACKER — App.jsx
//  Clean · Responsive · Firebase · Light/Dark · PH Time
// ============================================================

import { useState, useEffect, useRef, useMemo } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc,
} from "firebase/firestore";

// ── FIREBASE ──────────────────────────────────────────────────
const app = initializeApp({
  apiKey:            "AIzaSyDB8jGoY3NWTbGeHFnP2qTELG6ccRzypqw",
  authDomain:        "ojt-tracker-51ed1.firebaseapp.com",
  projectId:         "ojt-tracker-51ed1",
  storageBucket:     "ojt-tracker-51ed1.firebasestorage.app",
  messagingSenderId: "446065872296",
  appId:             "1:446065872296:web:e1e614fa0535af7e90619d",
});
const db = getFirestore(app);

// ── DATE UTILS ────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split("T")[0];

function isWeekday(d) { const day = new Date(d).getDay(); return day !== 0 && day !== 6; }

function countWeekdays(startStr, endStr) {
  const s = new Date(startStr), e = new Date(endStr);
  if (e <= s) return 0;
  let n = 0, c = new Date(s);
  while (c < e) { if (isWeekday(c)) n++; c.setDate(c.getDate() + 1); }
  return n;
}

function addWeekdays(startStr, days) {
  const d = new Date(startStr);
  while (!isWeekday(d)) d.setDate(d.getDate() + 1);
  let added = 0;
  while (added < days) { d.setDate(d.getDate() + 1); if (isWeekday(d)) added++; }
  return d.toISOString().split("T")[0];
}

function wdLeft(endStr) {
  const t = new Date(); t.setHours(0,0,0,0);
  const e = new Date(endStr); e.setHours(0,0,0,0);
  if (e <= t) return 0;
  return countWeekdays(todayStr(), endStr);
}

function wdDone(startStr) {
  const t = new Date(); t.setHours(23,59,59,999);
  if (t <= new Date(startStr)) return 0;
  return countWeekdays(startStr, todayStr());
}

function getUrgency(s, e) {
  const left = wdLeft(e), total = countWeekdays(s, e), done = wdDone(s);
  const pct  = total > 0 ? Math.round((done / total) * 100) : 100;
  if (left <= 0)               return "done";
  if (pct >= 85 || left <= 5)  return "critical";
  if (pct >= 60 || left <= 15) return "warning";
  return "ok";
}

function getPct(s, e) {
  const total = countWeekdays(s, e), done = wdDone(s);
  return Math.min(100, Math.max(0, total > 0 ? Math.round((done / total) * 100) : 0));
}

const fDate  = (d) => new Date(d).toLocaleDateString("en-PH", { month:"short", day:"numeric", year:"numeric" });
const fShort = (d) => new Date(d).toLocaleDateString("en-PH", { month:"short", day:"numeric" });

// ── PH TIME HOOK ─────────────────────────────────────────────
function usePHTime() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const ph   = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  const h    = ph.getHours(), m = ph.getMinutes(), s = ph.getSeconds();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12  = ((h % 12) || 12).toString().padStart(2,"0");
  const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const MONS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return {
    time: `${h12}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`,
    ampm, day: DAYS[ph.getDay()],
    date: `${MONS[ph.getMonth()]} ${ph.getDate()}, ${ph.getFullYear()}`,
  };
}

// ── ICONS ────────────────────────────────────────────────────
const I = {
  Logo:  () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  Sun:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>,
  Moon:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Plus:  () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Search:() => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Edit:  () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  Cal:   () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Clock: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Brief: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
  X:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  ChevL: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  ChevR: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Users: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Sort:  () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="18" x2="12" y2="18"/><polyline points="3 8 6 5 9 8"/><line x1="6" y1="5" x2="6" y2="19"/></svg>,
  Board: () => <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="12" y2="16"/></svg>,
  Info:  () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
};

// ── MILESTONES ────────────────────────────────────────────────
const MILESTONES = [
  { key:"ok",       label:"Crushing It", tagline:"On track",         color:"#10b981", bg:"rgba(16,185,129,0.1)",  bdr:"rgba(16,185,129,0.3)",
    icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg> },
  { key:"warning",  label:"Pick It Up",  tagline:"Needs a boost",    color:"#f59e0b", bg:"rgba(245,158,11,0.1)",  bdr:"rgba(245,158,11,0.3)",
    icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
  { key:"critical", label:"Final Push",  tagline:"Sprint to finish", color:"#ef4444", bg:"rgba(239,68,68,0.1)",   bdr:"rgba(239,68,68,0.3)",
    icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg> },
  { key:"done",     label:"Graduated!",  tagline:"Mission complete", color:"#8b5cf6", bg:"rgba(139,92,246,0.1)",  bdr:"rgba(139,92,246,0.3)",
    icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><path d="M7 4H4a2 2 0 0 0-2 2v4a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4V6a2 2 0 0 0-2-2h-3"/><path d="M7 4h10v8a5 5 0 0 1-10 0V4z"/></svg> },
];

const MOTIV = {
  ok:       { label:"Crushing It", msg:"Smooth sailing — keep that momentum going!" },
  warning:  { label:"Pick It Up",  msg:"A little extra push makes all the difference!" },
  critical: { label:"Final Push",  msg:"The finish line is close — give it everything!" },
  done:     { label:"Graduated!",  msg:"OJT complete — incredible work, future is bright!" },
};

// ── CSS ───────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

  :root {
    --bg:#f0f2f5; --bg-card:#fff; --bg-card2:#f8f9fb; --bg-input:#fff; --bg-hover:#f3f4f6; --bg-nav:rgba(255,255,255,.9);
    --bdr:#e4e7ec; --bdr-s:#edf0f3; --bdr-focus:#3b82f6;
    --t1:#0f172a; --t2:#334155; --t3:#64748b; --t4:#94a3b8;
    --acc:#2563eb; --acc-h:#1d4ed8; --acc-ring:rgba(37,99,235,.15); --acc-soft:rgba(37,99,235,.06);
    --sh-sm:0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04);
    --sh-md:0 4px 16px rgba(0,0,0,.08),0 2px 6px rgba(0,0,0,.04);
    --sh-lg:0 24px 56px rgba(0,0,0,.13),0 8px 24px rgba(0,0,0,.07);
    --ok-bg:#dcfce7; --ok-t:#15803d; --ok-bdr:#bbf7d0; --ok-bar:#22c55e; --ok-soft:rgba(34,197,94,.08);
    --wa-bg:#fef9c3; --wa-t:#a16207; --wa-bdr:#fde047; --wa-bar:#eab308; --wa-soft:rgba(234,179,8,.08);
    --cr-bg:#fee2e2; --cr-t:#dc2626; --cr-bdr:#fca5a5; --cr-bar:#ef4444; --cr-soft:rgba(239,68,68,.08);
    --dn-bg:#ede9fe; --dn-t:#7c3aed; --dn-bdr:#c4b5fd; --dn-bar:#8b5cf6; --dn-soft:rgba(139,92,246,.08);
  }
  [data-theme="dark"] {
    --bg:#0a0d14; --bg-card:#131720; --bg-card2:#0e1118; --bg-input:#0a0d14; --bg-hover:#1a2030; --bg-nav:rgba(10,13,20,.92);
    --bdr:#1e2739; --bdr-s:#161c28; --bdr-focus:#3b82f6;
    --t1:#f1f5f9; --t2:#cbd5e1; --t3:#64748b; --t4:#334155;
    --acc:#3b82f6; --acc-h:#2563eb; --acc-ring:rgba(59,130,246,.2); --acc-soft:rgba(59,130,246,.09);
    --sh-sm:0 1px 3px rgba(0,0,0,.4); --sh-md:0 4px 16px rgba(0,0,0,.55); --sh-lg:0 24px 56px rgba(0,0,0,.75);
    --ok-bg:rgba(20,83,45,.22);  --ok-t:#4ade80;  --ok-bdr:rgba(74,222,128,.18);  --ok-bar:#22c55e; --ok-soft:rgba(34,197,94,.1);
    --wa-bg:rgba(113,63,18,.22); --wa-t:#fbbf24;  --wa-bdr:rgba(251,191,36,.18);  --wa-bar:#eab308; --wa-soft:rgba(234,179,8,.1);
    --cr-bg:rgba(127,29,29,.22); --cr-t:#f87171;  --cr-bdr:rgba(248,113,113,.18); --cr-bar:#ef4444; --cr-soft:rgba(239,68,68,.1);
    --dn-bg:rgba(76,29,149,.22); --dn-t:#a78bfa;  --dn-bdr:rgba(167,139,250,.18); --dn-bar:#8b5cf6; --dn-soft:rgba(139,92,246,.1);
  }

  html { scroll-behavior:smooth; -webkit-text-size-adjust:100%; }
  body { background:var(--bg); color:var(--t1); font-family:'Inter',system-ui,sans-serif; min-height:100vh; line-height:1.6; -webkit-font-smoothing:antialiased; transition:background .25s,color .25s; }
  button { font-family:inherit; cursor:pointer; }
  input,select { font-family:inherit; }
  [data-theme="dark"] input[type="date"]::-webkit-calendar-picker-indicator { filter:invert(.6); }
  ::-webkit-scrollbar { width:5px; height:5px; }
  ::-webkit-scrollbar-thumb { background:var(--bdr); border-radius:4px; }

  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
  @keyframes scaleIn { from{opacity:0;transform:scale(.96) translateY(8px)} to{opacity:1;transform:none} }
  @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes popIn   { 0%{opacity:0;transform:scale(.88)} 70%{transform:scale(1.03)} 100%{opacity:1;transform:none} }
  @keyframes pulse   { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.6);opacity:.6} }

  /* NAV */
  .nav { position:sticky; top:0; z-index:100; background:var(--bg-nav); backdrop-filter:blur(20px) saturate(180%); -webkit-backdrop-filter:blur(20px) saturate(180%); border-bottom:1px solid var(--bdr); }
  .nav-inner { max-width:1080px; margin:0 auto; padding:0 20px; height:60px; display:flex; align-items:center; justify-content:space-between; gap:12px; }
  .nav-brand { display:flex; align-items:center; gap:10px; flex-shrink:0; }
  .nav-logo  { width:34px; height:34px; border-radius:9px; background:var(--acc); color:#fff; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 10px var(--acc-ring); flex-shrink:0; }
  .nav-title { font-size:15px; font-weight:800; color:var(--t1); letter-spacing:-.3px; line-height:1.2; }
  .nav-sub   { font-size:10.5px; color:var(--t3); line-height:1; }
  .nav-right { display:flex; align-items:center; gap:8px; }

  /* PH chip */
  .ph-chip { display:flex; align-items:center; gap:8px; background:var(--bg-card2); border:1px solid var(--bdr); border-radius:9px; padding:5px 12px; }
  .ph-dot  { width:6px; height:6px; border-radius:50%; background:#22c55e; animation:pulse 2.5s ease infinite; flex-shrink:0; }
  .ph-tval { font-family:'JetBrains Mono',monospace; font-size:13px; font-weight:600; color:var(--t1); line-height:1.1; }
  .ph-ampm { font-size:9px; font-weight:700; color:var(--acc); letter-spacing:.06em; text-transform:uppercase; }
  .ph-sep  { width:1px; height:22px; background:var(--bdr); flex-shrink:0; }
  .ph-day  { font-size:10px; font-weight:700; color:var(--t2); letter-spacing:.04em; text-transform:uppercase; line-height:1.3; }
  .ph-date { font-size:10px; color:var(--t3); line-height:1.3; }

  /* Buttons */
  .btn { display:inline-flex; align-items:center; gap:5px; font-weight:600; font-size:13px; border-radius:8px; border:none; cursor:pointer; transition:all .15s ease; white-space:nowrap; line-height:1; }
  .btn-primary { background:var(--acc); color:#fff; padding:9px 15px; box-shadow:0 1px 3px rgba(0,0,0,.1); }
  .btn-primary:hover  { background:var(--acc-h); transform:translateY(-1px); box-shadow:0 4px 12px var(--acc-ring); }
  .btn-primary:active { transform:none; }
  .btn-primary:disabled { opacity:.4; cursor:not-allowed; transform:none; }
  .btn-sec    { background:var(--bg-card); color:var(--t2); padding:9px 15px; border:1px solid var(--bdr); }
  .btn-sec:hover { background:var(--bg-hover); color:var(--t1); }
  .btn-sm     { background:var(--bg-card2); color:var(--t3); padding:7px 11px; border:1px solid var(--bdr-s); font-size:12px; }
  .btn-sm:hover { background:var(--bg-hover); color:var(--t2); border-color:var(--bdr); }
  .btn-del    { background:var(--cr-soft); color:var(--cr-t); padding:7px 11px; border:1px solid var(--cr-bdr); font-size:12px; }
  .btn-del:hover { background:var(--cr-bg); border-color:var(--cr-t); }
  .btn-danger { background:var(--cr-bar); color:#fff; padding:9px 16px; border:none; }
  .btn-danger:hover { background:#dc2626; transform:translateY(-1px); box-shadow:0 4px 14px rgba(239,68,68,.35); }
  .btn-icon   { width:34px; height:34px; border-radius:8px; background:transparent; border:1px solid var(--bdr); color:var(--t3); display:flex; align-items:center; justify-content:center; transition:all .15s; cursor:pointer; }
  .btn-icon:hover { background:var(--bg-hover); color:var(--t1); }

  /* Page */
  .page { max-width:1080px; margin:0 auto; padding:24px 20px 80px; }

  /* Journey Board */
  .board { background:var(--bg-card); border:1px solid var(--bdr); border-radius:14px; padding:20px; box-shadow:var(--sh-sm); margin-bottom:20px; }
  .board-top { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:16px; flex-wrap:wrap; }
  .board-left { display:flex; align-items:center; gap:10px; }
  .board-badge { display:flex; align-items:center; gap:7px; background:var(--acc-soft); border:1px solid var(--acc-ring); border-radius:8px; padding:6px 12px; color:var(--acc); flex-shrink:0; }
  .board-badge-num { font-family:'JetBrains Mono',monospace; font-size:18px; font-weight:800; line-height:1; }
  .board-title { font-size:14px; font-weight:700; color:var(--t1); }
  .board-sub   { font-size:12px; color:var(--t3); margin-top:1px; }

  /* Donut */
  .donut-wrap  { position:relative; width:52px; height:52px; flex-shrink:0; }
  .donut-svg   { width:52px; height:52px; transform:rotate(-90deg); }
  .donut-label { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
  .donut-pct   { font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:800; color:var(--t1); line-height:1; }
  .donut-sub   { font-size:8px; color:var(--t3); font-weight:600; text-transform:uppercase; letter-spacing:.04em; }

  /* Milestone grid */
  .ms-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:8px; }
  .ms-card {
    background:var(--bg-card2); border:1.5px solid var(--bdr-s); border-radius:11px;
    padding:12px 10px 10px; text-align:left; cursor:pointer;
    transition:all .18s ease; animation:popIn .4s ease both;
    position:relative; overflow:hidden;
    -webkit-tap-highlight-color:transparent;
  }
  .ms-card::after { content:''; position:absolute; top:0; left:0; right:0; height:2.5px; background:var(--mc); border-radius:11px 11px 0 0; opacity:0; transition:opacity .18s; }
  .ms-card:hover  { border-color:var(--mc-bdr); background:var(--mc-bg); transform:translateY(-2px); box-shadow:0 6px 20px var(--mc-glow); }
  .ms-card:hover::after { opacity:1; }
  .ms-card.active { border-color:var(--mc-bdr); background:var(--mc-bg); box-shadow:0 4px 16px var(--mc-glow); }
  .ms-card.active::after { opacity:1; }
  .ms-card:active { transform:translateY(0) scale(.98); }
  .ms-icon  { color:var(--mc); margin-bottom:7px; }
  .ms-num   { font-family:'JetBrains Mono',monospace; font-size:22px; font-weight:800; color:var(--mc); line-height:1; margin-bottom:3px; }
  .ms-label { font-size:11px; font-weight:700; color:var(--t2); margin-bottom:1px; }
  .ms-tag   { font-size:9.5px; color:var(--t3); }
  .ms-bar   { height:3px; background:var(--bdr-s); border-radius:99px; margin-top:8px; overflow:hidden; }
  .ms-bar-f { height:100%; background:var(--mc); border-radius:99px; transition:width .6s ease; }
  .ms-adot  { position:absolute; top:6px; right:6px; width:6px; height:6px; border-radius:50%; background:var(--mc); animation:pulse 1.8s ease infinite; }

  /* Toolbar */
  .toolbar   { display:flex; gap:10px; margin-bottom:16px; }
  .sw { flex:1; position:relative; min-width:0; }
  .si { position:absolute; left:11px; top:50%; transform:translateY(-50%); color:var(--t4); pointer-events:none; display:flex; }
  .sinp {
    width:100%; background:var(--bg-card); border:1px solid var(--bdr); border-radius:8px;
    padding:9px 12px 9px 34px; color:var(--t1); font-size:13.5px; outline:none; box-shadow:var(--sh-sm);
    transition:border-color .15s,box-shadow .15s;
  }
  .sinp:focus { border-color:var(--bdr-focus); box-shadow:0 0 0 3px var(--acc-ring); }
  .sinp::placeholder { color:var(--t4); }
  .sortw { position:relative; display:flex; align-items:center; flex-shrink:0; }
  .sorti { position:absolute; left:10px; color:var(--t3); pointer-events:none; display:flex; }
  .sels  {
    background:var(--bg-card); border:1px solid var(--bdr); border-radius:8px;
    padding:9px 12px 9px 30px; color:var(--t2); font-size:13px; outline:none;
    cursor:pointer; appearance:none; box-shadow:var(--sh-sm); min-width:158px; transition:border-color .15s;
  }
  .sels:focus { border-color:var(--bdr-focus); }

  /* List header */
  .lhdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
  .lhdr-t { font-size:11.5px; font-weight:700; color:var(--t3); text-transform:uppercase; letter-spacing:.07em; }
  .lhdr-c { font-size:12px; color:var(--t4); }
  .lhdr-c b { color:var(--t3); font-weight:600; }

  /* Trainee card */
  .card { background:var(--bg-card); border:1px solid var(--bdr); border-radius:12px; padding:18px 20px; box-shadow:var(--sh-sm); position:relative; overflow:hidden; transition:box-shadow .2s,border-color .2s,transform .2s; animation:slideUp .35s ease both; }
  .card::before { content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background:var(--cl); border-radius:3px 0 0 3px; }
  .card.ok       { --cl:var(--ok-bar); }
  .card.warning  { --cl:var(--wa-bar); }
  .card.critical { --cl:var(--cr-bar); }
  .card.done     { --cl:var(--dn-bar); }
  .card:hover { box-shadow:var(--sh-md); border-color:var(--t4); transform:translateY(-1px); }
  .card-list { display:flex; flex-direction:column; gap:8px; }
  .card-top  { display:flex; justify-content:space-between; align-items:flex-start; gap:14px; margin-bottom:13px; }
  .card-left { flex:1; min-width:0; }
  .card-name { font-size:15px; font-weight:700; color:var(--t1); margin-bottom:7px; letter-spacing:-.2px; }
  .pills     { display:flex; flex-wrap:wrap; gap:5px; margin-bottom:8px; }
  .pill      { display:inline-flex; align-items:center; gap:4px; font-size:11px; color:var(--t3); font-weight:500; background:var(--bg-card2); border:1px solid var(--bdr-s); border-radius:5px; padding:3px 8px; font-family:'JetBrains Mono',monospace; }
  .card-motiv { font-size:11.5px; color:var(--t3); font-style:italic; }
  .card-right { display:flex; flex-direction:column; align-items:flex-end; gap:6px; flex-shrink:0; }

  /* Badge */
  .badge { display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:700; padding:3px 9px; border-radius:20px; white-space:nowrap; background:var(--b-bg); color:var(--b-t); border:1px solid var(--b-bdr); }
  .bdot  { width:5px; height:5px; border-radius:50%; background:currentColor; flex-shrink:0; }
  .bdot.blink { animation:blink 1.4s ease-in-out infinite; }

  /* Countdown */
  .cdown     { text-align:right; }
  .cdown-num { font-family:'JetBrains Mono',monospace; font-size:26px; font-weight:800; line-height:1; }
  .cdown-lbl { font-size:10px; color:var(--t3); font-weight:600; margin-top:2px; text-transform:uppercase; letter-spacing:.07em; }
  .cdown-dn  { font-family:'JetBrains Mono',monospace; font-size:13px; font-weight:700; }

  /* Progress */
  .prog-wrap { margin-bottom:12px; }
  .prog-top  { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:6px; }
  .prog-lbl  { font-size:11.5px; color:var(--t3); font-weight:500; }
  .prog-pct  { font-family:'JetBrains Mono',monospace; font-size:12px; font-weight:700; }
  .prog-trk  { height:6px; background:var(--bg-card2); border-radius:99px; overflow:hidden; border:1px solid var(--bdr-s); }
  .prog-fill { height:100%; border-radius:99px; transition:width 1s cubic-bezier(.34,1.2,.64,1); }
  .prog-fill.ok       { background:var(--ok-bar); }
  .prog-fill.warning  { background:var(--wa-bar); }
  .prog-fill.critical { background:var(--cr-bar); animation:blink 2s ease-in-out infinite; }
  .prog-fill.done     { background:var(--dn-bar); }
  .prog-bot  { display:flex; justify-content:space-between; margin-top:5px; font-size:10.5px; color:var(--t4); font-family:'JetBrains Mono',monospace; }

  /* Card footer */
  .card-foot { display:flex; align-items:center; justify-content:space-between; padding-top:12px; border-top:1px solid var(--bdr-s); gap:8px; flex-wrap:wrap; }
  .foot-info { font-size:11.5px; color:var(--t3); display:flex; align-items:center; gap:7px; flex-wrap:wrap; }
  .foot-info b { color:var(--t2); font-weight:600; }
  .abs-tag   { font-size:11px; font-weight:700; color:var(--cr-t); background:var(--cr-bg); border:1px solid var(--cr-bdr); border-radius:5px; padding:1px 7px; white-space:nowrap; }
  .foot-acts { display:flex; gap:5px; flex-shrink:0; }

  /* Overlay */
  .overlay { position:fixed; inset:0; z-index:200; background:rgba(0,0,0,.4); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; padding:16px; animation:fadeIn .2s ease; overflow-y:auto; }
  [data-theme="dark"] .overlay { background:rgba(0,0,0,.65); }

  /* Form modal */
  .modal { background:var(--bg-card); border:1px solid var(--bdr); border-radius:16px; width:100%; max-width:460px; box-shadow:var(--sh-lg); animation:scaleIn .22s ease; flex-shrink:0; }
  .modal-head  { display:flex; justify-content:space-between; align-items:center; padding:18px 20px 16px; border-bottom:1px solid var(--bdr); }
  .modal-title { font-size:15px; font-weight:800; color:var(--t1); }
  .modal-x     { width:28px; height:28px; border-radius:6px; background:transparent; border:1px solid var(--bdr); color:var(--t3); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all .15s; }
  .modal-x:hover { background:var(--bg-hover); color:var(--t1); }
  .form-body   { padding:18px 20px; display:flex; flex-direction:column; gap:14px; }
  .form-row    { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .form-group  { display:flex; flex-direction:column; gap:4px; }
  .form-label  { font-size:12.5px; font-weight:600; color:var(--t2); }
  .req         { color:var(--cr-t); margin-left:2px; }
  .form-input  { background:var(--bg-input); border:1px solid var(--bdr); border-radius:8px; padding:9px 12px; color:var(--t1); font-size:13.5px; outline:none; width:100%; transition:border-color .15s,box-shadow .15s; }
  .form-input:focus { border-color:var(--bdr-focus); box-shadow:0 0 0 3px var(--acc-ring); }
  .form-input::placeholder { color:var(--t4); }
  .form-hint   { font-size:11px; color:var(--t3); }
  .calc-box    { background:var(--acc-soft); border:1px solid var(--acc-ring); border-radius:9px; padding:13px 15px; display:flex; flex-direction:column; gap:6px; }
  .calc-row    { display:flex; justify-content:space-between; align-items:center; }
  .calc-key    { font-size:12px; color:var(--t3); display:flex; align-items:center; gap:4px; }
  .calc-val    { font-size:12.5px; font-weight:700; color:var(--t1); font-family:'JetBrains Mono',monospace; }
  .calc-title  { font-size:11px; font-weight:700; color:var(--acc); text-transform:uppercase; letter-spacing:.06em; margin-bottom:3px; }
  .form-foot   { display:flex; gap:8px; justify-content:flex-end; padding:14px 20px; border-top:1px solid var(--bdr); background:var(--bg-card2); border-radius:0 0 16px 16px; }

  /* Delete modal */
  .del-modal { background:var(--bg-card); border:1px solid var(--bdr); border-radius:16px; width:100%; max-width:360px; box-shadow:var(--sh-lg); animation:scaleIn .22s ease; overflow:hidden; flex-shrink:0; }
  .del-body  { display:flex; flex-direction:column; align-items:center; padding:28px 24px 20px; text-align:center; gap:10px; }
  .del-ring  { width:50px; height:50px; border-radius:50%; background:var(--cr-bg); border:1.5px solid var(--cr-bdr); display:flex; align-items:center; justify-content:center; color:var(--cr-t); }
  .del-title { font-size:15px; font-weight:800; color:var(--t1); }
  .del-nm    { font-size:13px; font-weight:700; color:var(--acc); background:var(--acc-soft); border:1px solid var(--acc-ring); border-radius:6px; padding:3px 10px; }
  .del-desc  { font-size:12.5px; color:var(--t3); line-height:1.6; max-width:280px; }
  .del-foot  { display:flex; gap:8px; padding:14px 20px; border-top:1px solid var(--bdr); background:var(--bg-card2); }
  .del-foot .btn { flex:1; justify-content:center; }

  /* Calendar overlay */
  .cal-ov {
    position:fixed; inset:0; z-index:300;
    background:rgba(0,0,0,.5); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);
    display:flex; align-items:flex-start; justify-content:center;
    padding:16px; animation:fadeIn .2s ease; overflow-y:auto; -webkit-overflow-scrolling:touch;
  }
  [data-theme="dark"] .cal-ov { background:rgba(0,0,0,.72); }

  /* Calendar modal */
  .cal-box {
    background:var(--bg-card); border:1px solid var(--bdr);
    border-radius:18px; width:100%; max-width:460px;
    box-shadow:var(--sh-lg); animation:scaleIn .22s ease;
    overflow:hidden; flex-shrink:0; margin:auto;
  }

  /* Cal header */
  .cal-hd { padding:18px 20px 16px; background:linear-gradient(120deg,var(--acc-soft) 0%,transparent 80%); border-bottom:1px solid var(--bdr); }
  .cal-hdr { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; margin-bottom:12px; }
  .cal-name  { font-size:16px; font-weight:800; color:var(--t1); letter-spacing:-.3px; margin-bottom:3px; }
  .cal-range { font-size:11px; color:var(--t3); display:flex; align-items:center; gap:4px; }

  /* Cal stats */
  .cal-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
  .cal-stat  { background:var(--bg-card); border:1px solid var(--bdr); border-radius:9px; padding:9px 8px; text-align:center; }
  .cst-n { font-family:'JetBrains Mono',monospace; font-size:16px; font-weight:800; color:var(--t1); line-height:1; }
  .cst-l { font-size:9.5px; color:var(--t3); font-weight:600; text-transform:uppercase; letter-spacing:.05em; margin-top:2px; }
  .cal-stat.s-a .cst-n { color:var(--cr-t); }
  .cal-stat.s-e .cst-n { color:var(--wa-t); }

  /* Cal nav */
  .cal-nav { display:flex; align-items:center; justify-content:space-between; padding:14px 20px 8px; }
  .cal-nb  { width:32px; height:32px; border-radius:8px; background:var(--bg-card2); border:1px solid var(--bdr); color:var(--t2); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all .15s; flex-shrink:0; -webkit-tap-highlight-color:transparent; }
  .cal-nb:hover  { background:var(--bg-hover); color:var(--t1); }
  .cal-nb:active { transform:scale(.9); }
  .cal-mo { font-size:14px; font-weight:800; color:var(--t1); letter-spacing:-.3px; }

  /* Day of week */
  .cal-dows { display:grid; grid-template-columns:repeat(7,1fr); padding:0 14px; gap:3px; margin-bottom:4px; }
  .cal-dow  { text-align:center; font-size:10px; font-weight:700; letter-spacing:.04em; padding:3px 0; }
  .dw-wd    { color:var(--t4); text-transform:uppercase; }
  .dw-we    { color:var(--cr-t); opacity:.65; }

  /* Grid */
  .cal-grid { display:grid; grid-template-columns:repeat(7,1fr); padding:0 14px 14px; gap:3px; }
  .cal-day  {
    aspect-ratio:1; display:flex; flex-direction:column; align-items:center; justify-content:center;
    border-radius:9px; font-size:12.5px; font-weight:500; border:1.5px solid transparent;
    position:relative; transition:all .15s ease; user-select:none;
    -webkit-tap-highlight-color:transparent; min-width:0;
  }
  .cd-n  { line-height:1; font-weight:600; }
  .cd-d  { width:4px; height:4px; border-radius:50%; margin-top:2px; }
  .cd-x  { position:absolute; top:1px; right:2px; font-size:7.5px; font-weight:900; color:var(--cr-t); line-height:1; }

  /* Day states */
  .d-empty   { pointer-events:none; }
  .d-out     { color:var(--bdr); pointer-events:none; }
  .d-we      { color:var(--t4); background:var(--bg-card2); pointer-events:none; }
  .d-done    { background:var(--ok-soft); color:var(--ok-t); border-color:var(--ok-bdr); }
  .d-absent  { background:var(--cr-bg); color:var(--cr-t); border-color:var(--cr-bdr); cursor:pointer; font-weight:700; }
  .d-today   { background:var(--acc-soft); color:var(--acc); border-color:var(--acc-ring); font-weight:800; }
  .d-up      { background:var(--bg-card2); color:var(--t3); border-color:var(--bdr-s); }
  .d-click   { cursor:pointer; }
  .d-click:hover      { transform:scale(1.1); box-shadow:0 4px 12px rgba(0,0,0,.12); z-index:1; }
  .d-absent:hover     { transform:scale(1.1); background:var(--cr-bdr); }
  .d-up.d-click:hover { background:var(--cr-soft); color:var(--cr-t); border-color:var(--cr-bdr); }
  .d-saving  { opacity:.4; pointer-events:none; }

  /* Legend */
  .cal-leg { display:flex; flex-wrap:wrap; gap:8px 14px; padding:10px 20px 12px; border-top:1px solid var(--bdr-s); background:var(--bg-card2); }
  .leg-i   { display:flex; align-items:center; gap:5px; font-size:11px; color:var(--t3); }
  .leg-sq  { width:11px; height:11px; border-radius:3px; border:1.5px solid transparent; flex-shrink:0; }

  /* Cal footer */
  .cal-ft { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:12px 20px; border-top:1px solid var(--bdr); background:var(--bg-card); flex-wrap:wrap; }
  .cal-hint  { font-size:11.5px; color:var(--t3); flex:1; min-width:0; }
  .cal-saved { font-size:12px; color:var(--ok-t); font-weight:700; }
  .cal-svng  { font-size:11.5px; color:var(--t3); }

  /* Empty */
  .empty { text-align:center; padding:60px 24px; border:1.5px dashed var(--bdr); border-radius:14px; background:var(--bg-card); animation:fadeIn .35s ease; }
  .empty-ico   { color:var(--t4); margin-bottom:12px; display:flex; justify-content:center; }
  .empty-title { font-size:16px; font-weight:700; color:var(--t2); margin-bottom:6px; }
  .empty-desc  { font-size:13px; color:var(--t3); margin-bottom:20px; max-width:280px; margin-left:auto; margin-right:auto; line-height:1.7; }

  /* Skeleton */
  .skel-list { display:flex; flex-direction:column; gap:8px; }
  .skel-card { background:var(--bg-card); border:1px solid var(--bdr); border-radius:12px; padding:18px 20px; }
  .skel-line { background:var(--bdr-s); border-radius:5px; animation:blink 1.6s ease infinite; }

  /* ── RESPONSIVE ── */
  @media (max-width:860px) {
    .ms-grid { grid-template-columns:repeat(3,1fr); }
  }
  @media (max-width:640px) {
    .nav-inner { padding:0 14px; height:56px; }
    .nav-sub   { display:none; }
    .ph-chip   { display:none; }
    .page      { padding:14px 14px 70px; }
    .board     { padding:14px; border-radius:12px; }
    .ms-grid   { grid-template-columns:repeat(2,1fr); gap:6px; }
    .ms-num    { font-size:19px; }
    .ms-tag    { display:none; }
    .toolbar   { flex-direction:column; gap:8px; }
    .sortw,.sels { width:100%; }
    .card      { padding:14px 15px; }
    .card-top  { flex-direction:column; gap:8px; }
    .card-right { flex-direction:row; align-items:center; justify-content:space-between; width:100%; }
    .cdown     { text-align:left; }
    .cdown-num { font-size:22px; }
    .card-foot { flex-direction:column; align-items:flex-start; gap:8px; }
    .foot-acts { width:100%; }
    .btn-sm,.btn-del { flex:1; justify-content:center; }
    .form-row  { grid-template-columns:1fr; }
    .cal-box   { border-radius:14px; }
    .cal-stats { grid-template-columns:repeat(2,1fr); }
    .cal-hd    { padding:14px 14px 12px; }
    .cal-nav   { padding:10px 14px 6px; }
    .cal-dows  { padding:0 8px; gap:2px; }
    .cal-grid  { padding:0 8px 12px; gap:2px; }
    .cal-day   { border-radius:7px; font-size:11.5px; }
    .cal-leg   { padding:8px 14px 10px; gap:6px 12px; }
    .cal-ft    { padding:10px 14px; }
  }
  @media (max-width:380px) {
    .ms-grid   { grid-template-columns:repeat(2,1fr); }
    .cal-day   { font-size:10.5px; }
    .cal-dow   { font-size:9px; }
    .cst-n     { font-size:14px; }
    .nav-title { font-size:13.5px; }
  }
  @media (min-width:1024px) {
    .card  { padding:20px 24px; }
    .board { padding:22px; }
  }
`;

// ── PROGRESS BAR ─────────────────────────────────────────────
function ProgressBar({ pct, urgency }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.width = "0%";
    const t = setTimeout(() => { if (ref.current) ref.current.style.width = pct + "%"; }, 80);
    return () => clearTimeout(t);
  }, [pct]);
  return <div className="prog-trk"><div ref={ref} className={`prog-fill ${urgency}`} /></div>;
}

// ── PH TIME CHIP ─────────────────────────────────────────────
function PHTimeChip() {
  const { time, ampm, day, date } = usePHTime();
  return (
    <div className="ph-chip">
      <div className="ph-dot" />
      <div>
        <div className="ph-tval">{time}</div>
        <div className="ph-ampm">{ampm} · PHT</div>
      </div>
      <div className="ph-sep" />
      <div>
        <div className="ph-day">{day}</div>
        <div className="ph-date">{date}</div>
      </div>
    </div>
  );
}

// ── SKELETON ─────────────────────────────────────────────────
function SkeletonList() {
  return (
    <div className="skel-list">
      {[70,55,65].map((w,i) => (
        <div key={i} className="skel-card">
          <div className="skel-line" style={{ width:`${w}%`, height:13, marginBottom:12 }} />
          <div className="skel-line" style={{ width:"38%", height:9, marginBottom:18 }} />
          <div className="skel-line" style={{ width:"100%", height:6, borderRadius:99, marginBottom:7 }} />
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <div className="skel-line" style={{ width:"26%", height:9 }} />
            <div className="skel-line" style={{ width:"16%", height:9 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── JOURNEY BOARD ─────────────────────────────────────────────
function JourneyBoard({ counts, filter, onFilter }) {
  const total   = counts.all;
  const pctDone = total > 0 ? Math.round((counts.done / total) * 100) : 0;
  const R = 17, C = 2 * Math.PI * R;

  const cards = [
    { key:"all", label:"All Trainees", tagline:"Everyone enrolled", color:"#3b82f6", bg:"rgba(59,130,246,0.1)", bdr:"rgba(59,130,246,0.3)",
      icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    ...MILESTONES,
  ];

  return (
    <div className="board">
      <div className="board-top">
        <div className="board-left">
          <div className="board-badge">
            <I.Users />
            <span className="board-badge-num">{total}</span>
          </div>
          <div>
            <div className="board-title">Trainee Journey Board</div>
            <div className="board-sub">
              {total === 0 ? "No trainees yet — add your first!" : `${counts.done} of ${total} completed OJT`}
            </div>
          </div>
        </div>
        {total > 0 && (
          <div className="donut-wrap">
            <svg className="donut-svg" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r={R} fill="none" stroke="var(--bdr)" strokeWidth="3.5" />
              <circle cx="20" cy="20" r={R} fill="none" stroke="#8b5cf6" strokeWidth="3.5"
                strokeDasharray={`${(pctDone/100)*C} ${C}`} strokeLinecap="round"
                style={{ transition:"stroke-dasharray 1s ease" }} />
            </svg>
            <div className="donut-label">
              <span className="donut-pct">{pctDone}%</span>
              <span className="donut-sub">done</span>
            </div>
          </div>
        )}
      </div>

      <div className="ms-grid">
        {cards.map((m, i) => {
          const count    = m.key === "all" ? total : (counts[m.key] || 0);
          const isActive = filter === m.key;
          const barW     = m.key === "all" ? 100 : (total > 0 ? Math.round((count/total)*100) : 0);
          return (
            <button key={m.key}
              className={`ms-card${isActive ? " active" : ""}`}
              style={{ "--mc":m.color, "--mc-bg":m.bg, "--mc-bdr":m.bdr, "--mc-glow":m.bdr, animationDelay:`${i*0.06}s` }}
              onClick={() => onFilter(m.key === "all" ? "all" : (filter === m.key ? "all" : m.key))}
            >
              <div className="ms-icon">{m.icon}</div>
              <div className="ms-num">{count}</div>
              <div className="ms-label">{m.label}</div>
              <div className="ms-tag">{m.tagline}</div>
              <div className="ms-bar"><div className="ms-bar-f" style={{ width:`${barW}%` }} /></div>
              {isActive && <div className="ms-adot" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── CALENDAR MODAL ────────────────────────────────────────────
function CalendarModal({ trainee, onClose }) {
  const absences = Array.isArray(trainee.absences) ? trainee.absences : [];
  const today    = todayStr();
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [vy, setVy] = useState(() => parseInt(trainee.startDate.slice(0,4)));
  const [vm, setVm] = useState(() => parseInt(trainee.startDate.slice(5,7)) - 1);

  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  const baseDays = Math.ceil(Number(trainee.hours) / (Number(trainee.hoursPerDay) || 8));
  const adjEnd   = addWeekdays(trainee.startDate, baseDays + absences.length);
  const dLeft    = wdLeft(adjEnd);

  const toggleAbsence = async (ds) => {
    const newAbs = absences.includes(ds)
      ? absences.filter(d => d !== ds)
      : [...absences, ds].sort();
    const newEnd = addWeekdays(trainee.startDate, baseDays + newAbs.length);
    setSaving(true); setSaved(false);
    try {
      await updateDoc(doc(db, "trainees", trainee.id), { absences: newAbs, endDate: newEnd });
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch(e) { console.error(e); }
    setSaving(false);
  };

  const prevM = () => vm === 0  ? (setVm(11), setVy(y=>y-1)) : setVm(m=>m-1);
  const nextM = () => vm === 11 ? (setVm(0),  setVy(y=>y+1)) : setVm(m=>m+1);

  // Build grid
  const firstDow    = new Date(vy, vm, 1).getDay();
  const daysInMonth = new Date(vy, vm+1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const ds      = `${vy}-${String(vm+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const dow     = new Date(ds + "T12:00:00").getDay();
    const weekend = dow === 0 || dow === 6;
    const inRange = ds >= trainee.startDate && ds <= adjEnd;
    const isAbs   = absences.includes(ds);
    const isToday = ds === today;
    const isPast  = ds < today;
    const click   = inRange && !weekend;

    let state = "out";
    if (inRange) {
      if (weekend)  state = "we";
      else if (isAbs)   state = "absent";
      else if (isToday) state = "today";
      else if (isPast)  state = "done";
      else              state = "up";
    }
    cells.push({ d, ds, state, click, isAbs });
  }

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dotC = { done:"var(--ok-bar)", absent:"var(--cr-bar)", today:"var(--acc)", up:"var(--bdr-s)" };

  return (
    <div className="cal-ov" onClick={onClose}>
      <div className="cal-box" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="cal-hd">
          <div className="cal-hdr">
            <div>
              <div className="cal-name">{trainee.name}</div>
              <div className="cal-range"><I.Cal /> {fDate(trainee.startDate)} → {fDate(adjEnd)}</div>
            </div>
            <button className="modal-x" onClick={onClose}><I.X /></button>
          </div>
          <div className="cal-stats">
            <div className="cal-stat">
              <div className="cst-n">{baseDays}</div>
              <div className="cst-l">Required</div>
            </div>
            <div className="cal-stat s-a">
              <div className="cst-n">{absences.length}</div>
              <div className="cst-l">Absences</div>
            </div>
            <div className={`cal-stat${absences.length>0?" s-e":""}`}>
              <div className="cst-n">{baseDays + absences.length}</div>
              <div className="cst-l">Total</div>
            </div>
            <div className="cal-stat">
              <div className="cst-n">{Math.max(0,dLeft)}</div>
              <div className="cst-l">Remaining</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="cal-nav">
          <button className="cal-nb" onClick={prevM}><I.ChevL /></button>
          <span className="cal-mo">{MONTHS[vm]} {vy}</span>
          <button className="cal-nb" onClick={nextM}><I.ChevR /></button>
        </div>

        {/* Day headers */}
        <div className="cal-dows">
          {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d,i) => (
            <div key={d} className={`cal-dow ${i===0||i===6?"dw-we":"dw-wd"}`}>{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="cal-grid">
          {cells.map((cell, i) => {
            if (!cell) return <div key={`e${i}`} className="cal-day d-empty" />;
            const { d, ds, state, click, isAbs } = cell;
            const cls = ["cal-day", `d-${state}`, click && "d-click", saving && click && "d-saving"].filter(Boolean).join(" ");
            return (
              <div key={ds} className={cls}
                onClick={() => click && !saving ? toggleAbsence(ds) : null}
                title={isAbs ? "Click to remove absence" : click ? "Mark as absent" : ""}
              >
                {isAbs && <span className="cd-x">✕</span>}
                <span className="cd-n">{d}</span>
                {dotC[state] && <span className="cd-d" style={{ background:dotC[state] }} />}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="cal-leg">
          {[
            { label:"Completed", bg:"var(--ok-soft)",  bdr:"var(--ok-bdr)" },
            { label:"Absent",    bg:"var(--cr-bg)",    bdr:"var(--cr-bdr)" },
            { label:"Today",     bg:"var(--acc-soft)", bdr:"var(--acc-ring)" },
            { label:"Upcoming",  bg:"var(--bg-card2)", bdr:"var(--bdr-s)" },
            { label:"Weekend",   bg:"var(--bg-card2)", bdr:"var(--bdr)" },
          ].map(l => (
            <div key={l.label} className="leg-i">
              <div className="leg-sq" style={{ background:l.bg, borderColor:l.bdr }} />
              {l.label}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="cal-ft">
          <div className="cal-hint">
            {absences.length === 0
              ? "Tap a workday in the OJT range to mark absent."
              : `${absences.length} absent ${absences.length===1?"day":"days"} — end date extended.`}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {saved  && <span className="cal-saved">Saved!</span>}
            {saving && <span className="cal-svng">Saving…</span>}
            <button className="btn btn-sec" style={{ padding:"8px 16px" }} onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── DELETE MODAL ──────────────────────────────────────────────
function DeleteModal({ name, onConfirm, onCancel }) {
  useEffect(() => {
    const fn = e => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onCancel]);
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="del-modal" onClick={e => e.stopPropagation()}>
        <div className="del-body">
          <div className="del-ring"><I.Trash /></div>
          <div className="del-title">Remove Trainee?</div>
          <div className="del-nm">{name}</div>
          <div className="del-desc">This will permanently remove this trainee and all their progress data. This cannot be undone.</div>
        </div>
        <div className="del-foot">
          <button className="btn btn-sec" onClick={onCancel}>Keep</button>
          <button className="btn btn-danger" onClick={onConfirm}>Yes, Remove</button>
        </div>
      </div>
    </div>
  );
}

// ── TRAINEE CARD ─────────────────────────────────────────────
function TraineeCard({ t, onEdit, onDelete, onCalendar, idx }) {
  const urgency  = getUrgency(t.startDate, t.endDate);
  const pct      = getPct(t.startDate, t.endDate);
  const left     = wdLeft(t.endDate);
  const done     = wdDone(t.startDate);
  const total    = countWeekdays(t.startDate, t.endDate);
  const motiv    = MOTIV[urgency];
  const absCount = (t.absences || []).length;
  const pfx      = { ok:"ok", warning:"wa", critical:"cr", done:"dn" }[urgency];
  const bStyle   = { "--b-bg":`var(--${pfx}-bg)`, "--b-t":`var(--${pfx}-t)`, "--b-bdr":`var(--${pfx}-bdr)` };
  const cc       = `var(--${pfx}-t)`;

  return (
    <div className={`card ${urgency}`} style={{ animationDelay:`${idx*0.05}s` }}>
      <div className="card-top">
        <div className="card-left">
          <div className="card-name">{t.name}</div>
          <div className="pills">
            <span className="pill"><I.Cal />  {fShort(t.startDate)} – {fDate(t.endDate)}</span>
            <span className="pill"><I.Clock /> {t.hours} hrs · {t.hoursPerDay||8} hrs/day</span>
            <span className="pill"><I.Brief /> {total} working days</span>
          </div>
          <div className="card-motiv">{motiv.msg}</div>
        </div>
        <div className="card-right">
          <span className="badge" style={bStyle}>
            <span className={`bdot${urgency==="critical"?" blink":""}`} />
            {motiv.label}
          </span>
          <div className="cdown">
            {left <= 0
              ? <div className="cdown-dn" style={{ color:cc }}>Done!</div>
              : <><div className="cdown-num" style={{ color:cc }}>{left}</div><div className="cdown-lbl">days left</div></>}
          </div>
        </div>
      </div>

      <div className="prog-wrap">
        <div className="prog-top">
          <span className="prog-lbl">Journey Progress</span>
          <span className="prog-pct" style={{ color:cc }}>{pct}%</span>
        </div>
        <ProgressBar pct={pct} urgency={urgency} />
        <div className="prog-bot">
          <span>{done} days in</span>
          <span>{Math.max(0, total - done)} remaining</span>
        </div>
      </div>

      <div className="card-foot">
        <div className="foot-info">
          Ends <b>{fDate(t.endDate)}</b>
          {absCount > 0 && <span className="abs-tag">{absCount} absent</span>}
        </div>
        <div className="foot-acts">
          <button className="btn btn-sm"  onClick={() => onCalendar(t)}><I.Cal />   Attendance</button>
          <button className="btn btn-sm"  onClick={() => onEdit(t)}><I.Edit />  Edit</button>
          <button className="btn btn-del" onClick={() => onDelete(t.id, t.name)}><I.Trash /> Remove</button>
        </div>
      </div>
    </div>
  );
}

// ── TRAINEE FORM ─────────────────────────────────────────────
function TraineeForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { name:"", startDate:todayStr(), hours:"", hoursPerDay:"8" });
  const set = (k,v) => setForm(f => ({ ...f, [k]:v }));

  const computed = useMemo(() => {
    const hrs = Number(form.hours), hpd = Number(form.hoursPerDay)||8;
    if (!form.startDate || !hrs || hrs <= 0 || hpd <= 0) return null;
    const days = Math.ceil(hrs/hpd);
    return { days, endDate: addWeekdays(form.startDate, days) };
  }, [form.startDate, form.hours, form.hoursPerDay]);

  const valid = form.name.trim() && form.startDate && Number(form.hours)>0 && computed;

  const handleSave = () => {
    if (!valid) return;
    onSave({ name:form.name.trim(), startDate:form.startDate, endDate:computed.endDate, hours:form.hours, hoursPerDay:form.hoursPerDay||"8" });
  };

  return (
    <>
      <div className="form-body">
        <div className="form-group">
          <label className="form-label">Full Name <span className="req">*</span></label>
          <input className="form-input" value={form.name} onChange={e=>set("name",e.target.value)} placeholder="e.g. Juan dela Cruz" />
        </div>
        <div className="form-group">
          <label className="form-label">Start Date <span className="req">*</span></label>
          <input className="form-input" type="date" value={form.startDate} onChange={e=>set("startDate",e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Required Hours <span className="req">*</span></label>
            <input className="form-input" type="number" min="1" value={form.hours} onChange={e=>set("hours",e.target.value)} placeholder="e.g. 480" />
            <span className="form-hint">Total OJT hours required</span>
          </div>
          <div className="form-group">
            <label className="form-label">Hours / Day</label>
            <input className="form-input" type="number" min="1" max="24" value={form.hoursPerDay} onChange={e=>set("hoursPerDay",e.target.value)} placeholder="8" />
            <span className="form-hint">Working hours per day</span>
          </div>
        </div>
        {computed ? (
          <div className="calc-box">
            <div className="calc-title">Calculated Schedule</div>
            <div className="calc-row">
              <span className="calc-key"><I.Brief /> Working Days</span>
              <span className="calc-val">{computed.days} days</span>
            </div>
            <div className="calc-row">
              <span className="calc-key"><I.Cal /> End Date</span>
              <span className="calc-val">{fDate(computed.endDate)}</span>
            </div>
          </div>
        ) : (
          <div style={{ fontSize:12, color:"var(--t3)", padding:"10px 13px", background:"var(--bg-card2)", borderRadius:8, border:"1px solid var(--bdr-s)" }}>
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

// ── MODAL WRAPPER ─────────────────────────────────────────────
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
          <button className="modal-x" onClick={onClose}><I.X /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── APP ROOT ──────────────────────────────────────────────────
export default function App() {
  const [theme,    setTheme]    = useState(() => localStorage.getItem("ojt-theme") || "light");
  const [trainees, setTrainees] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showAdd,  setShowAdd]  = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [calendar, setCalendar] = useState(null);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("all");
  const [sort,     setSort]     = useState("endDate");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ojt-theme", theme);
  }, [theme]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "trainees"), snap => {
      setTrainees(snap.docs.map(d => ({ id:d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAdd     = async (f) => { try { await addDoc(collection(db,"trainees"), f); setShowAdd(false); } catch(e){console.error(e);} };
  const handleEdit    = async (f) => { try { await updateDoc(doc(db,"trainees",editing.id), f); setEditing(null); } catch(e){console.error(e);} };
  const handleDelete  = (id, name) => setDeleting({ id, name });
  const confirmDelete = async () => {
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
      if (sort==="name")   return a.name.localeCompare(b.name);
      if (sort==="pct")    return getPct(b.startDate,b.endDate) - getPct(a.startDate,a.endDate);
      if (sort==="recent") return new Date(b.startDate) - new Date(a.startDate);
      return wdLeft(a.endDate) - wdLeft(b.endDate);
    });

  return (
    <>
      <style>{CSS}</style>

      {/* NAV */}
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-brand">
            <div className="nav-logo"><I.Logo /></div>
            <div>
              <div className="nav-title">OJT Tracker</div>
              <div className="nav-sub">On-the-Job Training Monitor</div>
            </div>
          </div>
          <div className="nav-right">
            <PHTimeChip />
            <button className="btn-icon" onClick={() => setTheme(t => t==="light"?"dark":"light")} title="Toggle theme">
              {theme==="light" ? <I.Moon /> : <I.Sun />}
            </button>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
              <I.Plus /> <span>Add Trainee</span>
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN */}
      <main className="page">
        <JourneyBoard counts={counts} filter={filter} onFilter={setFilter} />

        <div className="toolbar">
          <div className="sw">
            <span className="si"><I.Search /></span>
            <input className="sinp" placeholder="Search trainee name…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="sortw">
            <span className="sorti"><I.Sort /></span>
            <select className="sels" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="endDate">Ending Soonest</option>
              <option value="name">Name A – Z</option>
              <option value="pct">Progress %</option>
              <option value="recent">Recently Started</option>
            </select>
          </div>
        </div>

        {!loading && (
          <div className="lhdr">
            <span className="lhdr-t">Trainees</span>
            <span className="lhdr-c">Showing <b>{visible.length}</b> of <b>{trainees.length}</b></span>
          </div>
        )}

        {loading ? <SkeletonList />
        : visible.length === 0 ? (
          <div className="empty">
            <div className="empty-ico"><I.Board /></div>
            <div className="empty-title">{trainees.length===0 ? "No trainees yet" : "No results found"}</div>
            <div className="empty-desc">
              {trainees.length===0
                ? "Add your first OJT trainee to start tracking their journey!"
                : "Try adjusting your search or clearing the active filter."}
            </div>
            {trainees.length===0 && <button className="btn btn-primary" onClick={()=>setShowAdd(true)}><I.Plus /> Add First Trainee</button>}
          </div>
        ) : (
          <div className="card-list">
            {visible.map((t,i) => (
              <TraineeCard key={t.id} t={t} idx={i}
                onEdit={setEditing}
                onDelete={handleDelete}
                onCalendar={setCalendar}
              />
            ))}
          </div>
        )}
      </main>

      {/* MODALS */}
      {showAdd && (
        <Modal title="Add New Trainee" onClose={() => setShowAdd(false)}>
          <TraineeForm onSave={handleAdd} onCancel={() => setShowAdd(false)} />
        </Modal>
      )}
      {editing && (
        <Modal title="Edit Trainee" onClose={() => setEditing(null)}>
          <TraineeForm initial={{ ...editing, hoursPerDay:editing.hoursPerDay||"8" }} onSave={handleEdit} onCancel={() => setEditing(null)} />
        </Modal>
      )}
      {deleting && (
        <DeleteModal name={deleting.name} onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />
      )}
      {calendar && (
        <CalendarModal
          trainee={trainees.find(x => x.id === calendar.id) || calendar}
          onClose={() => setCalendar(null)}
        />
      )}
    </>
  );
}