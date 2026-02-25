// ============================================================
//  OJT TRACKER — App.jsx  (Redesigned UI/UX)
//  · Clean, modern, professional aesthetic
//  · Smooth animations & micro-interactions
//  · Fully responsive: mobile, tablet, desktop
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
    daysRemaining,displayEnd,pct,urgency,wdLeft,daysWorked,daysHalf,fullDayHrs,totalRequired,
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
  Award:  ()=><svg width="18"height="18"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"strokeLinecap="round"strokeLinejoin="round"><circle cx="12"cy="8"r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
  Flag:   ()=><svg width="14"height="14"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"strokeLinecap="round"strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4"y1="22"x2="4"y2="15"/></svg>,
  Zap:    ()=><svg width="13"height="13"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2.5"strokeLinecap="round"strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Info:   ()=><svg width="14"height="14"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"strokeLinecap="round"strokeLinejoin="round"><circle cx="12"cy="12"r="10"/><line x1="12"y1="8"x2="12"y2="8"/><line x1="12"y1="12"x2="12"y2="16"/></svg>,
  Board:  ()=><svg width="40"height="40"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="1.2"strokeLinecap="round"strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8"y="2"width="8"height="4"rx="1"/><line x1="9"y1="12"x2="15"y2="12"/><line x1="9"y1="16"x2="12"y2="16"/></svg>,
};

const STATUS = {
  ok:       { label:"On Track",     short:"On Track",  color:"#10b981", bg:"rgba(16,185,129,.1)",  bdr:"rgba(16,185,129,.2)",  gradient:"linear-gradient(135deg,#10b981,#34d399)" },
  warning:  { label:"Keep Going",   short:"Keep Going",color:"#f59e0b", bg:"rgba(245,158,11,.1)",  bdr:"rgba(245,158,11,.2)",  gradient:"linear-gradient(135deg,#f59e0b,#fbbf24)" },
  critical: { label:"Almost There", short:"Critical",  color:"#ef4444", bg:"rgba(239,68,68,.1)",   bdr:"rgba(239,68,68,.2)",   gradient:"linear-gradient(135deg,#ef4444,#f87171)" },
  done:     { label:"Completed",    short:"Done",      color:"#8b5cf6", bg:"rgba(139,92,246,.1)",  bdr:"rgba(139,92,246,.2)",  gradient:"linear-gradient(135deg,#8b5cf6,#a78bfa)" },
};

const MOTIV = {
  ok:       "You're right on track — keep the momentum going!",
  warning:  "You've got this. A little extra effort goes a long way.",
  critical: "So close to the finish line — push through!",
  done:     "OJT complete — incredible work, well done! 🎉",
};

// ── STYLES ────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

:root {
  --bg: #f0f2f8;
  --bg2: #e8eaf4;
  --surface: #ffffff;
  --surface2: #f7f8fc;
  --surface3: #eef0f8;
  --border: #e2e5f0;
  --border2: #eaecf5;
  --t1: #0a0d1a;
  --t2: #2d3452;
  --t3: #5c6380;
  --t4: #9299b5;
  --t5: #c8cde6;
  --acc: #4f6ef7;
  --acc2: #3b5cf5;
  --acc3: rgba(79,110,247,.12);
  --acc4: rgba(79,110,247,.22);
  --nav: rgba(255,255,255,.85);
  --sh1: 0 1px 4px rgba(0,0,0,.06);
  --sh2: 0 4px 16px rgba(0,0,0,.08),0 1px 4px rgba(0,0,0,.04);
  --sh3: 0 12px 40px rgba(0,0,0,.12),0 4px 12px rgba(0,0,0,.06);
  --sh4: 0 24px 64px rgba(0,0,0,.16),0 8px 24px rgba(0,0,0,.08);
  --ok-c:#10b981; --ok-bg:rgba(16,185,129,.08); --ok-bdr:rgba(16,185,129,.2);
  --wa-c:#f59e0b; --wa-bg:rgba(245,158,11,.08); --wa-bdr:rgba(245,158,11,.2);
  --cr-c:#ef4444; --cr-bg:rgba(239,68,68,.08);  --cr-bdr:rgba(239,68,68,.2);
  --dn-c:#8b5cf6; --dn-bg:rgba(139,92,246,.08); --dn-bdr:rgba(139,92,246,.2);
  --ab-c:#f43f5e; --ab-bg:rgba(244,63,94,.08);  --ab-bdr:rgba(244,63,94,.2);
  --hf-c:#d97706; --hf-bg:rgba(217,119,6,.08);  --hf-bdr:rgba(217,119,6,.2);
}

[data-theme="dark"] {
  --bg: #070b18;
  --bg2: #090e1f;
  --surface: #0d1325;
  --surface2: #111829;
  --surface3: #0a0e1f;
  --border: #1a2240;
  --border2: #141c35;
  --t1: #f0f3ff;
  --t2: #b8c4e8;
  --t3: #5c6a90;
  --t4: #2e3d60;
  --t5: #1a2540;
  --acc: #6b8afb;
  --acc2: #5b7af9;
  --acc3: rgba(107,138,251,.12);
  --acc4: rgba(107,138,251,.25);
  --nav: rgba(7,11,24,.85);
  --sh1: 0 1px 4px rgba(0,0,0,.4);
  --sh2: 0 4px 16px rgba(0,0,0,.5),0 1px 4px rgba(0,0,0,.3);
  --sh3: 0 12px 40px rgba(0,0,0,.6),0 4px 12px rgba(0,0,0,.3);
  --sh4: 0 24px 64px rgba(0,0,0,.75),0 8px 24px rgba(0,0,0,.4);
  --ok-c:#4ade80; --ok-bg:rgba(74,222,128,.08); --ok-bdr:rgba(74,222,128,.2);
  --wa-c:#fbbf24; --wa-bg:rgba(251,191,36,.08); --wa-bdr:rgba(251,191,36,.2);
  --cr-c:#f87171; --cr-bg:rgba(248,113,113,.08);--cr-bdr:rgba(248,113,113,.2);
  --dn-c:#c084fc; --dn-bg:rgba(192,132,252,.08);--dn-bdr:rgba(192,132,252,.2);
  --ab-c:#fb7185; --ab-bg:rgba(251,113,133,.08);--ab-bdr:rgba(251,113,133,.2);
  --hf-c:#fbbf24; --hf-bg:rgba(251,191,36,.08); --hf-bdr:rgba(251,191,36,.2);
}

html{scroll-behavior:smooth;-webkit-text-size-adjust:100%;}
body{
  background:var(--bg);color:var(--t1);
  font-family:'Outfit',system-ui,sans-serif;
  min-height:100vh;line-height:1.5;
  -webkit-font-smoothing:antialiased;
  transition:background .25s,color .25s;
}
button{font-family:inherit;cursor:pointer;}
input,select,textarea{font-family:inherit;}
[data-theme="dark"] input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(.4);}
::-webkit-scrollbar{width:5px;height:5px;}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px;}
::-webkit-scrollbar-track{background:transparent;}

@keyframes fadeIn  {from{opacity:0}to{opacity:1}}
@keyframes slideUp {from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
@keyframes scaleIn {from{opacity:0;transform:scale(.95) translateY(10px)}to{opacity:1;transform:none}}
@keyframes pulse   {0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.8);opacity:.3}}
@keyframes blink   {0%,100%{opacity:1}50%{opacity:.25}}
@keyframes shimmer {0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
@keyframes spin    {from{transform:rotate(0)}to{transform:rotate(360deg)}}

/* ── NAV ── */
.nav{
  position:sticky;top:0;z-index:100;
  background:var(--nav);
  backdrop-filter:blur(24px) saturate(180%);
  -webkit-backdrop-filter:blur(24px) saturate(180%);
  border-bottom:1px solid var(--border);
}
.nav-inner{
  max-width:1100px;margin:0 auto;padding:0 24px;height:64px;
  display:flex;align-items:center;justify-content:space-between;gap:16px;
}
.nav-brand{display:flex;align-items:center;gap:12px;flex-shrink:0;}
.nav-logo{
  width:38px;height:38px;border-radius:11px;
  background:linear-gradient(135deg,var(--acc),var(--acc2));
  color:#fff;display:flex;align-items:center;justify-content:center;
  box-shadow:0 4px 14px var(--acc4),0 1px 3px rgba(0,0,0,.1);flex-shrink:0;
  transition:transform .2s,box-shadow .2s;
}
.nav-logo:hover{transform:scale(1.05);box-shadow:0 6px 20px var(--acc4);}
.nav-name{font-size:15px;font-weight:800;color:var(--t1);letter-spacing:-.4px;line-height:1.2;}
.nav-tagline{font-size:10.5px;color:var(--t4);font-weight:500;line-height:1;}
.nav-right{display:flex;align-items:center;gap:8px;}

/* Clock chip */
.clock-chip{
  display:flex;align-items:center;gap:10px;
  background:var(--surface2);border:1px solid var(--border);
  border-radius:10px;padding:7px 13px;
}
.clock-dot{width:7px;height:7px;border-radius:50%;background:#22c55e;flex-shrink:0;animation:pulse 2.8s ease infinite;}
.clock-time{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;color:var(--t1);line-height:1.1;}
.clock-sub{font-size:9px;font-weight:700;color:var(--acc);letter-spacing:.08em;text-transform:uppercase;}
.clock-sep{width:1px;height:20px;background:var(--border);flex-shrink:0;}
.clock-day{font-size:9.5px;font-weight:700;color:var(--t2);letter-spacing:.03em;text-transform:uppercase;line-height:1.4;}
.clock-date{font-size:9.5px;color:var(--t4);line-height:1.4;}

/* ── BUTTONS ── */
.btn{
  display:inline-flex;align-items:center;gap:6px;
  font-family:'Outfit',sans-serif;font-weight:600;font-size:13.5px;
  border-radius:10px;border:none;cursor:pointer;
  transition:all .2s cubic-bezier(.34,1.2,.64,1);
  white-space:nowrap;line-height:1;
}
.btn-primary{
  background:linear-gradient(135deg,var(--acc),var(--acc2));
  color:#fff;padding:10px 18px;
  box-shadow:0 2px 10px var(--acc4),0 1px 3px rgba(0,0,0,.1);
}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 6px 20px var(--acc4);}
.btn-primary:active{transform:translateY(0);}
.btn-primary:disabled{opacity:.4;cursor:not-allowed;transform:none;box-shadow:none;}
.btn-ghost{background:var(--surface2);color:var(--t2);padding:10px 16px;border:1px solid var(--border);}
.btn-ghost:hover{background:var(--surface3);color:var(--t1);border-color:var(--border2);}
.btn-sm{background:var(--surface2);color:var(--t3);padding:7px 13px;border:1px solid var(--border);font-size:12.5px;border-radius:8px;}
.btn-sm:hover{background:var(--surface3);color:var(--t2);border-color:var(--t5);}
.btn-danger-ghost{background:var(--cr-bg);color:var(--cr-c);padding:7px 13px;border:1px solid var(--cr-bdr);font-size:12.5px;border-radius:8px;}
.btn-danger-ghost:hover{background:rgba(239,68,68,.15);}
.btn-danger{background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;padding:10px 18px;box-shadow:0 2px 10px rgba(239,68,68,.3);}
.btn-danger:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(239,68,68,.4);}
.btn-icon{
  width:38px;height:38px;border-radius:10px;
  background:var(--surface2);border:1px solid var(--border);
  color:var(--t3);display:flex;align-items:center;justify-content:center;
  cursor:pointer;transition:all .2s;flex-shrink:0;
}
.btn-icon:hover{background:var(--surface3);color:var(--t1);border-color:var(--t5);}

/* ── PAGE ── */
.page{max-width:1100px;margin:0 auto;padding:28px 24px 100px;}

/* ── HERO STATS ── */
.hero{
  display:grid;grid-template-columns:repeat(4,1fr);gap:12px;
  margin-bottom:20px;
}
.stat-card{
  background:var(--surface);border:1px solid var(--border);
  border-radius:16px;padding:18px 20px;
  box-shadow:var(--sh1);
  transition:transform .2s,box-shadow .2s;
  position:relative;overflow:hidden;
  animation:slideUp .4s ease both;
}
.stat-card::after{
  content:'';position:absolute;inset:0;
  background:linear-gradient(135deg,var(--sc-c1) 0%,transparent 60%);
  opacity:.04;pointer-events:none;border-radius:inherit;
}
.stat-card:hover{transform:translateY(-2px);box-shadow:var(--sh2);}
.sc-label{font-size:11px;font-weight:700;color:var(--t4);text-transform:uppercase;letter-spacing:.09em;margin-bottom:10px;display:flex;align-items:center;gap:5px;}
.sc-num{font-family:'JetBrains Mono',monospace;font-size:30px;font-weight:600;line-height:1;margin-bottom:4px;}
.sc-sub{font-size:11.5px;color:var(--t4);}
.sc-icon{position:absolute;right:16px;top:16px;opacity:.12;transform:scale(2);}

/* ── PANEL ── */
.panel{
  background:var(--surface);border:1px solid var(--border);
  border-radius:18px;box-shadow:var(--sh1);
  margin-bottom:20px;overflow:hidden;
}
.panel-hd{
  padding:18px 22px 16px;border-bottom:1px solid var(--border2);
  display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;
}
.panel-title{font-size:13.5px;font-weight:700;color:var(--t1);letter-spacing:-.2px;}
.panel-sub{font-size:11.5px;color:var(--t4);margin-top:2px;}

/* Filter pills */
.filter-bar{padding:14px 22px;border-bottom:1px solid var(--border2);display:flex;gap:7px;flex-wrap:wrap;overflow-x:auto;-webkit-overflow-scrolling:touch;}
.filter-bar::-webkit-scrollbar{height:0;}
.fpill{
  display:inline-flex;align-items:center;gap:6px;
  padding:7px 14px;border-radius:22px;cursor:pointer;
  font-size:12px;font-weight:600;
  border:1.5px solid var(--border);
  background:var(--surface2);color:var(--t4);
  transition:all .2s ease;white-space:nowrap;
  -webkit-tap-highlight-color:transparent;flex-shrink:0;
}
.fpill:hover{color:var(--fp-c);border-color:var(--fp-c);background:var(--fp-bg);}
.fpill.act{color:var(--fp-c);border-color:var(--fp-c);background:var(--fp-bg);box-shadow:0 2px 10px var(--fp-sh);}
.fpill-dot{width:7px;height:7px;border-radius:50%;background:var(--fp-c);flex-shrink:0;}
.fpill-n{font-family:'JetBrains Mono',monospace;font-size:10.5px;opacity:.75;}

/* ── TOOLBAR ── */
.toolbar{padding:14px 22px;display:flex;gap:10px;border-bottom:1px solid var(--border2);}
.search-wrap{flex:1;position:relative;min-width:0;}
.search-ico{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--t4);pointer-events:none;display:flex;}
.search-inp{
  width:100%;background:var(--surface2);border:1.5px solid var(--border);
  border-radius:10px;padding:9px 12px 9px 36px;color:var(--t1);
  font-size:13.5px;font-family:'Outfit',sans-serif;outline:none;
  transition:all .2s;
}
.search-inp:focus{border-color:var(--acc);box-shadow:0 0 0 3px var(--acc3);background:var(--surface);}
.search-inp::placeholder{color:var(--t4);}
.sort-wrap{position:relative;display:flex;align-items:center;flex-shrink:0;}
.sort-ico{position:absolute;left:11px;color:var(--t4);pointer-events:none;display:flex;z-index:1;}
.sort-sel{
  background:var(--surface2);border:1.5px solid var(--border);
  border-radius:10px;padding:9px 12px 9px 34px;color:var(--t2);
  font-size:13px;font-family:'Outfit',sans-serif;outline:none;cursor:pointer;
  appearance:none;min-width:170px;
  transition:border-color .2s;
}
.sort-sel:focus{border-color:var(--acc);}

/* Result info */
.result-info{padding:12px 22px 0;display:flex;align-items:center;justify-content:space-between;}
.ri-label{font-size:11px;font-weight:700;color:var(--t4);text-transform:uppercase;letter-spacing:.08em;}
.ri-count{font-size:12px;color:var(--t4);}
.ri-count b{color:var(--t2);font-weight:700;}

/* ── CARD ── */
.card-list{padding:12px 22px 22px;display:flex;flex-direction:column;gap:12px;}
.card{
  background:var(--surface2);border:1.5px solid var(--border);
  border-radius:14px;padding:0;
  transition:all .22s cubic-bezier(.34,1.2,.64,1);
  animation:slideUp .35s ease both;
  overflow:hidden;position:relative;
}
.card:hover{box-shadow:var(--sh2);border-color:var(--t5);transform:translateY(-2px);}

/* Status accent strip */
.card-strip{height:3px;width:100%;}
.card-strip.ok      {background:linear-gradient(90deg,#10b981,#34d399);}
.card-strip.warning {background:linear-gradient(90deg,#f59e0b,#fbbf24);}
.card-strip.critical{background:linear-gradient(90deg,#ef4444,#f87171);animation:blink 2.5s ease-in-out infinite;}
.card-strip.done    {background:linear-gradient(90deg,#8b5cf6,#a78bfa);}

.card-body{padding:18px 20px 16px;}

.card-main{display:flex;align-items:flex-start;gap:16px;margin-bottom:14px;}
.card-info{flex:1;min-width:0;}
.card-name{font-size:17px;font-weight:700;color:var(--t1);margin-bottom:5px;letter-spacing:-.3px;}
.card-name.done{color:var(--t4);text-decoration:line-through;text-decoration-color:var(--dn-c);}
.card-meta{display:flex;flex-wrap:wrap;gap:5px;}
.chip{
  display:inline-flex;align-items:center;gap:4px;
  font-size:11.5px;font-weight:500;color:var(--t3);
  background:var(--surface);border:1px solid var(--border2);
  border-radius:7px;padding:3px 9px;
  white-space:nowrap;
}
.card-side{display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0;}
.status-badge{
  display:inline-flex;align-items:center;gap:5px;
  font-size:11px;font-weight:700;padding:5px 11px;border-radius:22px;
  background:var(--sb-bg);color:var(--sb-c);border:1px solid var(--sb-bdr);
  white-space:nowrap;
}
.sb-dot{width:6px;height:6px;border-radius:50%;background:var(--sb-c);flex-shrink:0;}
.sb-dot.blink{animation:blink 1.4s ease-in-out infinite;}
.countdown{text-align:right;}
.cd-num{font-family:'JetBrains Mono',monospace;font-size:28px;font-weight:600;line-height:1;}
.cd-lbl{font-size:9.5px;color:var(--t4);font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-top:2px;}
.cd-done{font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:700;}

/* Hours row */
.hrs-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:13px;}
.hchip{
  display:inline-flex;align-items:center;gap:4px;
  font-size:11.5px;font-weight:600;padding:4px 10px;border-radius:8px;
}
.hc-e{background:var(--ok-bg);color:var(--ok-c);border:1px solid var(--ok-bdr);}
.hc-r{background:var(--acc3);color:var(--acc);border:1px solid var(--acc4);}
.hc-a{background:var(--ab-bg);color:var(--ab-c);border:1px solid var(--ab-bdr);}
.hc-h{background:var(--hf-bg);color:var(--hf-c);border:1px solid var(--hf-bdr);}

/* Progress */
.prog-area{margin-bottom:13px;}
.prog-labels{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:7px;}
.prog-txt{font-size:11px;color:var(--t4);font-weight:500;}
.prog-pct{font-family:'JetBrains Mono',monospace;font-size:12.5px;font-weight:600;}
.prog-track{height:7px;background:var(--surface3);border-radius:99px;overflow:hidden;}
.prog-fill{height:100%;border-radius:99px;transition:width 1.1s cubic-bezier(.34,1.2,.64,1);}
.pf-ok      {background:linear-gradient(90deg,#10b981,#34d399);}
.pf-warning {background:linear-gradient(90deg,#f59e0b,#fbbf24);}
.pf-critical{background:linear-gradient(90deg,#ef4444,#f87171);animation:blink 2.5s ease-in-out infinite;}
.pf-done    {background:linear-gradient(90deg,#8b5cf6,#a78bfa);}
.prog-bot{display:flex;justify-content:space-between;margin-top:5px;font-size:10.5px;color:var(--t4);font-family:'JetBrains Mono',monospace;}

/* Card footer */
.card-foot{
  display:flex;align-items:center;justify-content:space-between;
  padding:11px 20px;border-top:1px solid var(--border2);
  background:var(--surface);gap:12px;flex-wrap:wrap;
}
.foot-date{font-size:12px;color:var(--t3);display:flex;align-items:center;gap:6px;}
.foot-date b{color:var(--t2);font-weight:600;}
.foot-tags{display:flex;gap:5px;align-items:center;}
.tag-abs{font-size:10.5px;font-weight:700;color:var(--ab-c);background:var(--ab-bg);border:1px solid var(--ab-bdr);border-radius:6px;padding:2px 8px;}
.tag-hf{font-size:10.5px;font-weight:700;color:var(--hf-c);background:var(--hf-bg);border:1px solid var(--hf-bdr);border-radius:6px;padding:2px 8px;}
.foot-actions{display:flex;gap:6px;flex-shrink:0;}

/* ── MODALS ── */
.overlay{
  position:fixed;inset:0;z-index:200;
  background:rgba(0,0,0,.4);backdrop-filter:blur(10px);
  -webkit-backdrop-filter:blur(10px);
  display:flex;align-items:center;justify-content:center;
  padding:16px;animation:fadeIn .2s ease;overflow-y:auto;
}
[data-theme="dark"] .overlay{background:rgba(0,0,0,.65);}
.modal{
  background:var(--surface);border:1px solid var(--border);
  border-radius:20px;width:100%;max-width:460px;
  box-shadow:var(--sh4);animation:scaleIn .24s ease;
  flex-shrink:0;overflow:hidden;
}
.modal-hd{
  display:flex;justify-content:space-between;align-items:center;
  padding:20px 24px 18px;border-bottom:1px solid var(--border2);
}
.modal-title{font-size:16.5px;font-weight:700;color:var(--t1);letter-spacing:-.3px;}
.modal-x{
  width:30px;height:30px;border-radius:8px;
  background:transparent;border:1px solid var(--border);
  color:var(--t4);display:flex;align-items:center;justify-content:center;
  cursor:pointer;transition:all .2s;
}
.modal-x:hover{background:var(--surface2);color:var(--t1);}

/* ── FORM ── */
.form-body{padding:24px;display:flex;flex-direction:column;gap:20px;}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.form-group{display:flex;flex-direction:column;gap:8px;}
.form-label{font-size:11px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.1em;}
.req{color:#ef4444;margin-left:2px;}
.form-input{
  background:var(--surface2);border:1.5px solid var(--border);
  border-radius:10px;padding:11px 14px;color:var(--t1);
  font-size:14px;font-family:'Outfit',sans-serif;outline:none;width:100%;
  transition:all .2s;
}
.form-input:focus{border-color:var(--acc);box-shadow:0 0 0 3px var(--acc3);background:var(--surface);}
.form-input::placeholder{color:var(--t5);font-size:13px;}
.form-hint{font-size:11.5px;color:var(--t4);line-height:1.5;}

.preview-box{
  background:var(--acc3);border:1.5px solid var(--acc4);
  border-radius:12px;padding:14px 18px;
  display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;
}
.pv-item{display:flex;flex-direction:column;gap:3px;}
.pv-val{font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:600;color:var(--acc);}
.pv-lbl{font-size:10px;font-weight:700;color:var(--t4);text-transform:uppercase;letter-spacing:.08em;}
.pv-div{width:1px;height:32px;background:var(--acc4);flex-shrink:0;}

.form-ft{
  display:flex;gap:10px;justify-content:flex-end;
  padding:16px 24px;border-top:1px solid var(--border2);
  background:var(--surface2);
}
.form-ft .btn{min-width:120px;justify-content:center;}

/* ── DELETE CONFIRM ── */
.del-modal{
  background:var(--surface);border:1px solid var(--border);
  border-radius:20px;width:100%;max-width:360px;
  box-shadow:var(--sh4);animation:scaleIn .22s ease;overflow:hidden;flex-shrink:0;
}
.del-body{display:flex;flex-direction:column;align-items:center;padding:32px 24px 20px;text-align:center;gap:12px;}
.del-icon-ring{
  width:52px;height:52px;border-radius:50%;
  background:var(--cr-bg);border:1.5px solid var(--cr-bdr);
  display:flex;align-items:center;justify-content:center;color:var(--cr-c);
}
.del-title{font-size:16px;font-weight:700;color:var(--t1);}
.del-name{font-size:13px;font-weight:600;color:var(--acc);background:var(--acc3);border:1px solid var(--acc4);border-radius:8px;padding:5px 14px;}
.del-desc{font-size:12.5px;color:var(--t3);line-height:1.7;max-width:280px;}
.del-ft{display:flex;gap:10px;padding:14px 20px;border-top:1px solid var(--border2);background:var(--surface2);}
.del-ft .btn{flex:1;justify-content:center;}

/* ── CALENDAR MODAL ── */
.cal-overlay{
  position:fixed;inset:0;z-index:300;
  background:rgba(0,0,0,.45);backdrop-filter:blur(12px);
  -webkit-backdrop-filter:blur(12px);
  display:flex;align-items:flex-start;justify-content:center;
  padding:20px 16px;animation:fadeIn .2s ease;
  overflow-y:auto;-webkit-overflow-scrolling:touch;
}
[data-theme="dark"] .cal-overlay{background:rgba(0,0,0,.7);}
.cal-box{
  background:var(--surface);border:1px solid var(--border);
  border-radius:20px;width:100%;max-width:500px;
  box-shadow:var(--sh4);animation:scaleIn .24s ease;
  overflow:hidden;flex-shrink:0;margin:auto;
}

/* Cal header */
.cal-hd{padding:20px 22px 16px;border-bottom:1px solid var(--border2);}
.cal-hdr{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:14px;}
.cal-trainee{font-size:18px;font-weight:700;color:var(--t1);letter-spacing:-.4px;margin-bottom:3px;}
.cal-range{font-size:11.5px;color:var(--t4);display:flex;align-items:center;gap:5px;}

/* Cal stats grid */
.cal-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px;}
.cstat{
  background:var(--surface2);border:1px solid var(--border2);
  border-radius:10px;padding:10px 8px;text-align:center;
  transition:transform .2s;
}
.cstat:hover{transform:scale(1.04);}
.cstat-n{font-family:'JetBrains Mono',monospace;font-size:17px;font-weight:600;line-height:1;}
.cstat-l{font-size:9px;font-weight:700;color:var(--t4);text-transform:uppercase;letter-spacing:.07em;margin-top:4px;}
.cs-earned .cstat-n{color:var(--ok-c);}
.cs-left   .cstat-n{color:var(--acc);}
.cs-abs    .cstat-n{color:var(--ab-c);}
.cs-half   .cstat-n{color:var(--hf-c);}

/* Cal progress */
.cal-progress{background:var(--surface2);border:1px solid var(--border2);border-radius:10px;padding:11px 14px;}
.cp-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:7px;}
.cp-lbl{font-size:11.5px;font-weight:600;color:var(--t3);}
.cp-val{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:500;color:var(--t2);}
.cp-track{height:7px;background:var(--surface3);border-radius:99px;overflow:hidden;}
.cp-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#10b981,#34d399);transition:width .7s ease;}
.cp-fill.done{background:linear-gradient(90deg,#8b5cf6,#a78bfa);}

/* Cal nav */
.cal-nav{display:flex;align-items:center;justify-content:space-between;padding:14px 22px 10px;}
.cal-nav-btn{
  width:34px;height:34px;border-radius:9px;
  background:var(--surface2);border:1.5px solid var(--border);
  color:var(--t2);display:flex;align-items:center;justify-content:center;
  cursor:pointer;transition:all .2s;flex-shrink:0;
  -webkit-tap-highlight-color:transparent;
}
.cal-nav-btn:hover{background:var(--surface3);color:var(--t1);border-color:var(--t5);}
.cal-nav-btn:active{transform:scale(.92);}
.cal-month{font-size:15px;font-weight:700;color:var(--t1);letter-spacing:-.3px;}

/* Hint */
.cal-hint-bar{
  display:flex;align-items:center;gap:7px;
  padding:6px 22px 10px;font-size:11px;color:var(--t4);
}
.cal-hint-bar strong{color:var(--t2);}

/* Day-of-week headers */
.cal-dows{display:grid;grid-template-columns:repeat(7,1fr);padding:0 16px;gap:3px;}
.cal-dow{text-align:center;font-size:10px;font-weight:700;letter-spacing:.04em;padding:4px 0;}
.dow-wd{color:var(--t4);text-transform:uppercase;}
.dow-we{color:var(--cr-c);opacity:.4;}

/* Grid */
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);padding:4px 16px 16px;gap:4px;}
.cal-day{
  aspect-ratio:1;display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  border-radius:10px;font-size:12px;font-weight:500;
  border:1.5px solid transparent;position:relative;
  transition:all .18s ease;user-select:none;
  -webkit-tap-highlight-color:transparent;min-width:0;cursor:default;gap:2px;
}
.cday-num{line-height:1;font-weight:600;font-size:12.5px;}
.cday-dot{width:5px;height:5px;border-radius:50%;}
.cday-hrs{font-size:8px;font-weight:700;line-height:1;opacity:.9;}
.d-empty{pointer-events:none;}
.d-out{color:var(--border);pointer-events:none;}
.d-we{color:var(--t5);background:var(--surface2);border-color:transparent;}
.d-worked{background:var(--ok-bg);color:var(--ok-c);border-color:var(--ok-bdr);}
.d-absent{background:var(--cr-bg);color:var(--cr-c);border-color:var(--cr-bdr);font-weight:700;cursor:pointer;}
.d-half{background:var(--hf-bg);color:var(--hf-c);border-color:var(--hf-bdr);font-weight:700;cursor:pointer;}
.d-today{background:var(--acc3);color:var(--acc);border-color:var(--acc4);font-weight:800;}
.d-future{background:var(--surface2);color:var(--t5);}
.d-clickable{cursor:pointer;}
.d-clickable:hover{transform:scale(1.12);box-shadow:0 4px 14px rgba(0,0,0,.12);z-index:2;}
.d-saving{opacity:.3;pointer-events:none;}

/* Legend */
.cal-legend{
  display:flex;flex-wrap:wrap;gap:6px 14px;
  padding:10px 22px 12px;border-top:1px solid var(--border2);
  background:var(--surface2);
}
.leg{display:flex;align-items:center;gap:5px;font-size:10.5px;color:var(--t3);}
.leg-sq{width:12px;height:12px;border-radius:4px;border:1.5px solid transparent;flex-shrink:0;}

/* Cal footer */
.cal-ft{
  display:flex;align-items:center;justify-content:space-between;gap:10px;
  padding:12px 22px;border-top:1px solid var(--border2);
  background:var(--surface);flex-wrap:wrap;
}
.cal-ft-info{font-size:11.5px;color:var(--t4);flex:1;min-width:0;line-height:1.5;}
.saved-txt{font-size:12px;color:var(--ok-c);font-weight:700;}
.saving-txt{font-size:12px;color:var(--t4);}

/* Half-day popup */
.half-popup{
  position:fixed;z-index:400;
  background:var(--surface);border:1.5px solid var(--border);
  border-radius:14px;padding:16px 18px;
  box-shadow:var(--sh4);min-width:220px;animation:scaleIn .2s ease;
}
.hp-h{font-size:13px;font-weight:700;color:var(--t1);margin-bottom:2px;}
.hp-s{font-size:11px;color:var(--t4);margin-bottom:2px;}
.hp-d{font-size:11.5px;color:var(--acc);font-weight:600;font-family:'JetBrains Mono',monospace;margin-bottom:12px;display:block;}
.hp-row{display:flex;gap:8px;align-items:center;}
.hp-inp{
  flex:1;background:var(--surface2);border:1.5px solid var(--border);
  border-radius:9px;padding:9px 11px;color:var(--t1);
  font-size:14px;outline:none;font-family:'JetBrains Mono',monospace;
  transition:all .2s;
}
.hp-inp:focus{border-color:var(--acc);box-shadow:0 0 0 3px var(--acc3);}
.hp-unit{font-size:12px;color:var(--t4);font-weight:600;flex-shrink:0;}
.hp-warn{font-size:10.5px;color:var(--wa-c);background:var(--wa-bg);border:1px solid var(--wa-bdr);border-radius:7px;padding:5px 9px;margin-top:8px;line-height:1.5;}
.hp-btns{display:flex;gap:7px;margin-top:12px;}
.hp-btns .btn{flex:1;justify-content:center;font-size:12.5px;padding:8px 10px;}

/* ── EMPTY ── */
.empty-state{
  text-align:center;padding:64px 24px;
  border:1.5px dashed var(--border);border-radius:16px;
  background:var(--surface);animation:fadeIn .3s ease;
}
.empty-ico{color:var(--t5);margin-bottom:16px;display:flex;justify-content:center;}
.empty-title{font-size:17px;font-weight:700;color:var(--t2);margin-bottom:8px;letter-spacing:-.3px;}
.empty-desc{font-size:13px;color:var(--t4);margin-bottom:24px;max-width:280px;margin-left:auto;margin-right:auto;line-height:1.8;}

/* ── SKELETON ── */
.skel-list{display:flex;flex-direction:column;gap:12px;padding:12px 22px 22px;}
.skel-card{background:var(--surface2);border:1px solid var(--border);border-radius:14px;padding:20px;overflow:hidden;position:relative;}
.skel-line{background:var(--surface3);border-radius:6px;position:relative;overflow:hidden;}
.skel-line::after{
  content:'';position:absolute;inset:0;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent);
  animation:shimmer 1.8s ease-in-out infinite;
}
[data-theme="dark"] .skel-line::after{background:linear-gradient(90deg,transparent,rgba(255,255,255,.05),transparent);}

/* ── RESPONSIVE ── */
@media (max-width:768px) {
  .nav-inner{padding:0 16px;height:58px;}
  .nav-tagline{display:none;}
  .clock-chip{display:none;}
  .page{padding:16px 0 80px;}
  .hero{grid-template-columns:repeat(2,1fr);gap:8px;padding:0 16px;margin-bottom:16px;}
  .stat-card{padding:14px 16px;}
  .sc-num{font-size:24px;}
  .panel{border-radius:14px;margin-bottom:16px;}
  .filter-bar{padding:10px 16px;gap:6px;}
  .toolbar{padding:10px 16px;flex-direction:column;gap:8px;}
  .sort-sel,.sort-wrap{width:100%;}
  .result-info{padding:10px 16px 0;}
  .card-list{padding:10px 16px 20px;gap:10px;}
  .card-body{padding:14px 14px 12px;}
  .card-main{flex-direction:column;gap:10px;}
  .card-side{flex-direction:row;align-items:center;justify-content:space-between;width:100%;}
  .countdown{text-align:left;}
  .cd-num{font-size:22px;}
  .card-foot{flex-direction:column;align-items:flex-start;gap:8px;padding:10px 14px;}
  .foot-actions{width:100%;display:flex;}
  .btn-sm,.btn-danger-ghost{flex:1;justify-content:center;}
  .form-row{grid-template-columns:1fr;}
  .form-body{padding:18px 18px 6px;}
  .form-ft{padding:14px 18px;}
  .modal-hd{padding:18px 18px 16px;}
  .cal-stats{grid-template-columns:repeat(2,1fr);}
  .cal-hd{padding:16px 16px 14px;}
  .cal-nav{padding:12px 16px 8px;}
  .cal-dows,.cal-grid{padding-left:10px;padding-right:10px;}
  .cal-grid{gap:3px;padding-bottom:14px;}
  .cal-legend{padding:8px 16px 10px;}
  .cal-ft{padding:10px 16px;}
  .cal-hint-bar{padding:4px 16px 8px;}
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
  .card-body{padding:20px 24px 18px;}
  .card-foot{padding:12px 24px;}
  .card-list{padding:14px 24px 26px;}
  .filter-bar,.toolbar,.result-info{padding-left:24px;padding-right:24px;}
}
`;

// ── PROGRESS BAR ──────────────────────────────────────────────
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
    <div className="skel-card" style={{ animationDelay: `${delay}s` }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div className="skel-line" style={{ width: 180, height: 14, marginBottom: 10 }} />
          <div className="skel-line" style={{ width: 260, height: 9 }} />
        </div>
        <div className="skel-line" style={{ width: 70, height: 36, borderRadius: 22 }} />
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {[80, 90, 70].map((w, i) => (
          <div key={i} className="skel-line" style={{ width: w, height: 26, borderRadius: 8 }} />
        ))}
      </div>
      <div className="skel-line" style={{ width: "100%", height: 7, borderRadius: 99, marginBottom: 6 }} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div className="skel-line" style={{ width: "28%", height: 9 }} />
        <div className="skel-line" style={{ width: "18%", height: 9 }} />
      </div>
    </div>
  );
}

// ── FILTER OPTIONS ────────────────────────────────────────────
const FILTERS = [
  { key: "all",      label: "All Trainees" },
  { key: "ok",       label: "On Track"     },
  { key: "warning",  label: "Keep Going"   },
  { key: "critical", label: "Almost There" },
  { key: "done",     label: "Graduated"    },
];

const FILTER_COLORS = {
  all:      { c: "#4f6ef7", bg: "rgba(79,110,247,.1)",  sh: "rgba(79,110,247,.2)"  },
  ok:       { c: "#10b981", bg: "rgba(16,185,129,.1)",  sh: "rgba(16,185,129,.2)"  },
  warning:  { c: "#f59e0b", bg: "rgba(245,158,11,.1)",  sh: "rgba(245,158,11,.2)"  },
  critical: { c: "#ef4444", bg: "rgba(239,68,68,.1)",   sh: "rgba(239,68,68,.2)"   },
  done:     { c: "#8b5cf6", bg: "rgba(139,92,246,.1)",  sh: "rgba(139,92,246,.2)"  },
};

// ── HERO STATS PANEL ──────────────────────────────────────────
function HeroStats({ counts }) {
  const items = [
    { key: "all",      label: "Total Trainees", color1: "#4f6ef7", color2: "#7c9ffd", icon: <Ico.Users /> },
    { key: "ok",       label: "On Track",        color1: "#10b981", color2: "#34d399", icon: <Ico.Check /> },
    { key: "critical", label: "Critical",         color1: "#ef4444", color2: "#f87171", icon: <Ico.Zap /> },
    { key: "done",     label: "Graduated",        color1: "#8b5cf6", color2: "#a78bfa", icon: <Ico.Award /> },
  ];
  return (
    <div className="hero">
      {items.map((item, i) => (
        <div key={item.key} className="stat-card"
          style={{ "--sc-c1": item.color1, animationDelay: `${i * 0.08}s` }}>
          <div className="sc-label" style={{ color: item.color1 }}>
            {item.label}
          </div>
          <div className="sc-num" style={{ color: item.color1 }}>
            {counts[item.key] || 0}
          </div>
          <div className="sc-sub">
            {item.key === "all" ? "registered" :
             item.key === "ok" ? "progressing well" :
             item.key === "critical" ? "need attention" : "completed OJT"}
          </div>
          <div className="sc-icon" style={{ color: item.color1 }}>{item.icon}</div>
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

  const prevM = () => vm === 0  ? (setVm(11), setVy(y => y - 1)) : setVm(m => m - 1);
  const nextM = () => vm === 11 ? (setVm(0),  setVy(y => y + 1)) : setVm(m => m + 1);

  const firstDow    = new Date(vy, vm, 1).getDay();
  const daysInMonth = new Date(vy, vm + 1, 0).getDate();
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
  const dotColor = { worked: "var(--ok-c)", absent: "var(--cr-c)", half: "var(--hf-c)", today: "var(--acc)", future: "var(--t5)" };
  const absCount  = Object.values(absences).filter(v => v === "full").length;
  const halfCount = Object.values(absences).filter(v => v !== "full" && v !== null && v !== undefined).length;
  const hrsPct    = totalHrs > 0 ? Math.min(100, Math.round((stats.hoursEarned / totalHrs) * 100)) : 0;
  const isDone    = stats.hoursRemaining <= 0;

  return (
    <>
      <div className="cal-overlay" onClick={() => !halfPopup && onClose()}>
        <div className="cal-box" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="cal-hd">
            <div className="cal-hdr">
              <div>
                <div className="cal-trainee">{trainee.name}</div>
                <div className="cal-range"><Ico.Cal /> {fDate(trainee.startDate)} → {fDate(stats.displayEnd)}</div>
              </div>
              <button className="modal-x" onClick={onClose}><Ico.X /></button>
            </div>

            <div className="cal-stats">
              <div className="cstat cs-earned">
                <div className="cstat-n">{stats.hoursEarned.toFixed(1)}</div>
                <div className="cstat-l">Earned hrs</div>
              </div>
              <div className="cstat cs-left">
                <div className="cstat-n">{stats.hoursRemaining.toFixed(1)}</div>
                <div className="cstat-l">Remaining</div>
              </div>
              <div className="cstat cs-abs">
                <div className="cstat-n">{absCount}</div>
                <div className="cstat-l">Absences</div>
              </div>
              <div className="cstat cs-half">
                <div className="cstat-n">{halfCount}</div>
                <div className="cstat-l">Half Days</div>
              </div>
            </div>

            <div className="cal-progress">
              <div className="cp-top">
                <span className="cp-lbl">Overall Progress</span>
                <span className="cp-val">{stats.hoursEarned.toFixed(1)} / {totalHrs} hrs · {hrsPct}%</span>
              </div>
              <div className="cp-track">
                <div className={`cp-fill${isDone ? " done" : ""}`} style={{ width: `${hrsPct}%` }} />
              </div>
            </div>
          </div>

          {/* Month navigation */}
          <div className="cal-nav">
            <button className="cal-nav-btn" onClick={prevM}><Ico.ChevL /></button>
            <span className="cal-month">{MONTHS[vm]} {vy}</span>
            <button className="cal-nav-btn" onClick={nextM}><Ico.ChevR /></button>
          </div>

          {/* Tap hint */}
          <div className="cal-hint-bar">
            <Ico.Info />
            Tap a workday: <strong>1× Absent</strong> · <strong>2× Half-day</strong> · <strong>3× Clear</strong>
          </div>

          {/* Day headers */}
          <div className="cal-dows">
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d, i) => (
              <div key={d} className={`cal-dow ${i===0||i===6 ? "dow-we" : "dow-wd"}`}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="cal-grid">
            {cells.map((cell, i) => {
              if (!cell) return <div key={`e${i}`} className="cal-day d-empty" />;
              const { d, ds, state, clickable, rec } = cell;
              const cls = ["cal-day", `d-${state}`, clickable && "d-clickable", saving && clickable && "d-saving"].filter(Boolean).join(" ");
              return (
                <div key={ds} className={cls}
                  onClick={clickable && !saving ? (e) => handleDayClick(ds, e) : undefined}
                  title={
                    state === "absent" ? "Tap → set as half-day" :
                    state === "half"   ? `${rec}h worked — tap to clear` :
                    clickable          ? "Tap to mark absent" : ""
                  }
                >
                  <span className="cday-num">{d}</span>
                  {state === "half" && rec != null && <span className="cday-hrs">{Number(rec)}h</span>}
                  {dotColor[state] && <span className="cday-dot" style={{ background: dotColor[state] }} />}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="cal-legend">
            {[
              { label: "Present",  bg: "var(--ok-bg)",  bdr: "var(--ok-bdr)"  },
              { label: "Absent",   bg: "var(--cr-bg)",  bdr: "var(--cr-bdr)"  },
              { label: "Half Day", bg: "var(--hf-bg)",  bdr: "var(--hf-bdr)"  },
              { label: "Today",    bg: "var(--acc3)",   bdr: "var(--acc4)"    },
              { label: "Upcoming", bg: "var(--surface2)",bdr: "var(--border2)" },
              { label: "Weekend",  bg: "var(--surface2)",bdr: "transparent"   },
            ].map(l => (
              <div key={l.label} className="leg">
                <div className="leg-sq" style={{ background: l.bg, borderColor: l.bdr }} />
                {l.label}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="cal-ft">
            <div className="cal-ft-info">
              {absCount === 0 && halfCount === 0
                ? "Tap any past weekday within the OJT range to record attendance."
                : `${absCount} absent · ${halfCount} half day${halfCount !== 1 ? "s" : ""} — end date auto-updated.`}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              {saved  && <span className="saved-txt">✓ Saved!</span>}
              {saving && <span className="saving-txt">Saving…</span>}
              <button className="btn btn-ghost" style={{ padding: "7px 14px", fontSize: 12.5 }} onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Half-day popup */}
      {halfPopup && (
        <div className="half-popup" style={{ top: halfPopup.y, left: halfPopup.x }} onClick={e => e.stopPropagation()}>
          <div className="hp-h">Log Half-Day Hours</div>
          <div className="hp-s">Full day = {fullDayHrs} hrs. How many hours were worked?</div>
          <span className="hp-d">{halfPopup.date}</span>
          <div className="hp-row">
            <input className="hp-inp" type="number" min="0.5" max={fullDayHrs} step="0.5"
              value={halfHrs} onChange={e => setHalfHrs(e.target.value)}
              placeholder={`0.5 – ${fullDayHrs - 0.5}`} autoFocus
              onKeyDown={e => { if (e.key === "Enter") confirmHalf(); if (e.key === "Escape") setHalfPopup(null); }}
            />
            <span className="hp-unit">hrs</span>
          </div>
          {halfHrsValid && halfHrsNum >= fullDayHrs && (
            <div className="hp-warn">⚠ Equals full day — will be counted as present.</div>
          )}
          {halfHrsValid && halfHrsNum < 1 && (
            <div className="hp-warn">⚠ Very low — full day is {fullDayHrs} hrs.</div>
          )}
          <div className="hp-btns">
            <button className="btn btn-ghost" onClick={() => setHalfPopup(null)}>Cancel</button>
            <button className="btn btn-primary" disabled={!halfHrsValid} onClick={confirmHalf}>
              <Ico.Check /> Save
            </button>
          </div>
        </div>
      )}
    </>
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
          <div className="del-icon-ring"><Ico.Trash /></div>
          <div className="del-title">Remove Trainee?</div>
          <div className="del-name">{name}</div>
          <div className="del-desc">
            This will permanently delete this trainee and all their attendance data. This action cannot be undone.
          </div>
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
    <div className="card" style={{ animationDelay: `${idx * 0.06}s` }}>
      <div className={`card-strip ${urgency}`} />
      <div className="card-body">
        <div className="card-main">
          <div className="card-info">
            <div className={`card-name${urgency === "done" ? " done" : ""}`}>{t.name}</div>
            <div className="card-meta">
              <span className="chip"><Ico.Cal />&nbsp;{fShort(t.startDate)} – {fDate(stats.displayEnd)}</span>
              <span className="chip"><Ico.Clock />&nbsp;{t.hours} hrs · {t.hoursPerDay || 8} hrs/day</span>
              <span className="chip"><Ico.Brief />&nbsp;{countWeekdays(t.startDate, stats.displayEnd)} workdays</span>
            </div>
          </div>
          <div className="card-side">
            <div className="status-badge"
              style={{ "--sb-bg": meta.bg, "--sb-c": meta.color, "--sb-bdr": meta.bdr }}>
              <span className={`sb-dot${urgency === "critical" ? " blink" : ""}`} />
              {meta.label}
            </div>
            <div className="countdown">
              {wdLeft <= 0
                ? <div className="cd-done" style={{ color: meta.color }}>✓ Done!</div>
                : <>
                    <div className="cd-num" style={{ color: meta.color }}>{wdLeft}</div>
                    <div className="cd-lbl">days left</div>
                  </>
              }
            </div>
          </div>
        </div>

        {/* Hours chips */}
        <div className="hrs-row">
          <span className="hchip hc-e"><Ico.Check />&nbsp;{hoursEarned.toFixed(1)} hrs earned</span>
          <span className="hchip hc-r"><Ico.Clock />&nbsp;{hoursRemaining.toFixed(1)} remaining</span>
          {absCount  > 0 && <span className="hchip hc-a">{absCount} absent</span>}
          {halfCount > 0 && <span className="hchip hc-h">{halfCount} half-day{halfCount > 1 ? "s" : ""}</span>}
        </div>

        {/* Progress */}
        <div className="prog-area">
          <div className="prog-labels">
            <span className="prog-txt">OJT Progress</span>
            <span className="prog-pct" style={{ color: meta.color }}>{pct}%</span>
          </div>
          <ProgressBar pct={pct} urgency={urgency} />
          <div className="prog-bot">
            <span>{daysWorked} days present</span>
            <span>{Math.max(0, daysRemaining)} workdays left</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="card-foot">
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div className="foot-date">
            Estimated end: <b>{fDate(stats.displayEnd)}</b>
          </div>
          <div className="foot-tags">
            {absCount  > 0 && <span className="tag-abs">{absCount} absent</span>}
            {halfCount > 0 && <span className="tag-hf">{halfCount} half</span>}
          </div>
        </div>
        <div className="foot-actions">
          <button className="btn btn-sm" onClick={() => onCalendar(t)}><Ico.Cal />&nbsp;Attendance</button>
          <button className="btn btn-sm" onClick={() => onEdit(t)}><Ico.Edit />&nbsp;Edit</button>
          <button className="btn btn-danger-ghost" onClick={() => onDelete(t.id, t.name)}><Ico.Trash />&nbsp;Remove</button>
        </div>
      </div>
    </div>
  );
}

// ── TRAINEE FORM ──────────────────────────────────────────────
function TraineeForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || { name: "", startDate: todayStr(), hours: "", hoursPerDay: "8" }
  );
  const set    = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isEdit = !!initial;

  const preview = useMemo(() => {
    const hrs = Number(form.hours), hpd = Number(form.hoursPerDay) || 8;
    if (!form.startDate || !hrs || hrs <= 0 || hpd <= 0) return null;
    const days    = Math.ceil(hrs / hpd);
    const endDate = addWeekdays(form.startDate, days);
    return { days, endDate };
  }, [form.startDate, form.hours, form.hoursPerDay]);

  const valid = form.name.trim() && form.startDate && Number(form.hours) > 0 && preview;

  const handleSave = () => {
    if (!valid) return;
    onSave({
      name:        form.name.trim(),
      startDate:   form.startDate,
      endDate:     preview.endDate,
      hours:       form.hours,
      hoursPerDay: form.hoursPerDay || "8",
      absences:    initial?.absences || {},
    });
  };

  return (
    <>
      <div className="form-body">
        <div className="form-group">
          <label className="form-label">Full Name <span className="req">*</span></label>
          <input className="form-input" value={form.name}
            onChange={e => set("name", e.target.value)}
            placeholder="e.g. Juan dela Cruz" autoFocus />
        </div>

        <div className="form-group">
          <label className="form-label">Start Date <span className="req">*</span></label>
          <input className="form-input" type="date" value={form.startDate}
            onChange={e => set("startDate", e.target.value)} />
          <span className="form-hint">Weekends are automatically skipped in all calculations.</span>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Required Hours <span className="req">*</span></label>
            <input className="form-input" type="number" min="1"
              value={form.hours} onChange={e => set("hours", e.target.value)}
              placeholder="e.g. 600" />
          </div>
          <div className="form-group">
            <label className="form-label">Hours Per Day</label>
            <input className="form-input" type="number" min="1" max="24"
              value={form.hoursPerDay} onChange={e => set("hoursPerDay", e.target.value)}
              placeholder="8" />
          </div>
        </div>

        {preview ? (
          <div className="preview-box">
            <div className="pv-item">
              <span className="pv-val">{preview.days}</span>
              <span className="pv-lbl">Working Days</span>
            </div>
            <div className="pv-div" />
            <div className="pv-item">
              <span className="pv-val">{fDate(preview.endDate)}</span>
              <span className="pv-lbl">Estimated End</span>
            </div>
            <div className="pv-div" />
            <div className="pv-item">
              <span className="pv-val" style={{ fontSize: 11, color: "var(--t4)" }}>Attendance</span>
              <span className="pv-lbl">log absences later</span>
            </div>
          </div>
        ) : (
          <div style={{
            fontSize: 12.5, color: "var(--t4)", padding: "16px",
            background: "var(--surface2)", borderRadius: 10,
            border: "1.5px dashed var(--border)", textAlign: "center", lineHeight: 1.8,
          }}>
            Fill in the start date &amp; required hours to preview the schedule.
          </div>
        )}
      </div>

      <div className="form-ft">
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" disabled={!valid} onClick={handleSave}>
          <Ico.Check /> {isEdit ? "Save Changes" : "Add Trainee"}
        </button>
      </div>
    </>
  );
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const fn = e => e.key === "Escape" && onClose();
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
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
      setTrainees(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAdd     = async (f) => { try { await addDoc(collection(db,"trainees"), f); setShowAdd(false); } catch(e) { console.error(e); } };
  const handleEdit    = async (f) => { try { await updateDoc(doc(db,"trainees",editing.id), f); setEditing(null); } catch(e) { console.error(e); } };
  const handleDelete  = (id, name) => setDeleting({ id, name });
  const confirmDelete = async () => { if (!deleting) return; try { await deleteDoc(doc(db,"trainees",deleting.id)); } catch(e) { console.error(e); } setDeleting(null); };

  const liveCalendar = useMemo(() => {
    if (!calendar) return null;
    return trainees.find(x => x.id === calendar.id) || calendar;
  }, [calendar, trainees]);

  const counts = useMemo(() => ({
    all:      trainees.length,
    ok:       trainees.filter(t => computeStats(t).urgency === "ok").length,
    warning:  trainees.filter(t => computeStats(t).urgency === "warning").length,
    critical: trainees.filter(t => computeStats(t).urgency === "critical").length,
    done:     trainees.filter(t => computeStats(t).urgency === "done").length,
  }), [trainees]);

  const visible = useMemo(() => trainees
    .filter(t => filter === "all" || computeStats(t).urgency === filter)
    .filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "name")   return a.name.localeCompare(b.name);
      if (sort === "pct")    return computeStats(b).pct - computeStats(a).pct;
      if (sort === "recent") return new Date(b.startDate) - new Date(a.startDate);
      return computeStats(a).wdLeft - computeStats(b).wdLeft;
    }), [trainees, filter, search, sort]);

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
            <button className="btn-icon" onClick={() => setTheme(t => t === "light" ? "dark" : "light")} title="Toggle theme">
              {theme === "light" ? <Ico.Moon /> : <Ico.Sun />}
            </button>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
              <Ico.Plus /> <span>Add Trainee</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── MAIN ── */}
      <main className="page">

        {/* Hero stats */}
        <HeroStats counts={counts} />

        {/* Main panel */}
        <div className="panel">
          {/* Panel header */}
          <div className="panel-hd">
            <div>
              <div className="panel-title">Trainee Dashboard</div>
              <div className="panel-sub">
                {trainees.length === 0
                  ? "No trainees yet — add your first one to start tracking!"
                  : `${trainees.length} trainee${trainees.length !== 1 ? "s" : ""} · ${counts.done} completed · ${counts.critical} need attention`}
              </div>
            </div>
          </div>

          {/* Filter pills */}
          <div className="filter-bar">
            {FILTERS.map(opt => {
              const fc     = FILTER_COLORS[opt.key];
              const count  = opt.key === "all" ? trainees.length : (counts[opt.key] || 0);
              const active = filter === opt.key;
              return (
                <button key={opt.key}
                  className={`fpill${active ? " act" : ""}`}
                  style={{ "--fp-c": fc.c, "--fp-bg": fc.bg, "--fp-sh": fc.sh }}
                  onClick={() => setFilter(active && opt.key !== "all" ? "all" : opt.key)}
                >
                  <span className="fpill-dot" />
                  {opt.label}
                  <span className="fpill-n">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Search + sort toolbar */}
          <div className="toolbar">
            <div className="search-wrap">
              <span className="search-ico"><Ico.Search /></span>
              <input className="search-inp"
                placeholder="Search trainee name…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="sort-wrap">
              <span className="sort-ico"><Ico.Sort /></span>
              <select className="sort-sel" value={sort} onChange={e => setSort(e.target.value)}>
                <option value="endDate">Ending Soonest</option>
                <option value="name">Name A – Z</option>
                <option value="pct">Progress %</option>
                <option value="recent">Recently Started</option>
              </select>
            </div>
          </div>

          {/* Result count */}
          {!loading && trainees.length > 0 && (
            <div className="result-info">
              <span className="ri-label">Trainees</span>
              <span className="ri-count">Showing <b>{visible.length}</b> of <b>{trainees.length}</b></span>
            </div>
          )}

          {/* List */}
          {loading ? (
            <div className="skel-list">
              {[0, 0.1, 0.2].map((d, i) => <SkeletonCard key={i} delay={d} />)}
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
                  <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
                    <Ico.Plus /> Add First Trainee
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="card-list">
              {visible.map((t, i) => (
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
      {showAdd  && <Modal title="Add New Trainee" onClose={() => setShowAdd(false)}><TraineeForm onSave={handleAdd} onCancel={() => setShowAdd(false)} /></Modal>}
      {editing  && <Modal title="Edit Trainee"    onClose={() => setEditing(null)}><TraineeForm initial={{ ...editing, hoursPerDay: editing.hoursPerDay || "8" }} onSave={handleEdit} onCancel={() => setEditing(null)} /></Modal>}
      {deleting && <DeleteModal name={deleting.name} onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />}
      {liveCalendar && <CalendarModal trainee={liveCalendar} onClose={() => setCalendar(null)} />}
    </>
  );
}