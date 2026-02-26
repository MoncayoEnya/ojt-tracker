// ============================================================
//  OJT TRACKER — App.jsx
//  · Fixed role filter bug (now filters correctly & reactively)
//  · Clean, modern, professional UI — no blue-dark theme
//  · Dark mode: warm charcoal grays (from design image)
//  · Improved readability on all platforms
// ============================================================

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc,
} from "firebase/firestore";

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
function isWeekday(ds) { const d = new Date(ds+"T12:00:00").getDay(); return d!==0&&d!==6; }
function countWeekdays(s,e) {
  const sd=new Date(s+"T00:00:00"),ed=new Date(e+"T00:00:00");
  if(ed<=sd)return 0;let n=0,c=new Date(sd);
  while(c<ed){if(isWeekday(c.toISOString().split("T")[0]))n++;c.setDate(c.getDate()+1);}return n;
}
function addWeekdays(startStr,days) {
  if(days<=0)return startStr;
  const d=new Date(startStr+"T12:00:00");
  while(!isWeekday(d.toISOString().split("T")[0]))d.setDate(d.getDate()+1);
  let added=0;
  while(added<days){d.setDate(d.getDate()+1);if(isWeekday(d.toISOString().split("T")[0]))added++;}
  return d.toISOString().split("T")[0];
}

function computeStats(trainee) {
  const totalRequired=Number(trainee.hours)||0;
  const fullDayHrs=Number(trainee.hoursPerDay)||8;
  const absences=trainee.absences||{};
  const today=todayStr();
  let hoursEarned=0,daysWorked=0,daysHalf=0;
  const cur=new Date(trainee.startDate+"T12:00:00"),end=new Date(today+"T12:00:00");
  while(cur<end){
    const ds=cur.toISOString().split("T")[0];
    if(ds>=trainee.startDate&&isWeekday(ds)){
      const rec=absences[ds];
      if(rec===undefined||rec===null){hoursEarned+=fullDayHrs;daysWorked++;}
      else if(rec==="full"){}
      else{const h=Number(rec)||0;hoursEarned+=h;if(h>=fullDayHrs)daysWorked++;else daysHalf++;}
    }
    cur.setDate(cur.getDate()+1);
  }
  const hoursRemaining=Math.max(0,totalRequired-hoursEarned);
  const daysRemaining=hoursRemaining>0?Math.ceil(hoursRemaining/fullDayHrs):0;
  const displayEnd=trainee.startDate>today?trainee.endDate:(hoursRemaining<=0?today:addWeekdays(today,daysRemaining));
  const pct=totalRequired>0?Math.min(100,Math.max(0,Math.round((hoursEarned/totalRequired)*100))):0;
  const wdLeft=hoursRemaining>0?countWeekdays(today,displayEnd):0;
  let urgency;
  if(hoursRemaining<=0)urgency="done";
  else if(pct>=85||wdLeft<=5)urgency="critical";
  else if(pct>=60||wdLeft<=15)urgency="warning";
  else urgency="ok";
  return {
    hoursEarned:Math.round(hoursEarned*100)/100,
    hoursRemaining:Math.round(hoursRemaining*100)/100,
    daysRemaining,displayEnd,pct,urgency,wdLeft,daysWorked,fullDayHrs,totalRequired,
  };
}

const fDate=(d)=>d?new Date(d+"T12:00:00").toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"}):"—";
const fShort=(d)=>d?new Date(d+"T12:00:00").toLocaleDateString("en-PH",{month:"short",day:"numeric"}):"—";

function usePHTime() {
  const [now,setNow]=useState(new Date());
  useEffect(()=>{const t=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(t);},[]);
  const ph=new Date(now.toLocaleString("en-US",{timeZone:"Asia/Manila"}));
  const h=ph.getHours(),m=ph.getMinutes(),s=ph.getSeconds();
  const ampm=h>=12?"PM":"AM",h12=((h%12)||12).toString().padStart(2,"0");
  const DAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const MONS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return{time:`${h12}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`,ampm,day:DAYS[ph.getDay()],date:`${MONS[ph.getMonth()]} ${ph.getDate()}, ${ph.getFullYear()}`};
}

// ── ICONS ─────────────────────────────────────────────────────
const Ico = {
  Logo:   ()=><svg width="18"height="18"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2.2"strokeLinecap="round"strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  Plus:   ()=><svg width="15"height="15"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2.5"strokeLinecap="round"><line x1="12"y1="5"x2="12"y2="19"/><line x1="5"y1="12"x2="19"y2="12"/></svg>,
  Search: ()=><svg width="15"height="15"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"strokeLinecap="round"><circle cx="11"cy="11"r="8"/><line x1="21"y1="21"x2="16.65"y2="16.65"/></svg>,
  Edit:   ()=><svg width="14"height="14"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"strokeLinecap="round"strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash:  ()=><svg width="14"height="14"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"strokeLinecap="round"strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  Cal:    ()=><svg width="14"height="14"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"strokeLinecap="round"strokeLinejoin="round"><rect x="3"y="4"width="18"height="18"rx="2"/><line x1="16"y1="2"x2="16"y2="6"/><line x1="8"y1="2"x2="8"y2="6"/><line x1="3"y1="10"x2="21"y2="10"/></svg>,
  Clock:  ()=><svg width="13"height="13"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"strokeLinecap="round"strokeLinejoin="round"><circle cx="12"cy="12"r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Brief:  ()=><svg width="13"height="13"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"strokeLinecap="round"strokeLinejoin="round"><rect x="2"y="7"width="20"height="14"rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
  X:      ()=><svg width="16"height="16"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2.5"strokeLinecap="round"><line x1="18"y1="6"x2="6"y2="18"/><line x1="6"y1="6"x2="18"y2="18"/></svg>,
  ChevL:  ()=><svg width="18"height="18"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2.5"strokeLinecap="round"strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  ChevR:  ()=><svg width="18"height="18"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2.5"strokeLinecap="round"strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Users:  ()=><svg width="18"height="18"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"strokeLinecap="round"strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9"cy="7"r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Check:  ()=><svg width="13"height="13"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="3"strokeLinecap="round"strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Sun:    ()=><svg width="16"height="16"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"strokeLinecap="round"strokeLinejoin="round"><circle cx="12"cy="12"r="4"/><line x1="12"y1="2"x2="12"y2="6"/><line x1="12"y1="18"x2="12"y2="22"/><line x1="4.93"y1="4.93"x2="7.76"y2="7.76"/><line x1="16.24"y1="16.24"x2="19.07"y2="19.07"/><line x1="2"y1="12"x2="6"y2="12"/><line x1="18"y1="12"x2="22"y2="12"/><line x1="4.93"y1="19.07"x2="7.76"y2="16.24"/><line x1="16.24"y1="7.76"x2="19.07"y2="4.93"/></svg>,
  Moon:   ()=><svg width="16"height="16"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"strokeLinecap="round"strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Sort:   ()=><svg width="15"height="15"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"strokeLinecap="round"strokeLinejoin="round"><line x1="8"y1="6"x2="21"y2="6"/><line x1="8"y1="12"x2="16"y2="12"/><line x1="8"y1="18"x2="12"y2="18"/><polyline points="3 8 6 5 9 8"/><line x1="6"y1="5"x2="6"y2="19"/></svg>,
  Info:   ()=><svg width="14"height="14"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"strokeLinecap="round"strokeLinejoin="round"><circle cx="12"cy="12"r="10"/><line x1="12"y1="8"x2="12"y2="8"/><line x1="12"y1="12"x2="12"y2="16"/></svg>,
  Board:  ()=><svg width="40"height="40"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="1.2"strokeLinecap="round"strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8"y="2"width="8"height="4"rx="1"/><line x1="9"y1="12"x2="15"y2="12"/><line x1="9"y1="16"x2="12"y2="16"/></svg>,
  Star:   ()=><svg width="14"height="14"viewBox="0 0 24 24"fill="currentColor"stroke="currentColor"strokeWidth="1"strokeLinecap="round"strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Rocket: ()=><svg width="14"height="14"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"strokeLinecap="round"strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>,
  Tag:    ()=><svg width="13"height="13"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"strokeLinecap="round"strokeLinejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5"cy="7.5"r="1.5"/></svg>,
  Trophy: ()=><svg width="16"height="16"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"strokeLinecap="round"strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  Upload: ()=><svg width="15"height="15"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"strokeLinecap="round"strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12"y1="3"x2="12"y2="15"/></svg>,
  Download:()=><svg width="15"height="15"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"strokeLinecap="round"strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12"y1="15"x2="12"y2="3"/></svg>,
  Sheet:  ()=><svg width="15"height="15"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"strokeLinecap="round"strokeLinejoin="round"><rect x="3"y="3"width="18"height="18"rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/></svg>,
  AlertTri:()=><svg width="16"height="16"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"strokeLinecap="round"strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12"y1="9"x2="12"y2="13"/><line x1="12"y1="17"x2="12.01"y2="17"/></svg>,
};

const STATUS = {
  ok:       { label:"On Track",     color:"#22c55e", bg:"rgba(34,197,94,.1)",    bdr:"rgba(34,197,94,.25)"  },
  warning:  { label:"Keep Going",   color:"#f59e0b", bg:"rgba(245,158,11,.1)",   bdr:"rgba(245,158,11,.25)" },
  critical: { label:"Almost There", color:"#ef4444", bg:"rgba(239,68,68,.1)",    bdr:"rgba(239,68,68,.25)"  },
  done:     { label:"Completed",    color:"#a78bfa", bg:"rgba(167,139,250,.1)",  bdr:"rgba(167,139,250,.25)"},
};

// ── STYLES ────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

/* ── LIGHT THEME ── */
:root {
  --bg:       #f4f5f7;
  --surface:  #ffffff;
  --surface2: #f8f9fb;
  --surface3: #f0f1f4;
  --border:   #e4e6ec;
  --border2:  #eceef4;
  --t1: #111318;
  --t2: #2d3142;
  --t3: #5a5f7a;
  --t4: #8a8fa8;
  --t5: #c4c8d8;
  --acc:   #4f6ef7;
  --acc2:  #3b5be8;
  --acc3:  rgba(79,110,247,.09);
  --acc4:  rgba(79,110,247,.18);
  --nav:   rgba(255,255,255,.95);
  --sh1:   0 1px 3px rgba(0,0,0,.07);
  --sh2:   0 4px 20px rgba(0,0,0,.08),0 1px 4px rgba(0,0,0,.04);
  --sh4:   0 20px 60px rgba(0,0,0,.12),0 6px 20px rgba(0,0,0,.06);
  --ok-c:#16a34a; --ok-bg:rgba(22,163,74,.08);   --ok-bdr:rgba(22,163,74,.22);
  --wa-c:#d97706; --wa-bg:rgba(217,119,6,.08);   --wa-bdr:rgba(217,119,6,.22);
  --cr-c:#dc2626; --cr-bg:rgba(220,38,38,.08);   --cr-bdr:rgba(220,38,38,.22);
  --dn-c:#7c3aed; --dn-bg:rgba(124,58,237,.08);  --dn-bdr:rgba(124,58,237,.22);
  --ab-c:#e11d48; --ab-bg:rgba(225,29,72,.08);   --ab-bdr:rgba(225,29,72,.22);
  --hf-c:#c2410c; --hf-bg:rgba(194,65,12,.08);   --hf-bdr:rgba(194,65,12,.22);
}

/* ── DARK THEME — warm charcoal grays (from design) ── */
[data-theme="dark"] {
  --bg:       #1a1a1a;
  --surface:  #242424;
  --surface2: #2c2c2c;
  --surface3: #333333;
  --border:   #3a3a3a;
  --border2:  #303030;
  --t1: #f0f0f0;
  --t2: #d0d0d0;
  --t3: #a0a0a0;
  --t4: #707070;
  --t5: #484848;
  --acc:   #6b8cff;
  --acc2:  #5a7aff;
  --acc3:  rgba(107,140,255,.12);
  --acc4:  rgba(107,140,255,.22);
  --nav:   rgba(26,26,26,.96);
  --sh1:   0 1px 4px rgba(0,0,0,.4);
  --sh2:   0 4px 20px rgba(0,0,0,.5),0 1px 4px rgba(0,0,0,.3);
  --sh4:   0 24px 64px rgba(0,0,0,.7),0 8px 24px rgba(0,0,0,.4);
  --ok-c:#4ade80; --ok-bg:rgba(74,222,128,.07);  --ok-bdr:rgba(74,222,128,.2);
  --wa-c:#fbbf24; --wa-bg:rgba(251,191,36,.07);  --wa-bdr:rgba(251,191,36,.2);
  --cr-c:#f87171; --cr-bg:rgba(248,113,113,.07); --cr-bdr:rgba(248,113,113,.2);
  --dn-c:#c084fc; --dn-bg:rgba(192,132,252,.07); --dn-bdr:rgba(192,132,252,.2);
  --ab-c:#fb7185; --ab-bg:rgba(251,113,133,.07); --ab-bdr:rgba(251,113,133,.2);
  --hf-c:#fb923c; --hf-bg:rgba(251,146,60,.07);  --hf-bdr:rgba(251,146,60,.2);
}

html{scroll-behavior:smooth;-webkit-text-size-adjust:100%;}
body{
  background:var(--bg);color:var(--t1);
  font-family:'Inter',system-ui,sans-serif;
  min-height:100vh;line-height:1.6;
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
  transition:background .25s,color .25s;
}
button{font-family:inherit;cursor:pointer;}
input,select,textarea{font-family:inherit;}
[data-theme="dark"] input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(.5);}
::-webkit-scrollbar{width:5px;height:5px;}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:99px;}
::-webkit-scrollbar-track{background:transparent;}

@keyframes fadeIn  {from{opacity:0}to{opacity:1}}
@keyframes slideUp {from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes slideIn {from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes scaleIn {from{opacity:0;transform:scale(.97) translateY(6px)}to{opacity:1;transform:none}}
@keyframes pulse   {0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.9);opacity:.2}}
@keyframes blink   {0%,100%{opacity:1}50%{opacity:.25}}
@keyframes shimmer {0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}

/* ── NAV ── */
.nav{
  position:sticky;top:0;z-index:100;
  background:var(--nav);
  backdrop-filter:blur(24px) saturate(180%);
  -webkit-backdrop-filter:blur(24px) saturate(180%);
  border-bottom:1px solid var(--border);
}
.nav-inner{
  max-width:1160px;margin:0 auto;padding:0 28px;height:64px;
  display:flex;align-items:center;justify-content:space-between;gap:16px;
}
.nav-brand{display:flex;align-items:center;gap:12px;flex-shrink:0;}
.nav-logo{
  width:38px;height:38px;border-radius:10px;
  background:linear-gradient(135deg,var(--acc) 0%,var(--acc2) 100%);
  color:#fff;display:flex;align-items:center;justify-content:center;
  flex-shrink:0;transition:transform .2s ease,box-shadow .2s;
  box-shadow:0 3px 12px rgba(79,110,247,.3);
}
.nav-logo:hover{transform:scale(1.06);box-shadow:0 6px 20px rgba(79,110,247,.4);}
.nav-name{font-size:15px;font-weight:800;color:var(--t1);letter-spacing:-.4px;line-height:1.2;}
.nav-tagline{font-size:10.5px;color:var(--t4);font-weight:500;line-height:1;margin-top:1px;}
.nav-right{display:flex;align-items:center;gap:8px;}

/* Clock */
.clock-chip{
  display:flex;align-items:center;gap:10px;
  background:var(--surface);border:1px solid var(--border);
  border-radius:10px;padding:7px 13px;box-shadow:var(--sh1);
}
.clock-dot{width:6px;height:6px;border-radius:50%;background:#22c55e;flex-shrink:0;animation:pulse 2.8s ease infinite;}
.clock-time{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;color:var(--t1);line-height:1.1;}
.clock-sub{font-size:9px;font-weight:700;color:var(--acc);letter-spacing:.1em;text-transform:uppercase;}
.clock-sep{width:1px;height:20px;background:var(--border);flex-shrink:0;}
.clock-day{font-size:9.5px;font-weight:700;color:var(--t2);letter-spacing:.04em;text-transform:uppercase;line-height:1.4;}
.clock-date{font-size:9.5px;color:var(--t4);line-height:1.4;}

/* ── BUTTONS ── */
.btn{
  display:inline-flex;align-items:center;gap:6px;
  font-weight:700;font-size:13.5px;
  border-radius:10px;border:none;cursor:pointer;
  transition:all .18s ease;white-space:nowrap;line-height:1;
}
.btn:active{transform:scale(.97);}
.btn-primary{
  background:linear-gradient(135deg,var(--acc),var(--acc2));
  color:#fff;padding:10px 18px;
  box-shadow:0 2px 10px rgba(79,110,247,.3);
}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 5px 18px rgba(79,110,247,.4);}
.btn-primary:disabled{opacity:.4;cursor:not-allowed;transform:none;box-shadow:none;}
.btn-ghost{background:var(--surface2);color:var(--t2);padding:10px 16px;border:1px solid var(--border);}
.btn-ghost:hover{background:var(--surface3);color:var(--t1);border-color:var(--t5);}
.btn-sm{background:var(--surface2);color:var(--t3);padding:7px 12px;border:1px solid var(--border);font-size:12.5px;border-radius:8px;}
.btn-sm:hover{background:var(--surface3);color:var(--t1);border-color:var(--t5);}
.btn-danger-ghost{background:var(--cr-bg);color:var(--cr-c);padding:7px 12px;border:1px solid var(--cr-bdr);font-size:12.5px;border-radius:8px;}
.btn-danger-ghost:hover{background:rgba(220,38,38,.13);}
.btn-danger{background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;padding:10px 18px;box-shadow:0 3px 10px rgba(220,38,38,.25);}
.btn-danger:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(220,38,38,.35);}
.btn-icon{
  width:38px;height:38px;border-radius:10px;
  background:var(--surface);border:1px solid var(--border);
  color:var(--t3);display:flex;align-items:center;justify-content:center;
  cursor:pointer;transition:all .18s ease;flex-shrink:0;
}
.btn-icon:hover{background:var(--surface3);color:var(--t1);border-color:var(--t4);}
.btn-icon:active{transform:scale(.93);}
.btn-outline{
  background:var(--surface);color:var(--t2);
  padding:9px 14px;border:1px solid var(--border);
  font-size:13px;font-weight:700;border-radius:10px;
  display:inline-flex;align-items:center;gap:6px;
  cursor:pointer;transition:all .18s ease;
  white-space:nowrap;
}
.btn-outline:hover{background:var(--surface2);border-color:var(--t4);color:var(--t1);}
.btn-outline.green{border-color:var(--ok-bdr);color:var(--ok-c);background:var(--ok-bg);}
.btn-outline.green:hover{background:rgba(22,163,74,.12);}

/* ── PAGE ── */
.page{max-width:1160px;margin:0 auto;padding:28px 28px 100px;}

/* ── HERO STATS ── */
.hero{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;}
.stat-card{
  background:var(--surface);border:1px solid var(--border);
  border-radius:16px;padding:20px;
  box-shadow:var(--sh1);
  transition:transform .2s ease,box-shadow .2s;
  animation:slideUp .4s ease both;
  position:relative;overflow:hidden;
}
.stat-card:hover{transform:translateY(-2px);box-shadow:var(--sh2);}
.sc-label{font-size:11px;font-weight:700;color:var(--t4);text-transform:uppercase;letter-spacing:.09em;margin-bottom:10px;}
.sc-num{font-family:'JetBrains Mono',monospace;font-size:32px;font-weight:600;line-height:1;margin-bottom:4px;}
.sc-sub{font-size:11.5px;color:var(--t4);font-weight:500;}
.sc-icon{position:absolute;right:16px;top:16px;opacity:.07;transform:scale(2.2);}

/* ── PANEL ── */
.panel{background:var(--surface);border:1px solid var(--border);border-radius:18px;box-shadow:var(--sh1);margin-bottom:20px;overflow:hidden;}
.panel-hd{padding:20px 22px 16px;border-bottom:1px solid var(--border2);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
.panel-title{font-size:15px;font-weight:800;color:var(--t1);letter-spacing:-.4px;}
.panel-sub{font-size:12px;color:var(--t4);margin-top:2px;font-weight:500;}

/* ── FILTER TABS ── */
.filter-bar{
  padding:12px 22px;border-bottom:1px solid var(--border2);
  display:flex;gap:6px;flex-wrap:wrap;overflow-x:auto;
  -webkit-overflow-scrolling:touch;
  background:var(--surface2);
}
.filter-bar::-webkit-scrollbar{height:0;}
.fpill{
  display:inline-flex;align-items:center;gap:5px;
  padding:6px 14px;border-radius:8px;cursor:pointer;
  font-size:12.5px;font-weight:700;
  border:1.5px solid var(--border);background:var(--surface);color:var(--t4);
  transition:all .15s ease;white-space:nowrap;flex-shrink:0;
  -webkit-tap-highlight-color:transparent;
}
.fpill:hover{color:var(--fp-c);border-color:var(--fp-c);background:var(--fp-bg);}
.fpill.act{color:var(--fp-c);border-color:var(--fp-c);background:var(--fp-bg);box-shadow:0 1px 8px var(--fp-sh);}
.fpill-dot{width:6px;height:6px;border-radius:50%;background:var(--fp-c);flex-shrink:0;}
.fpill-n{font-family:'JetBrains Mono',monospace;font-size:10px;opacity:.7;background:var(--surface3);border-radius:99px;padding:1px 6px;}

/* ── ROLE BAR — Fixed ── */
.role-bar{
  padding:10px 22px;border-bottom:1px solid var(--border2);
  display:flex;align-items:center;gap:6px;flex-wrap:wrap;
  overflow-x:auto;-webkit-overflow-scrolling:touch;
  background:var(--surface);
}
.role-bar::-webkit-scrollbar{height:0;}
.role-label{
  font-size:10px;font-weight:800;color:var(--t4);
  text-transform:uppercase;letter-spacing:.12em;flex-shrink:0;
  margin-right:4px;
}
.rpill{
  display:inline-flex;align-items:center;gap:4px;
  padding:5px 12px;border-radius:7px;cursor:pointer;
  font-size:12px;font-weight:600;
  border:1.5px solid var(--border);background:var(--surface2);color:var(--t3);
  transition:all .15s ease;white-space:nowrap;flex-shrink:0;
  -webkit-tap-highlight-color:transparent;
  /* CRITICAL: prevent any layout shift or clipping */
  min-height:30px;
}
.rpill:hover{background:var(--acc3);color:var(--acc);border-color:var(--acc4);}
.rpill.act{
  background:var(--acc3);color:var(--acc);border-color:var(--acc);
  box-shadow:0 1px 8px var(--acc3);
}
.rpill svg{flex-shrink:0;}
.rpill-n{
  font-family:'JetBrains Mono',monospace;font-size:10px;
  background:var(--surface3);border-radius:99px;padding:1px 5px;
  opacity:.75;
}
.rpill.act .rpill-n{background:var(--acc4);}

/* ── TOOLBAR ── */
.toolbar{padding:12px 22px;display:flex;gap:10px;border-bottom:1px solid var(--border2);}
.search-wrap{flex:1;position:relative;min-width:0;}
.search-ico{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--t4);pointer-events:none;display:flex;}
.search-inp{
  width:100%;background:var(--surface2);border:1.5px solid var(--border);
  border-radius:10px;padding:10px 12px 10px 36px;color:var(--t1);
  font-size:13.5px;outline:none;transition:all .18s;
}
.search-inp:focus{border-color:var(--acc);box-shadow:0 0 0 3px var(--acc3);background:var(--surface);}
.search-inp::placeholder{color:var(--t4);}
.sort-wrap{position:relative;display:flex;align-items:center;flex-shrink:0;}
.sort-ico{position:absolute;left:10px;color:var(--t4);pointer-events:none;display:flex;z-index:1;}
.sort-sel{
  background:var(--surface2);border:1.5px solid var(--border);
  border-radius:10px;padding:10px 12px 10px 34px;color:var(--t2);
  font-size:13px;outline:none;cursor:pointer;
  appearance:none;min-width:180px;transition:border-color .18s;
}
.sort-sel:focus{border-color:var(--acc);}

.result-info{padding:10px 22px 0;display:flex;align-items:center;justify-content:space-between;}
.ri-label{font-size:10.5px;font-weight:800;color:var(--t4);text-transform:uppercase;letter-spacing:.09em;}
.ri-count{font-size:12px;color:var(--t4);}
.ri-count b{color:var(--t2);font-weight:700;}

/* ── CARD ── */
.card-list{padding:14px 22px 24px;display:flex;flex-direction:column;gap:12px;}
.card{
  background:var(--surface);border:1px solid var(--border);
  border-radius:14px;
  transition:all .2s ease;
  animation:slideIn .35s ease both;
  overflow:hidden;position:relative;
  box-shadow:var(--sh1);
}
.card:hover{box-shadow:var(--sh2);border-color:rgba(79,110,247,.2);transform:translateY(-2px);}
[data-theme="dark"] .card:hover{border-color:rgba(107,140,255,.2);}

/* Status accent border on left */
.card-accent{width:4px;position:absolute;left:0;top:0;bottom:0;border-radius:14px 0 0 14px;}
.ca-ok      {background:linear-gradient(180deg,#22c55e,#16a34a);}
.ca-warning {background:linear-gradient(180deg,#f59e0b,#d97706);}
.ca-critical{background:linear-gradient(180deg,#ef4444,#dc2626);}
.ca-done    {background:linear-gradient(180deg,#a78bfa,#7c3aed);}

.card-body{padding:18px 20px 16px 22px;}
.card-main{display:flex;align-items:flex-start;gap:14px;margin-bottom:12px;}
.card-info{flex:1;min-width:0;}
.card-name{font-size:16.5px;font-weight:800;color:var(--t1);margin-bottom:4px;letter-spacing:-.3px;line-height:1.3;}
.card-name.done{color:var(--t4);text-decoration:line-through;text-decoration-color:var(--dn-c);}
.card-role{
  display:inline-flex;align-items:center;gap:4px;
  margin-bottom:8px;padding:3px 9px;border-radius:5px;
  font-size:10.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;
  background:var(--acc3);color:var(--acc);border:1px solid var(--acc4);width:fit-content;
}
.card-meta{display:flex;flex-wrap:wrap;gap:4px;}
.chip{
  display:inline-flex;align-items:center;gap:4px;
  font-size:11.5px;font-weight:500;color:var(--t3);
  background:var(--surface2);border:1px solid var(--border);
  border-radius:6px;padding:3px 8px;white-space:nowrap;
}
.card-side{display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0;}
.status-badge{
  display:inline-flex;align-items:center;gap:5px;
  font-size:11px;font-weight:700;padding:5px 12px;border-radius:99px;
  background:var(--sb-bg);color:var(--sb-c);border:1px solid var(--sb-bdr);
  white-space:nowrap;
}
.sb-dot{width:6px;height:6px;border-radius:50%;background:var(--sb-c);flex-shrink:0;}
.sb-dot.blink{animation:blink 1.5s ease-in-out infinite;}
.countdown{text-align:right;}
.cd-num{font-family:'JetBrains Mono',monospace;font-size:28px;font-weight:600;line-height:1;}
.cd-lbl{font-size:9.5px;color:var(--t4);font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-top:2px;}
.cd-done{font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:700;}

.hrs-row{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:12px;}
.hchip{display:inline-flex;align-items:center;gap:4px;font-size:11.5px;font-weight:700;padding:4px 10px;border-radius:7px;}
.hc-e{background:var(--ok-bg);color:var(--ok-c);border:1px solid var(--ok-bdr);}
.hc-r{background:var(--acc3);color:var(--acc);border:1px solid var(--acc4);}
.hc-a{background:var(--ab-bg);color:var(--ab-c);border:1px solid var(--ab-bdr);}
.hc-h{background:var(--hf-bg);color:var(--hf-c);border:1px solid var(--hf-bdr);}

.prog-area{margin-bottom:12px;}
.prog-labels{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:7px;}
.prog-txt{font-size:10.5px;color:var(--t4);font-weight:700;letter-spacing:.06em;text-transform:uppercase;}
.prog-pct{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;}
.prog-track{height:7px;background:var(--surface3);border-radius:99px;overflow:hidden;}
.prog-fill{height:100%;border-radius:99px;transition:width 1s ease;}
.pf-ok      {background:linear-gradient(90deg,#16a34a,#22c55e);}
.pf-warning {background:linear-gradient(90deg,#d97706,#f59e0b);}
.pf-critical{background:linear-gradient(90deg,#dc2626,#ef4444);}
.pf-done    {background:linear-gradient(90deg,#7c3aed,#a78bfa);}
.prog-bot{display:flex;justify-content:space-between;margin-top:5px;font-size:10.5px;color:var(--t4);font-family:'JetBrains Mono',monospace;}

.card-foot{
  display:flex;align-items:center;justify-content:space-between;
  padding:11px 20px 11px 22px;border-top:1px solid var(--border2);
  background:var(--surface2);gap:12px;flex-wrap:wrap;
}
.foot-date{font-size:12px;color:var(--t3);display:flex;align-items:center;gap:5px;}
.foot-date b{color:var(--t2);font-weight:700;}
.foot-tags{display:flex;gap:4px;align-items:center;}
.tag-abs{font-size:10.5px;font-weight:700;color:var(--ab-c);background:var(--ab-bg);border:1px solid var(--ab-bdr);border-radius:5px;padding:2px 7px;}
.tag-hf{font-size:10.5px;font-weight:700;color:var(--hf-c);background:var(--hf-bg);border:1px solid var(--hf-bdr);border-radius:5px;padding:2px 7px;}
.foot-actions{display:flex;gap:5px;flex-shrink:0;}

/* ── MODALS ── */
.overlay{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.4);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeIn .18s ease;overflow-y:auto;}
[data-theme="dark"] .overlay{background:rgba(0,0,0,.65);}
.modal{background:var(--surface);border:1px solid var(--border);border-radius:20px;width:100%;max-width:460px;box-shadow:var(--sh4);animation:scaleIn .22s ease;flex-shrink:0;overflow:hidden;}
.modal-hd{display:flex;justify-content:space-between;align-items:center;padding:20px 24px 18px;border-bottom:1px solid var(--border2);}
.modal-title{font-size:16.5px;font-weight:800;color:var(--t1);letter-spacing:-.4px;}
.modal-x{width:30px;height:30px;border-radius:8px;background:var(--surface3);border:1px solid var(--border);color:var(--t4);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;}
.modal-x:hover{background:var(--cr-bg);color:var(--cr-c);border-color:var(--cr-bdr);}

.form-body{padding:24px;display:flex;flex-direction:column;gap:18px;}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.form-group{display:flex;flex-direction:column;gap:7px;}
.form-label{font-size:11px;font-weight:800;color:var(--t3);text-transform:uppercase;letter-spacing:.11em;}
.req{color:var(--cr-c);margin-left:2px;}
.form-input{background:var(--surface2);border:1.5px solid var(--border);border-radius:10px;padding:10px 13px;color:var(--t1);font-size:13.5px;outline:none;width:100%;transition:all .18s;}
.form-input:focus{border-color:var(--acc);box-shadow:0 0 0 3px var(--acc3);background:var(--surface);}
.form-input::placeholder{color:var(--t5);font-size:13px;}
.form-hint{font-size:11.5px;color:var(--t4);line-height:1.55;}
.preview-box{background:var(--acc3);border:1.5px solid var(--acc4);border-radius:12px;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;}
.pv-item{display:flex;flex-direction:column;gap:3px;}
.pv-val{font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:600;color:var(--acc);}
.pv-lbl{font-size:10px;font-weight:800;color:var(--t4);text-transform:uppercase;letter-spacing:.08em;}
.pv-div{width:1px;height:32px;background:var(--acc4);flex-shrink:0;}
.form-ft{display:flex;gap:10px;justify-content:flex-end;padding:16px 24px;border-top:1px solid var(--border2);background:var(--surface2);}
.form-ft .btn{min-width:130px;justify-content:center;}

.del-modal{background:var(--surface);border:1px solid var(--border);border-radius:20px;width:100%;max-width:360px;box-shadow:var(--sh4);animation:scaleIn .22s ease;overflow:hidden;flex-shrink:0;}
.del-body{display:flex;flex-direction:column;align-items:center;padding:32px 24px 20px;text-align:center;gap:12px;}
.del-icon-ring{width:52px;height:52px;border-radius:50%;background:var(--cr-bg);border:2px solid var(--cr-bdr);display:flex;align-items:center;justify-content:center;color:var(--cr-c);}
.del-title{font-size:17px;font-weight:800;color:var(--t1);}
.del-name{font-size:13px;font-weight:700;color:var(--acc);background:var(--acc3);border:1px solid var(--acc4);border-radius:8px;padding:4px 14px;}
.del-desc{font-size:12.5px;color:var(--t3);line-height:1.7;max-width:280px;}
.del-ft{display:flex;gap:10px;padding:14px 20px;border-top:1px solid var(--border2);background:var(--surface2);}
.del-ft .btn{flex:1;justify-content:center;}

.import-modal{background:var(--surface);border:1px solid var(--border);border-radius:20px;width:100%;max-width:520px;box-shadow:var(--sh4);animation:scaleIn .22s ease;flex-shrink:0;overflow:hidden;}
.import-dropzone{border:2px dashed var(--border);border-radius:12px;padding:36px 24px;text-align:center;cursor:pointer;transition:all .18s ease;background:var(--surface2);position:relative;}
.import-dropzone.drag{border-color:var(--acc);background:var(--acc3);}
.import-dropzone:hover{border-color:var(--acc);background:var(--acc3);}
.import-dropzone input[type=file]{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;}
.idz-icon{width:50px;height:50px;border-radius:14px;background:var(--acc3);border:1px solid var(--acc4);display:flex;align-items:center;justify-content:center;color:var(--acc);margin:0 auto 14px;}
.idz-title{font-size:14.5px;font-weight:800;color:var(--t1);margin-bottom:4px;}
.idz-sub{font-size:12px;color:var(--t4);line-height:1.65;}
.preview-table-wrap{max-height:260px;overflow-y:auto;border:1px solid var(--border);border-radius:11px;margin-top:0;}
.preview-table{width:100%;border-collapse:collapse;font-size:12px;}
.preview-table th{background:var(--surface2);color:var(--t3);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;padding:8px 12px;border-bottom:1px solid var(--border);position:sticky;top:0;text-align:left;white-space:nowrap;}
.preview-table td{padding:7px 12px;border-bottom:1px solid var(--border2);color:var(--t2);white-space:nowrap;}
.preview-table tr:last-child td{border-bottom:none;}
.preview-table tr:hover td{background:var(--surface3);}
.pt-name{font-weight:700;color:var(--t1);}
.pt-role{color:var(--acc);font-size:11px;font-weight:600;}
.import-result{display:flex;align-items:center;gap:7px;padding:10px 13px;border-radius:10px;font-size:12.5px;font-weight:700;}
.ir-ok  {background:var(--ok-bg);color:var(--ok-c);border:1px solid var(--ok-bdr);}
.ir-warn{background:var(--wa-bg);color:var(--wa-c);border:1px solid var(--wa-bdr);}
.ir-err {background:var(--cr-bg);color:var(--cr-c);border:1px solid var(--cr-bdr);}
.template-info{background:var(--surface2);border:1px solid var(--border2);border-radius:10px;padding:11px 14px;font-size:12px;color:var(--t3);line-height:1.7;}
.template-info strong{color:var(--t2);font-weight:700;}
.template-info code{background:var(--acc3);border:1px solid var(--acc4);border-radius:4px;padding:1px 5px;font-size:11px;font-family:'JetBrains Mono',monospace;color:var(--acc);}

/* ── CALENDAR ── */
.cal-overlay{position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.45);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);display:flex;align-items:flex-start;justify-content:center;padding:20px 16px;animation:fadeIn .18s ease;overflow-y:auto;-webkit-overflow-scrolling:touch;}
[data-theme="dark"] .cal-overlay{background:rgba(0,0,0,.7);}
.cal-box{background:var(--surface);border:1px solid var(--border);border-radius:20px;width:100%;max-width:500px;box-shadow:var(--sh4);animation:scaleIn .24s ease;overflow:hidden;flex-shrink:0;margin:auto;}
.cal-hd{padding:20px 22px 16px;border-bottom:1px solid var(--border2);}
.cal-hdr{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:14px;}
.cal-trainee{font-size:18px;font-weight:800;color:var(--t1);letter-spacing:-.4px;margin-bottom:3px;}
.cal-range{font-size:11.5px;color:var(--t4);display:flex;align-items:center;gap:5px;}
.cal-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px;}
.cstat{background:var(--surface2);border:1px solid var(--border);border-radius:11px;padding:10px 8px;text-align:center;}
.cstat-n{font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:600;line-height:1;}
.cstat-l{font-size:9px;font-weight:700;color:var(--t4);text-transform:uppercase;letter-spacing:.08em;margin-top:4px;}
.cs-earned .cstat-n{color:var(--ok-c);}
.cs-left   .cstat-n{color:var(--acc);}
.cs-abs    .cstat-n{color:var(--ab-c);}
.cs-half   .cstat-n{color:var(--hf-c);}
.cal-progress{background:var(--surface2);border:1px solid var(--border2);border-radius:11px;padding:12px 15px;}
.cp-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:7px;}
.cp-lbl{font-size:11.5px;font-weight:600;color:var(--t3);}
.cp-val{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:500;color:var(--t2);}
.cp-track{height:7px;background:var(--surface3);border-radius:99px;overflow:hidden;}
.cp-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#16a34a,#22c55e);transition:width .7s ease;}
.cp-fill.done{background:linear-gradient(90deg,#7c3aed,#a78bfa);}
.cal-nav{display:flex;align-items:center;justify-content:space-between;padding:12px 22px 8px;}
.cal-nav-btn{width:34px;height:34px;border-radius:9px;background:var(--surface2);border:1px solid var(--border);color:var(--t2);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;flex-shrink:0;}
.cal-nav-btn:hover{background:var(--surface3);color:var(--t1);border-color:var(--t4);}
.cal-month{font-size:15px;font-weight:800;color:var(--t1);letter-spacing:-.3px;}
.cal-hint-bar{display:flex;align-items:center;gap:6px;padding:4px 22px 8px;font-size:11px;color:var(--t4);}
.cal-hint-bar strong{color:var(--t2);}
.cal-dows{display:grid;grid-template-columns:repeat(7,1fr);padding:0 14px;gap:3px;}
.cal-dow{text-align:center;font-size:10px;font-weight:700;letter-spacing:.04em;padding:4px 0;}
.dow-wd{color:var(--t4);text-transform:uppercase;}
.dow-we{color:var(--cr-c);opacity:.4;text-transform:uppercase;}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);padding:4px 14px 14px;gap:4px;}
.cal-day{aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:10px;font-size:12px;font-weight:500;border:1.5px solid transparent;position:relative;transition:all .15s;user-select:none;-webkit-tap-highlight-color:transparent;min-width:0;cursor:default;gap:2px;}
.cday-num{line-height:1;font-weight:700;font-size:12.5px;}
.cday-dot{width:4px;height:4px;border-radius:50%;}
.cday-hrs{font-size:8px;font-weight:700;line-height:1;opacity:.9;}
.d-empty{pointer-events:none;}
.d-out{color:var(--border);pointer-events:none;}
.d-we{color:var(--t5);background:var(--surface2);border-color:transparent;}
.d-worked{background:var(--ok-bg);color:var(--ok-c);border-color:var(--ok-bdr);}
.d-absent{background:var(--cr-bg);color:var(--cr-c);border-color:var(--cr-bdr);font-weight:700;cursor:pointer;}
.d-half{background:var(--hf-bg);color:var(--hf-c);border-color:var(--hf-bdr);font-weight:700;cursor:pointer;}
.d-today{background:var(--acc3);color:var(--acc);border-color:var(--acc);font-weight:800;}
.d-future{background:var(--surface2);color:var(--t5);}
.d-clickable{cursor:pointer;}
.d-clickable:hover{transform:scale(1.12);box-shadow:0 3px 12px rgba(0,0,0,.1);z-index:2;}
.d-saving{opacity:.3;pointer-events:none;}
.cal-legend{display:flex;flex-wrap:wrap;gap:5px 12px;padding:10px 22px;border-top:1px solid var(--border2);background:var(--surface2);}
.leg{display:flex;align-items:center;gap:4px;font-size:10.5px;color:var(--t3);}
.leg-sq{width:11px;height:11px;border-radius:3px;border:1.5px solid transparent;flex-shrink:0;}
.cal-ft{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 22px;border-top:1px solid var(--border2);background:var(--surface);flex-wrap:wrap;}
.cal-ft-info{font-size:11.5px;color:var(--t4);flex:1;min-width:0;line-height:1.55;}
.saved-txt{font-size:12px;color:var(--ok-c);font-weight:700;}
.saving-txt{font-size:12px;color:var(--t4);}
.half-popup{position:fixed;z-index:400;background:var(--surface);border:1.5px solid var(--border);border-radius:14px;padding:16px 18px;box-shadow:var(--sh4);min-width:220px;animation:scaleIn .18s ease;}
.hp-h{font-size:13.5px;font-weight:800;color:var(--t1);margin-bottom:2px;}
.hp-s{font-size:11px;color:var(--t4);margin-bottom:2px;}
.hp-d{font-size:11.5px;color:var(--acc);font-weight:600;font-family:'JetBrains Mono',monospace;margin-bottom:10px;display:block;}
.hp-row{display:flex;gap:8px;align-items:center;}
.hp-inp{flex:1;background:var(--surface2);border:1.5px solid var(--border);border-radius:9px;padding:9px 10px;color:var(--t1);font-size:14px;outline:none;font-family:'JetBrains Mono',monospace;transition:all .18s;}
.hp-inp:focus{border-color:var(--acc);box-shadow:0 0 0 3px var(--acc3);}
.hp-unit{font-size:12px;color:var(--t4);font-weight:600;flex-shrink:0;}
.hp-warn{font-size:10.5px;color:var(--wa-c);background:var(--wa-bg);border:1px solid var(--wa-bdr);border-radius:7px;padding:5px 10px;margin-top:8px;line-height:1.55;}
.hp-btns{display:flex;gap:7px;margin-top:10px;}
.hp-btns .btn{flex:1;justify-content:center;font-size:12.5px;padding:8px 10px;}

/* ── EMPTY ── */
.empty-state{text-align:center;padding:64px 24px;border:2px dashed var(--border);border-radius:16px;background:var(--surface);animation:fadeIn .3s ease;}
.empty-ico{color:var(--t5);margin-bottom:16px;display:flex;justify-content:center;}
.empty-title{font-size:17px;font-weight:800;color:var(--t2);margin-bottom:8px;letter-spacing:-.3px;}
.empty-desc{font-size:13px;color:var(--t4);margin-bottom:22px;max-width:280px;margin-left:auto;margin-right:auto;line-height:1.8;}

/* ── SKELETON ── */
.skel-list{display:flex;flex-direction:column;gap:12px;padding:14px 22px 24px;}
.skel-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:20px;}
.skel-line{background:var(--surface3);border-radius:7px;position:relative;overflow:hidden;}
.skel-line::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent);animation:shimmer 1.6s ease-in-out infinite;}
[data-theme="dark"] .skel-line::after{background:linear-gradient(90deg,transparent,rgba(255,255,255,.04),transparent);}

/* ── RESPONSIVE ── */
@media (max-width:768px) {
  .nav-inner{padding:0 16px;height:58px;}
  .nav-tagline{display:none;}
  .nav-btn-label{display:none;}
  .clock-chip{display:none;}
  .page{padding:16px 0 80px;}
  .hero{grid-template-columns:repeat(2,1fr);gap:8px;padding:0 16px;margin-bottom:16px;}
  .stat-card{padding:14px;}
  .sc-num{font-size:26px;}
  .panel{border-radius:14px;margin-bottom:14px;}
  .filter-bar{padding:8px 16px;}
  .role-bar{padding:8px 16px;}
  .toolbar{padding:8px 16px;flex-direction:column;gap:7px;}
  .sort-sel,.sort-wrap{width:100%;}
  .result-info{padding:8px 16px 0;}
  .card-list{padding:10px 16px 20px;gap:10px;}
  .card-body{padding:14px 14px 12px 16px;}
  .card-main{flex-direction:column;gap:10px;}
  .card-side{flex-direction:row;align-items:center;justify-content:space-between;width:100%;}
  .countdown{text-align:left;}
  .cd-num{font-size:24px;}
  .card-foot{flex-direction:column;align-items:flex-start;gap:8px;padding:10px 14px 10px 16px;}
  .foot-actions{width:100%;display:flex;}
  .btn-sm,.btn-danger-ghost{flex:1;justify-content:center;}
  .form-row{grid-template-columns:1fr;}
  .form-body{padding:18px 18px 8px;}
  .form-ft{padding:14px 18px;}
  .modal-hd{padding:18px 18px 15px;}
  .cal-stats{grid-template-columns:repeat(2,1fr);}
  .cal-hd{padding:16px 16px 13px;}
  .cal-nav{padding:10px 16px 6px;}
  .cal-dows,.cal-grid{padding-left:8px;padding-right:8px;}
  .cal-legend{padding:8px 16px;}
  .cal-ft{padding:10px 16px;}
  .cal-hint-bar{padding:3px 16px 6px;}
  .half-popup{left:50%!important;transform:translateX(-50%);min-width:200px;}
  .empty-state{margin:0 16px;}
}
@media (max-width:480px) {
  .hero{grid-template-columns:repeat(2,1fr);}
  .cal-stats{grid-template-columns:repeat(2,1fr);}
  .cal-day{border-radius:8px;}
  .cday-num{font-size:11px;}
  .modal{border-radius:16px;max-width:100%;}
  .del-modal{border-radius:16px;max-width:100%;}
  .cal-box{border-radius:16px;}
}
@media (min-width:1024px) {
  .card-body{padding:20px 24px 18px 24px;}
  .card-foot{padding:12px 24px;}
  .card-list{padding:16px 24px 28px;}
  .filter-bar,.toolbar,.result-info,.role-bar,.panel-hd{padding-left:24px;padding-right:24px;}
}
`;

// ── SHEETJS LOADER ────────────────────────────────────────────
let _xlsxReady = null;
function loadXLSX() {
  if (_xlsxReady) return _xlsxReady;
  _xlsxReady = new Promise((resolve, reject) => {
    if (window.XLSX) { resolve(window.XLSX); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.onload  = () => resolve(window.XLSX);
    s.onerror = () => reject(new Error("Failed to load SheetJS"));
    document.head.appendChild(s);
  });
  return _xlsxReady;
}

function parseExcelDate(val) {
  if (val === null || val === undefined || val === "") return null;

  // Already a JS Date object (SheetJS cellDates:true)
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    const d = new Date(val);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split("T")[0];
  }

  // Numeric Excel serial date
  if (typeof val === "number") {
    if (val < 1) return null;
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split("T")[0];
  }

  // String — handle ISO format "YYYY-MM-DD" directly (from our own export)
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s; // already perfect

  // Try general date string parse
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }
  return null;
}

function normalizeHeaders(row) {
  const map = {};
  Object.keys(row).forEach(k => {
    // Use the original key for exact matching, stripped key for fuzzy matching
    const orig = k.trim();
    const low  = orig.toLowerCase().replace(/[^a-z]/g, "");

    // ── Exact column name matches first (handles the exported file perfectly) ──
    if      (orig === "Full Name")           { map.name        = row[k]; return; }
    else if (orig === "Email")               { map.email       = row[k]; return; }
    else if (orig === "Role / Department")   { map.role        = row[k]; return; }
    else if (orig === "Start Date")          { map.startDate   = row[k]; return; }
    else if (orig === "Required Hours")      { map.hours       = row[k]; return; }
    else if (orig === "Hours Per Day")       { map.hoursPerDay = row[k]; return; }

    // ── Fuzzy fallback — ORDER MATTERS: most specific first ──
    // hoursperday must come BEFORE hours to avoid collision
    if      (/hoursperd|perday|dailyhour/.test(low))              map.hoursPerDay = row[k];
    else if (/requiredhour|totalhour/.test(low))                  map.hours       = row[k];
    else if (/^hours$/.test(low))                                 map.hours       = row[k];
    else if (/fullname/.test(low))                                map.name        = row[k];
    else if (/^name$/.test(low))                                  map.name        = row[k];
    else if (/email/.test(low))                                   map.email       = row[k];
    else if (/roledept|roledepartment|department|dept|position/.test(low)) map.role = row[k];
    else if (/^role$/.test(low))                                  map.role        = row[k];
    else if (/startdate|datestart/.test(low))                     map.startDate   = row[k];
    else if (/^start$/.test(low))                                 map.startDate   = row[k];
  });
  return map;
}

async function exportTraineesToExcel(trainees) {
  const XLSX = await loadXLSX();
  const rows = trainees.map(t => {
    const stats = computeStats(t);
    const absences = t.absences || {};
    const absCount  = Object.values(absences).filter(v => v === "full").length;
    const halfCount = Object.values(absences).filter(v => v !== "full" && v !== null && v !== undefined).length;
    return {
      "Full Name":          t.name,
      "Email":              t.email || "",
      "Role / Department":  t.role  || "",
      "Start Date":         t.startDate,
      "Required Hours":     Number(t.hours),
      "Hours Per Day":      Number(t.hoursPerDay) || 8,
      "Estimated End Date": stats.displayEnd,
      "Hours Earned":       stats.hoursEarned,
      "Hours Remaining":    stats.hoursRemaining,
      "Progress (%)":       stats.pct,
      "Days Worked":        stats.daysWorked,
      "Absences":           absCount,
      "Half Days":          halfCount,
      "Status":             stats.urgency === "ok" ? "On Track" : stats.urgency === "warning" ? "Keep Going" : stats.urgency === "critical" ? "Almost There" : "Completed",
    };
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [{ wch:22 },{ wch:26 },{ wch:22 },{ wch:14 },{ wch:16 },{ wch:14 },{ wch:20 },{ wch:14 },{ wch:16 },{ wch:14 },{ wch:13 },{ wch:11 },{ wch:11 },{ wch:14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "OJT Trainees");
  XLSX.writeFile(wb, "OJT_Trainees_Export.xlsx");
}

async function downloadTemplate() {
  const XLSX = await loadXLSX();
  const rows = [
    { "Full Name":"Juan dela Cruz","Email":"juan@example.com","Role / Department":"Software Developer","Start Date":"2025-01-06","Required Hours":600,"Hours Per Day":8 },
    { "Full Name":"Maria Santos","Email":"maria@example.com","Role / Department":"Graphic Design","Start Date":"2025-02-03","Required Hours":500,"Hours Per Day":5 },
  ];
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [{ wch:22 },{ wch:26 },{ wch:22 },{ wch:14 },{ wch:16 },{ wch:14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Trainees");
  XLSX.writeFile(wb, "OJT_Import_Template.xlsx");
}

async function parseImportFile(file) {
  const XLSX = await loadXLSX();
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type:"array", cellDates:true });

  // Prefer "OJT Trainees" sheet (our own export format), else use first sheet
  // Skip "Import Template" sheet — it's sample data only
  const preferredSheet = ["OJT Trainees", "Trainees"].find(n => wb.SheetNames.includes(n));
  const sheetName = preferredSheet || wb.SheetNames.find(n => n !== "Import Template") || wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];

  // defval: null so we can distinguish empty from missing
  const raw = XLSX.utils.sheet_to_json(ws, { defval: null });
  const results = { valid:[], errors:[] };

  raw.forEach((row, i) => {
    const r      = normalizeHeaders(row);
    const rowNum = i + 2;

    const name      = String(r.name  ?? "").trim();
    const email     = String(r.email ?? "").trim();
    // Role: convert null/undefined/"null" to empty string cleanly
    const roleRaw   = r.role;
    const role      = (roleRaw === null || roleRaw === undefined || String(roleRaw).toLowerCase() === "null")
                        ? ""
                        : String(roleRaw).trim();
    const hours     = Number(r.hours);
    const hpd       = Number(r.hoursPerDay) || 8;
    const startDate = parseExcelDate(r.startDate);

    const errs = [];
    if (!name)                      errs.push("Missing name");
    if (!startDate)                 errs.push("Invalid or missing start date");
    if (!hours || hours <= 0)       errs.push("Invalid required hours");

    if (errs.length > 0) {
      results.errors.push({ row:rowNum, name:name||`Row ${rowNum}`, reasons:errs });
    } else {
      const endDate = addWeekdays(startDate, Math.ceil(hours / hpd));
      results.valid.push({
        name, email, role,
        startDate, endDate,
        hours:       String(hours),
        hoursPerDay: String(hpd),
        absences:    {},
      });
    }
  });
  return results;
}

// ── PROGRESS BAR ──────────────────────────────────────────────
function ProgressBar({ pct, urgency }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.width = "0%";
    const t = setTimeout(() => { if (ref.current) ref.current.style.width = pct + "%"; }, 80);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div className="prog-track">
      <div ref={ref} className={`prog-fill pf-${urgency}`} />
    </div>
  );
}

function ClockChip() {
  const { time, ampm, day, date } = usePHTime();
  return (
    <div className="clock-chip">
      <div className="clock-dot" />
      <div>
        <div className="clock-time">{time}</div>
        <div className="clock-sub">{ampm} · PHT</div>
      </div>
      <div className="clock-sep" />
      <div>
        <div className="clock-day">{day}</div>
        <div className="clock-date">{date}</div>
      </div>
    </div>
  );
}

function SkeletonCard({ delay = 0 }) {
  return (
    <div className="skel-card" style={{ animationDelay:`${delay}s` }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
        <div>
          <div className="skel-line" style={{ width:180,height:14,marginBottom:10 }} />
          <div className="skel-line" style={{ width:260,height:9 }} />
        </div>
        <div className="skel-line" style={{ width:70,height:34,borderRadius:99 }} />
      </div>
      <div style={{ display:"flex", gap:5, marginBottom:12 }}>
        {[80,90,70].map((w,i)=><div key={i} className="skel-line" style={{ width:w,height:25,borderRadius:7 }} />)}
      </div>
      <div className="skel-line" style={{ width:"100%",height:7,borderRadius:99,marginBottom:6 }} />
      <div style={{ display:"flex", justifyContent:"space-between" }}>
        <div className="skel-line" style={{ width:"28%",height:9 }} />
        <div className="skel-line" style={{ width:"18%",height:9 }} />
      </div>
    </div>
  );
}

const FILTERS = [
  { key:"all",      label:"All Trainees" },
  { key:"ok",       label:"On Track"     },
  { key:"warning",  label:"Keep Going"   },
  { key:"critical", label:"Almost There" },
  { key:"done",     label:"Graduated"    },
];

const FILTER_COLORS = {
  all:      { c:"#4f6ef7", bg:"rgba(79,110,247,.1)",  sh:"rgba(79,110,247,.15)"  },
  ok:       { c:"#16a34a", bg:"rgba(22,163,74,.1)",   sh:"rgba(22,163,74,.15)"   },
  warning:  { c:"#d97706", bg:"rgba(217,119,6,.1)",   sh:"rgba(217,119,6,.15)"   },
  critical: { c:"#dc2626", bg:"rgba(220,38,38,.1)",   sh:"rgba(220,38,38,.15)"   },
  done:     { c:"#7c3aed", bg:"rgba(124,58,237,.1)",  sh:"rgba(124,58,237,.15)"  },
};

const HERO_ITEMS = [
  { key:"all",      label:"Total Trainees",  sub:"registered & active",   color1:"#4f6ef7", icon:<Ico.Users /> },
  { key:"ok",       label:"On Track",        sub:"ahead of schedule",      color1:"#16a34a", icon:<Ico.Star />  },
  { key:"critical", label:"Almost There",    sub:"needs a strong push",    color1:"#dc2626", icon:<Ico.Rocket />},
  { key:"done",     label:"Graduated",       sub:"completed their OJT",    color1:"#7c3aed", icon:<Ico.Trophy />},
];

function HeroStats({ counts }) {
  return (
    <div className="hero">
      {HERO_ITEMS.map((item, i) => (
        <div key={item.key} className="stat-card" style={{ "--sc-c1":item.color1, animationDelay:`${i*0.07}s` }}>
          <div className="sc-label" style={{ color:item.color1 }}>{item.label}</div>
          <div className="sc-num" style={{ color:item.color1 }}>{counts[item.key] || 0}</div>
          <div className="sc-sub">{item.sub}</div>
          <div className="sc-icon" style={{ color:item.color1 }}>{item.icon}</div>
        </div>
      ))}
    </div>
  );
}

// ── CALENDAR MODAL ────────────────────────────────────────────
function CalendarModal({ trainee, onClose }) {
  const today      = todayStr();
  const absences   = trainee.absences || {};
  const fullDayHrs = Number(trainee.hoursPerDay) || 8;
  const totalHrs   = Number(trainee.hours) || 0;
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [vy,        setVy]        = useState(() => parseInt(trainee.startDate.slice(0,4)));
  const [vm,        setVm]        = useState(() => parseInt(trainee.startDate.slice(5,7)) - 1);
  const [halfPopup, setHalfPopup] = useState(null);
  const [halfHrs,   setHalfHrs]   = useState("");

  useEffect(() => {
    const fn = e => { if (e.key === "Escape") { if (halfPopup) setHalfPopup(null); else onClose(); } };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose, halfPopup]);

  const stats = computeStats(trainee);

  const saveAbsences = useCallback(async (newAbs) => {
    const s = computeStats({ ...trainee, absences: newAbs });
    setSaving(true); setSaved(false);
    try {
      await updateDoc(doc(db, "trainees", trainee.id), { absences: newAbs, endDate: s.displayEnd });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) { console.error(e); }
    setSaving(false);
  }, [trainee]);

  const handleDayClick = (ds, e) => {
    const cur = absences[ds];
    if (cur === undefined || cur === null) {
      saveAbsences({ ...absences, [ds]: "full" });
    } else if (cur === "full") {
      const rect = e.currentTarget.getBoundingClientRect();
      setHalfHrs("");
      const x = Math.max(8, Math.min(rect.left, window.innerWidth - 250));
      const y = Math.min(rect.bottom + 8, window.innerHeight - 240);
      setHalfPopup({ date: ds, x, y });
    } else {
      const n = { ...absences }; delete n[ds];
      saveAbsences(n);
    }
  };

  const halfHrsNum   = parseFloat(halfHrs);
  const halfHrsValid = !isNaN(halfHrsNum) && halfHrsNum > 0;
  const confirmHalf  = () => {
    if (!halfPopup || !halfHrsValid) return;
    saveAbsences({ ...absences, [halfPopup.date]: Math.min(halfHrsNum, fullDayHrs) });
    setHalfPopup(null);
  };

  const prevM = () => vm === 0  ? (setVm(11), setVy(y => y-1)) : setVm(m => m-1);
  const nextM = () => vm === 11 ? (setVm(0),  setVy(y => y+1)) : setVm(m => m+1);

  const firstDow    = new Date(vy, vm, 1).getDay();
  const daysInMonth = new Date(vy, vm+1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const ds  = `${vy}-${String(vm+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const dow = new Date(ds+"T12:00:00").getDay();
    const isWe    = dow === 0 || dow === 6;
    const inRange = ds >= trainee.startDate && ds <= stats.displayEnd;
    const rec     = absences[ds];
    const isPast  = ds < today;
    const isToday = ds === today;
    const clickable = inRange && !isWe && isPast;
    let state = "out";
    if (inRange) {
      if (isWe)                                   state = "we";
      else if (rec === "full")                    state = "absent";
      else if (rec !== undefined && rec !== null) state = "half";
      else if (isToday)                           state = "today";
      else if (isPast)                            state = "worked";
      else                                        state = "future";
    }
    cells.push({ d, ds, state, clickable, rec });
  }

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dotColor = { worked:"var(--ok-c)", absent:"var(--cr-c)", half:"var(--hf-c)", today:"var(--acc)", future:"var(--t5)" };
  const absCount  = Object.values(absences).filter(v => v === "full").length;
  const halfCount = Object.values(absences).filter(v => v !== "full" && v !== null && v !== undefined).length;
  const hrsPct    = totalHrs > 0 ? Math.min(100, Math.round((stats.hoursEarned/totalHrs)*100)) : 0;
  const isDone    = stats.hoursRemaining <= 0;

  return (
    <>
      <div className="cal-overlay" onClick={() => !halfPopup && onClose()}>
        <div className="cal-box" onClick={e => e.stopPropagation()}>
          <div className="cal-hd">
            <div className="cal-hdr">
              <div>
                <div className="cal-trainee">{trainee.name}</div>
                <div className="cal-range"><Ico.Cal /> {fDate(trainee.startDate)} → {fDate(stats.displayEnd)}</div>
              </div>
              <button className="modal-x" onClick={onClose}><Ico.X /></button>
            </div>
            <div className="cal-stats">
              <div className="cstat cs-earned"><div className="cstat-n">{stats.hoursEarned.toFixed(1)}</div><div className="cstat-l">Earned hrs</div></div>
              <div className="cstat cs-left"><div className="cstat-n">{stats.hoursRemaining.toFixed(1)}</div><div className="cstat-l">Remaining</div></div>
              <div className="cstat cs-abs"><div className="cstat-n">{absCount}</div><div className="cstat-l">Absences</div></div>
              <div className="cstat cs-half"><div className="cstat-n">{halfCount}</div><div className="cstat-l">Half Days</div></div>
            </div>
            <div className="cal-progress">
              <div className="cp-top">
                <span className="cp-lbl">Overall Progress</span>
                <span className="cp-val">{stats.hoursEarned.toFixed(1)} / {totalHrs} hrs · {hrsPct}%</span>
              </div>
              <div className="cp-track">
                <div className={`cp-fill${isDone?" done":""}`} style={{ width:`${hrsPct}%` }} />
              </div>
            </div>
          </div>
          <div className="cal-nav">
            <button className="cal-nav-btn" onClick={prevM}><Ico.ChevL /></button>
            <span className="cal-month">{MONTHS[vm]} {vy}</span>
            <button className="cal-nav-btn" onClick={nextM}><Ico.ChevR /></button>
          </div>
          <div className="cal-hint-bar">
            <Ico.Info />
            Tap a workday: <strong>1× Absent</strong> · <strong>2× Half-day</strong> · <strong>3× Clear</strong>
          </div>
          <div className="cal-dows">
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d,i) => (
              <div key={d} className={`cal-dow ${i===0||i===6?"dow-we":"dow-wd"}`}>{d}</div>
            ))}
          </div>
          <div className="cal-grid">
            {cells.map((cell, i) => {
              if (!cell) return <div key={`e${i}`} className="cal-day d-empty" />;
              const { d, ds, state, clickable, rec } = cell;
              const cls = ["cal-day",`d-${state}`,clickable&&"d-clickable",saving&&clickable&&"d-saving"].filter(Boolean).join(" ");
              return (
                <div key={ds} className={cls}
                  onClick={clickable&&!saving?(e)=>handleDayClick(ds,e):undefined}
                >
                  <span className="cday-num">{d}</span>
                  {state==="half"&&rec!=null&&<span className="cday-hrs">{Number(rec)}h</span>}
                  {dotColor[state]&&<span className="cday-dot" style={{ background:dotColor[state] }} />}
                </div>
              );
            })}
          </div>
          <div className="cal-legend">
            {[
              { label:"Present",  bg:"var(--ok-bg)", bdr:"var(--ok-bdr)" },
              { label:"Absent",   bg:"var(--cr-bg)", bdr:"var(--cr-bdr)" },
              { label:"Half Day", bg:"var(--hf-bg)", bdr:"var(--hf-bdr)" },
              { label:"Today",    bg:"var(--acc3)",  bdr:"var(--acc4)"   },
              { label:"Upcoming", bg:"var(--surface2)",bdr:"var(--border2)" },
              { label:"Weekend",  bg:"var(--surface2)",bdr:"transparent"  },
            ].map(l => (
              <div key={l.label} className="leg">
                <div className="leg-sq" style={{ background:l.bg, borderColor:l.bdr }} />
                {l.label}
              </div>
            ))}
          </div>
          <div className="cal-ft">
            <div className="cal-ft-info">
              {absCount===0&&halfCount===0
                ? "Tap any past weekday within the OJT range to record attendance."
                : `${absCount} absent · ${halfCount} half day${halfCount!==1?"s":""} — end date auto-updated.`}
            </div>
            <div style={{ display:"flex",alignItems:"center",gap:8,flexShrink:0 }}>
              {saved  && <span className="saved-txt">✓ Saved!</span>}
              {saving && <span className="saving-txt">Saving…</span>}
              <button className="btn btn-ghost" style={{ padding:"7px 14px",fontSize:12.5 }} onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
      {halfPopup && (
        <div className="half-popup" style={{ top:halfPopup.y,left:halfPopup.x }} onClick={e=>e.stopPropagation()}>
          <div className="hp-h">Log Half-Day Hours</div>
          <div className="hp-s">Full day = {fullDayHrs} hrs. How many hours were worked?</div>
          <span className="hp-d">{halfPopup.date}</span>
          <div className="hp-row">
            <input className="hp-inp" type="number" min="0.5" max={fullDayHrs} step="0.5"
              value={halfHrs} onChange={e=>setHalfHrs(e.target.value)}
              placeholder={`0.5 – ${fullDayHrs-0.5}`} autoFocus
              onKeyDown={e=>{if(e.key==="Enter")confirmHalf();if(e.key==="Escape")setHalfPopup(null);}}
            />
            <span className="hp-unit">hrs</span>
          </div>
          {halfHrsValid&&halfHrsNum>=fullDayHrs&&<div className="hp-warn">⚠ Equals full day — counted as present.</div>}
          {halfHrsValid&&halfHrsNum<1&&<div className="hp-warn">⚠ Very low — full day is {fullDayHrs} hrs.</div>}
          <div className="hp-btns">
            <button className="btn btn-ghost" onClick={()=>setHalfPopup(null)}>Cancel</button>
            <button className="btn btn-primary" disabled={!halfHrsValid} onClick={confirmHalf}><Ico.Check /> Save</button>
          </div>
        </div>
      )}
    </>
  );
}

// ── IMPORT MODAL ──────────────────────────────────────────────
function ImportModal({ onImport, onCancel }) {
  const [drag,      setDrag]      = useState(false);
  const [parsing,   setParsing]   = useState(false);
  const [preview,   setPreview]   = useState(null);
  const [importing, setImporting] = useState(false);
  const [done,      setDone]      = useState(false);

  useEffect(() => {
    const fn = e => e.key==="Escape"&&onCancel();
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onCancel]);

  const handleFile = async (file) => {
    if (!file) return;
    setParsing(true); setPreview(null);
    try {
      const result = await parseImportFile(file);
      setPreview(result);
    } catch(e) {
      setPreview({ valid:[], errors:[{ row:"—",name:"File Error",reasons:[e.message] }] });
    }
    setParsing(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleConfirm = async () => {
    if (!preview?.valid?.length) return;
    setImporting(true);
    try {
      for (const trainee of preview.valid) await addDoc(collection(db,"trainees"), trainee);
      setDone(true);
      setTimeout(() => onImport(), 1200);
    } catch(e) { console.error(e); }
    setImporting(false);
  };

  return (
    <div className="overlay" onClick={onCancel}>
      <div className="import-modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-hd">
          <span className="modal-title">Import Trainees from Excel</span>
          <button className="modal-x" onClick={onCancel}><Ico.X /></button>
        </div>
        <div className="form-body" style={{ gap:16 }}>
          <div className="template-info">
            <strong>Required columns:</strong> <code>Full Name</code>, <code>Email</code>,{" "}
            <code>Role / Department</code>, <code>Start Date</code>, <code>Required Hours</code>,{" "}
            <code>Hours Per Day</code> (optional, defaults to 8).{" "}
            <button style={{ background:"none",border:"none",color:"var(--acc)",cursor:"pointer",fontWeight:700,fontSize:12,padding:0,fontFamily:"inherit",textDecoration:"underline" }} onClick={downloadTemplate}>
              Download template
            </button>
          </div>
          {!preview && (
            <div className={`import-dropzone${drag?" drag":""}`}
              onDragOver={e=>{e.preventDefault();setDrag(true);}}
              onDragLeave={()=>setDrag(false)}
              onDrop={handleDrop}
            >
              <input type="file" accept=".xlsx,.xls,.csv" onChange={e=>handleFile(e.target.files?.[0])} />
              <div className="idz-icon"><Ico.Sheet /></div>
              <div className="idz-title">{parsing?"Parsing file…":"Drop your Excel file here"}</div>
              <div className="idz-sub">{parsing?"Please wait while we read your spreadsheet.":"or click to browse · supports .xlsx, .xls, .csv"}</div>
            </div>
          )}
          {preview && (
            <>
              {preview.valid.length > 0 && (
                <div className={`import-result ${preview.errors.length>0?"ir-warn":"ir-ok"}`}>
                  <Ico.Check />
                  {preview.valid.length} trainee{preview.valid.length!==1?"s":""} ready to import
                  {preview.errors.length>0&&` · ${preview.errors.length} row${preview.errors.length!==1?"s":""} skipped`}
                </div>
              )}
              {preview.valid.length === 0 && (
                <div className="import-result ir-err"><Ico.AlertTri /> No valid rows found — check your file and column headers.</div>
              )}
              {preview.valid.length > 0 && (
                <div className="preview-table-wrap">
                  <table className="preview-table">
                    <thead><tr><th>Name</th><th>Role</th><th>Start</th><th>Hrs</th><th>Est. End</th></tr></thead>
                    <tbody>
                      {preview.valid.map((t,i) => (
                        <tr key={i}>
                          <td><div className="pt-name">{t.name}</div>{t.email&&<div style={{ fontSize:10.5,color:"var(--t4)" }}>{t.email}</div>}</td>
                          <td className="pt-role">{t.role||<span style={{color:"var(--t5)"}}>—</span>}</td>
                          <td style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:11 }}>{t.startDate}</td>
                          <td style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:11 }}>{t.hours}</td>
                          <td style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--acc)" }}>{t.endDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {preview.errors.length > 0 && (
                <details style={{ fontSize:12,color:"var(--cr-c)" }}>
                  <summary style={{ cursor:"pointer",fontWeight:600,marginBottom:6 }}>
                    {preview.errors.length} skipped row{preview.errors.length!==1?"s":""}
                  </summary>
                  {preview.errors.map((e,i) => (
                    <div key={i} style={{ padding:"3px 0",color:"var(--t3)" }}>
                      Row {e.row} · <b style={{color:"var(--t2)"}}>{e.name}</b> — {e.reasons.join(", ")}
                    </div>
                  ))}
                </details>
              )}
              <button className="btn btn-ghost" style={{ fontSize:12.5,padding:"7px 13px",alignSelf:"flex-start" }}
                onClick={()=>{setPreview(null);setDone(false);}}>
                Choose a different file
              </button>
            </>
          )}
        </div>
        <div className="form-ft">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" disabled={!preview?.valid?.length||importing||done}
            onClick={handleConfirm} style={{ minWidth:160,justifyContent:"center" }}>
            {done ? <><Ico.Check /> Imported!</> : importing ? "Importing…" :
              <><Ico.Upload /> Import {preview?.valid?.length||""} Trainee{preview?.valid?.length!==1?"s":""}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── DELETE MODAL ──────────────────────────────────────────────
function DeleteModal({ name, onConfirm, onCancel }) {
  useEffect(() => {
    const fn = e => e.key==="Escape"&&onCancel();
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onCancel]);
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="del-modal" onClick={e=>e.stopPropagation()}>
        <div className="del-body">
          <div className="del-icon-ring"><Ico.Trash /></div>
          <div className="del-title">Remove Trainee?</div>
          <div className="del-name">{name}</div>
          <div className="del-desc">This will permanently delete this trainee and all their attendance data. This action cannot be undone.</div>
        </div>
        <div className="del-ft">
          <button className="btn btn-ghost" onClick={onCancel}>Keep Trainee</button>
          <button className="btn btn-danger" onClick={onConfirm}><Ico.Trash /> Yes, Remove</button>
        </div>
      </div>
    </div>
  );
}

// ── TRAINEE CARD ──────────────────────────────────────────────
function TraineeCard({ t, onEdit, onDelete, onCalendar, idx }) {
  const stats   = computeStats(t);
  const { urgency, pct, wdLeft, hoursEarned, hoursRemaining, daysWorked, daysRemaining } = stats;
  const meta    = STATUS[urgency];
  const absences  = t.absences || {};
  const absCount  = Object.values(absences).filter(v => v === "full").length;
  const halfCount = Object.values(absences).filter(v => v !== "full" && v !== null && v !== undefined).length;

  return (
    <div className="card" style={{ animationDelay:`${idx*0.05}s` }}>
      <div className={`card-accent ca-${urgency}`} />
      <div className="card-body">
        <div className="card-main">
          <div className="card-info">
            <div className={`card-name${urgency==="done"?" done":""}`}>{t.name}</div>
            {t.role && (
              <div className="card-role">
                <Ico.Tag />
                {t.role}
              </div>
            )}
            <div className="card-meta">
              <span className="chip"><Ico.Cal />&nbsp;{fShort(t.startDate)} – {fDate(stats.displayEnd)}</span>
              <span className="chip"><Ico.Clock />&nbsp;{t.hours} hrs · {t.hoursPerDay||8} hrs/day</span>
              <span className="chip"><Ico.Brief />&nbsp;{countWeekdays(t.startDate,stats.displayEnd)} workdays</span>
            </div>
          </div>
          <div className="card-side">
            <div className="status-badge" style={{ "--sb-bg":meta.bg,"--sb-c":meta.color,"--sb-bdr":meta.bdr }}>
              <span className={`sb-dot${urgency==="critical"?" blink":""}`} />
              {meta.label}
            </div>
            <div className="countdown">
              {wdLeft <= 0
                ? <div className="cd-done" style={{ color:meta.color }}>✓ Done!</div>
                : <><div className="cd-num" style={{ color:meta.color }}>{wdLeft}</div><div className="cd-lbl">days left</div></>
              }
            </div>
          </div>
        </div>
        <div className="hrs-row">
          <span className="hchip hc-e"><Ico.Check />&nbsp;{hoursEarned.toFixed(1)} hrs earned</span>
          <span className="hchip hc-r"><Ico.Clock />&nbsp;{hoursRemaining.toFixed(1)} remaining</span>
          {absCount  > 0 && <span className="hchip hc-a">{absCount} absent</span>}
          {halfCount > 0 && <span className="hchip hc-h">{halfCount} half-day{halfCount>1?"s":""}</span>}
        </div>
        <div className="prog-area">
          <div className="prog-labels">
            <span className="prog-txt">OJT Progress</span>
            <span className="prog-pct" style={{ color:meta.color }}>{pct}%</span>
          </div>
          <ProgressBar pct={pct} urgency={urgency} />
          <div className="prog-bot">
            <span>{daysWorked} days present</span>
            <span>{Math.max(0,daysRemaining)} workdays left</span>
          </div>
        </div>
      </div>
      <div className="card-foot">
        <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
          <div className="foot-date">Estimated end: <b>{fDate(stats.displayEnd)}</b></div>
          <div className="foot-tags">
            {absCount  > 0 && <span className="tag-abs">{absCount} absent</span>}
            {halfCount > 0 && <span className="tag-hf">{halfCount} half</span>}
          </div>
        </div>
        <div className="foot-actions">
          <button className="btn btn-sm" onClick={()=>onCalendar(t)}><Ico.Cal />&nbsp;Attendance</button>
          <button className="btn btn-sm" onClick={()=>onEdit(t)}><Ico.Edit />&nbsp;Edit</button>
          <button className="btn btn-danger-ghost" onClick={()=>onDelete(t.id,t.name)}><Ico.Trash />&nbsp;Remove</button>
        </div>
      </div>
    </div>
  );
}

// ── TRAINEE FORM ──────────────────────────────────────────────
function TraineeForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || { name:"",role:"",startDate:todayStr(),hours:"",hoursPerDay:"8" }
  );
  const set    = (k,v) => setForm(f => ({ ...f,[k]:v }));
  const isEdit = !!initial;

  const preview = useMemo(() => {
    const hrs = Number(form.hours), hpd = Number(form.hoursPerDay)||8;
    if (!form.startDate||!hrs||hrs<=0||hpd<=0) return null;
    const days    = Math.ceil(hrs/hpd);
    const endDate = addWeekdays(form.startDate,days);
    return { days, endDate };
  }, [form.startDate,form.hours,form.hoursPerDay]);

  const valid = form.name.trim()&&form.startDate&&Number(form.hours)>0&&preview;

  const handleSave = () => {
    if (!valid) return;
    onSave({
      name:form.name.trim(),role:form.role.trim(),startDate:form.startDate,
      endDate:preview.endDate,hours:form.hours,hoursPerDay:form.hoursPerDay||"8",
      absences:initial?.absences||{},
    });
  };

  return (
    <>
      <div className="form-body">
        <div className="form-group">
          <label className="form-label">Full Name <span className="req">*</span></label>
          <input className="form-input" value={form.name} onChange={e=>set("name",e.target.value)}
            placeholder="e.g. Juan dela Cruz" autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">Role / Department</label>
          <input className="form-input" value={form.role} onChange={e=>set("role",e.target.value)}
            placeholder="e.g. Software Developer, IT Support, Graphic Design" />
          <span className="form-hint">The trainee's assigned role or department in the organization.</span>
        </div>
        <div className="form-group">
          <label className="form-label">Start Date <span className="req">*</span></label>
          <input className="form-input" type="date" value={form.startDate} onChange={e=>set("startDate",e.target.value)} />
          <span className="form-hint">Weekends are automatically skipped in all calculations.</span>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Required Hours <span className="req">*</span></label>
            <input className="form-input" type="number" min="1" value={form.hours} onChange={e=>set("hours",e.target.value)} placeholder="e.g. 600" />
          </div>
          <div className="form-group">
            <label className="form-label">Hours Per Day</label>
            <input className="form-input" type="number" min="1" max="24" value={form.hoursPerDay} onChange={e=>set("hoursPerDay",e.target.value)} placeholder="8" />
          </div>
        </div>
        {preview ? (
          <div className="preview-box">
            <div className="pv-item"><span className="pv-val">{preview.days}</span><span className="pv-lbl">Working Days</span></div>
            <div className="pv-div" />
            <div className="pv-item"><span className="pv-val">{fDate(preview.endDate)}</span><span className="pv-lbl">Estimated End</span></div>
            <div className="pv-div" />
            <div className="pv-item"><span className="pv-val" style={{ fontSize:11,color:"var(--t4)" }}>Attendance</span><span className="pv-lbl">log absences later</span></div>
          </div>
        ) : (
          <div style={{ fontSize:12.5,color:"var(--t4)",padding:"14px",background:"var(--surface2)",borderRadius:9,border:"1.5px dashed var(--border)",textAlign:"center",lineHeight:1.8 }}>
            Fill in the start date &amp; required hours to preview the schedule.
          </div>
        )}
      </div>
      <div className="form-ft">
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" disabled={!valid} onClick={handleSave}>
          <Ico.Check /> {isEdit?"Save Changes":"Add Trainee"}
        </button>
      </div>
    </>
  );
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const fn = e => e.key==="Escape"&&onClose();
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-hd">
          <span className="modal-title">{title}</span>
          <button className="modal-x" onClick={onClose}><Ico.X /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── APP ROOT ──────────────────────────────────────────────────
export default function App() {
  const [theme,      setTheme]      = useState(() => localStorage.getItem("ojt-theme") || "light");
  const [trainees,   setTrainees]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showAdd,    setShowAdd]    = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [deleting,   setDeleting]   = useState(null);
  const [calendar,   setCalendar]   = useState(null);
  const [search,     setSearch]     = useState("");
  const [filter,     setFilter]     = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");  // ← FIXED: initialized correctly
  const [sort,       setSort]       = useState("endDate");
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ojt-theme", theme);
  }, [theme]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "trainees"), snap => {
      setTrainees(snap.docs.map(d => ({ id:d.id,...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAdd     = async (f) => { try { await addDoc(collection(db,"trainees"),f); setShowAdd(false); } catch(e){ console.error(e); } };
  const handleEdit    = async (f) => { try { await updateDoc(doc(db,"trainees",editing.id),f); setEditing(null); } catch(e){ console.error(e); } };
  const handleDelete  = (id,name) => setDeleting({ id,name });
  const confirmDelete = async () => { if(!deleting)return; try{ await deleteDoc(doc(db,"trainees",deleting.id)); }catch(e){console.error(e);} setDeleting(null); };

  const liveCalendar = useMemo(() => {
    if (!calendar) return null;
    return trainees.find(x => x.id === calendar.id) || calendar;
  }, [calendar, trainees]);

  // ── Derive unique roles — FIXED: recalculates cleanly on every trainees change ──
  const uniqueRoles = useMemo(() => {
    const seen = new Set();
    const roles = [];
    for (const t of trainees) {
      const r = (t.role || "").trim();
      if (r && !seen.has(r)) { seen.add(r); roles.push(r); }
    }
    return roles.sort((a, b) => a.localeCompare(b));
  }, [trainees]);

  // ── FIXED: If the currently selected role no longer exists, reset to "all" ──
  useEffect(() => {
    if (roleFilter !== "all" && !uniqueRoles.includes(roleFilter)) {
      setRoleFilter("all");
    }
  }, [uniqueRoles, roleFilter]);

  const counts = useMemo(() => ({
    all:      trainees.length,
    ok:       trainees.filter(t => computeStats(t).urgency === "ok").length,
    warning:  trainees.filter(t => computeStats(t).urgency === "warning").length,
    critical: trainees.filter(t => computeStats(t).urgency === "critical").length,
    done:     trainees.filter(t => computeStats(t).urgency === "done").length,
  }), [trainees]);

  // ── FIXED: role filter uses strict trimmed comparison ──
  const visible = useMemo(() => trainees
    .filter(t => filter === "all" || computeStats(t).urgency === filter)
    .filter(t => {
      if (roleFilter === "all") return true;
      return (t.role || "").trim() === roleFilter;   // ← FIXED: trim both sides
    })
    .filter(t => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return t.name.toLowerCase().includes(q) || (t.role||"").toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sort === "name")   return a.name.localeCompare(b.name);
      if (sort === "pct")    return computeStats(b).pct - computeStats(a).pct;
      if (sort === "role")   return (a.role||"").localeCompare(b.role||"");
      if (sort === "recent") return new Date(b.startDate) - new Date(a.startDate);
      return computeStats(a).wdLeft - computeStats(b).wdLeft;
    }), [trainees, filter, roleFilter, search, sort]);

  return (
    <>
      <style>{CSS}</style>

      {/* ── NAVBAR ── */}
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-brand">
            <div className="nav-logo"><Ico.Logo /></div>
            <div>
              <div className="nav-name">OJT Tracker</div>
              <div className="nav-tagline">On-the-Job Training Monitor</div>
            </div>
          </div>
          <div className="nav-right">
            <ClockChip />
            <button className="btn-icon" onClick={()=>setTheme(t=>t==="light"?"dark":"light")} title="Toggle theme">
              {theme==="light"?<Ico.Moon />:<Ico.Sun />}
            </button>
            {trainees.length > 0 && (
              <button className="btn-outline green" onClick={()=>exportTraineesToExcel(trainees)}>
                <Ico.Download /> <span className="nav-btn-label">Export</span>
              </button>
            )}
            <button className="btn-outline" onClick={()=>setShowImport(true)}>
              <Ico.Upload /> <span className="nav-btn-label">Import</span>
            </button>
            <button className="btn btn-primary" onClick={()=>setShowAdd(true)}>
              <Ico.Plus /> <span>Add Trainee</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── MAIN ── */}
      <main className="page">
        <HeroStats counts={counts} />

        <div className="panel">
          {/* Header */}
          <div className="panel-hd">
            <div>
              <div className="panel-title">Trainee Dashboard</div>
              <div className="panel-sub">
                {trainees.length === 0
                  ? "No trainees yet — add your first one to start tracking!"
                  : `${trainees.length} trainee${trainees.length!==1?"s":""} · ${counts.done} completed · ${counts.critical} need attention`}
              </div>
            </div>
          </div>

          {/* Status filters */}
          <div className="filter-bar">
            {FILTERS.map(opt => {
              const fc     = FILTER_COLORS[opt.key];
              const count  = opt.key === "all" ? trainees.length : (counts[opt.key]||0);
              const active = filter === opt.key;
              return (
                <button key={opt.key}
                  className={`fpill${active?" act":""}`}
                  style={{ "--fp-c":fc.c,"--fp-bg":fc.bg,"--fp-sh":fc.sh }}
                  onClick={()=>setFilter(active&&opt.key!=="all"?"all":opt.key)}
                >
                  <span className="fpill-dot" />
                  {opt.label}
                  <span className="fpill-n">{count}</span>
                </button>
              );
            })}
          </div>

          {/* ── ROLE FILTER — FIXED ── */}
          {uniqueRoles.length > 0 && (
            <div className="role-bar">
              <span className="role-label">Role</span>
              {/* "All Roles" pill */}
              <button
                className={`rpill${roleFilter === "all" ? " act" : ""}`}
                onClick={() => setRoleFilter("all")}
              >
                All Roles
                <span className="rpill-n">{trainees.length}</span>
              </button>
              {/* Individual role pills — key by role string for correct re-render */}
              {uniqueRoles.map(role => {
                const count   = trainees.filter(t => (t.role||"").trim() === role).length;
                const isActive = roleFilter === role;
                return (
                  <button
                    key={role}
                    className={`rpill${isActive ? " act" : ""}`}
                    onClick={() => setRoleFilter(isActive ? "all" : role)}
                  >
                    <Ico.Tag />
                    {role}
                    <span className="rpill-n">{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Search + sort */}
          <div className="toolbar">
            <div className="search-wrap">
              <span className="search-ico"><Ico.Search /></span>
              <input className="search-inp"
                placeholder="Search by name or role…"
                value={search}
                onChange={e=>setSearch(e.target.value)}
              />
            </div>
            <div className="sort-wrap">
              <span className="sort-ico"><Ico.Sort /></span>
              <select className="sort-sel" value={sort} onChange={e=>setSort(e.target.value)}>
                <option value="endDate">Ending Soonest</option>
                <option value="name">Name A – Z</option>
                <option value="pct">Progress %</option>
                <option value="role">Role A – Z</option>
                <option value="recent">Recently Started</option>
              </select>
            </div>
          </div>

          {/* Result count */}
          {!loading && trainees.length > 0 && (
            <div className="result-info">
              <span className="ri-label">
                {roleFilter !== "all" ? `Role: ${roleFilter}` : "Trainees"}
              </span>
              <span className="ri-count">Showing <b>{visible.length}</b> of <b>{trainees.length}</b></span>
            </div>
          )}

          {/* List */}
          {loading ? (
            <div className="skel-list">
              {[0,0.1,0.2].map((d,i) => <SkeletonCard key={i} delay={d} />)}
            </div>
          ) : visible.length === 0 ? (
            <div className="card-list">
              <div className="empty-state">
                <div className="empty-ico"><Ico.Board /></div>
                <div className="empty-title">
                  {trainees.length === 0 ? "No trainees yet" : "No results found"}
                </div>
                <div className="empty-desc">
                  {trainees.length === 0
                    ? "Add your first OJT trainee to start tracking their journey and progress!"
                    : "Try adjusting your search term or clearing the active filter."}
                </div>
                {trainees.length === 0 && (
                  <button className="btn btn-primary" onClick={()=>setShowAdd(true)}>
                    <Ico.Plus /> Add First Trainee
                  </button>
                )}
              </div>
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
        </div>
      </main>

      {/* ── MODALS ── */}
      {showImport && <ImportModal onImport={()=>setShowImport(false)} onCancel={()=>setShowImport(false)} />}
      {showAdd    && <Modal title="Add New Trainee" onClose={()=>setShowAdd(false)}><TraineeForm onSave={handleAdd} onCancel={()=>setShowAdd(false)} /></Modal>}
      {editing    && <Modal title="Edit Trainee"    onClose={()=>setEditing(null)}><TraineeForm initial={{...editing,role:editing.role||"",hoursPerDay:editing.hoursPerDay||"8"}} onSave={handleEdit} onCancel={()=>setEditing(null)} /></Modal>}
      {deleting   && <DeleteModal name={deleting.name} onConfirm={confirmDelete} onCancel={()=>setDeleting(null)} />}
      {liveCalendar && <CalendarModal trainee={liveCalendar} onClose={()=>setCalendar(null)} />}
    </>
  );
}