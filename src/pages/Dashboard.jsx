// ============================================================
// src/pages/Dashboard.jsx
// Main page — filter chips, search, trainee list
// ============================================================

import { useState } from "react";
import TraineeCard from "../components/TraineeCard";
import { getUrgency, getDaysLeft, URGENCY_META } from "../utils/dateHelper";
import "../styles/Dashboard.css";

const FILTERS = [
  { key: "all",      label: "All",      color: "#64748b", bg: "rgba(100,116,139,0.08)" },
  { key: "ok",       label: "On Track",  color: URGENCY_META.ok.color,       bg: URGENCY_META.ok.bg       },
  { key: "warning",  label: "Warning",   color: URGENCY_META.warning.color,  bg: URGENCY_META.warning.bg  },
  { key: "critical", label: "Critical",  color: URGENCY_META.critical.color, bg: URGENCY_META.critical.bg },
  { key: "done",     label: "Done",      color: URGENCY_META.done.color,     bg: URGENCY_META.done.bg     },
];

export default function Dashboard({ trainees, loading, onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  // Count per urgency
  const counts = FILTERS.reduce((acc, { key }) => {
    acc[key] =
      key === "all"
        ? trainees.length
        : trainees.filter(
            (t) => getUrgency(t.startDate, t.endDate) === key
          ).length;
    return acc;
  }, {});

  // Filter + search + sort by days left ascending
  const visible = trainees
    .filter((t) =>
      t.name.toLowerCase().includes(search.toLowerCase())
    )
    .filter((t) =>
      filter === "all" || getUrgency(t.startDate, t.endDate) === filter
    )
    .sort((a, b) => getDaysLeft(a.endDate) - getDaysLeft(b.endDate));

  return (
    <div className="dashboard">

      {/* ── FILTER CHIPS ── */}
      <div className="chips">
        {FILTERS.map(({ key, label, color, bg }) => (
          <button
            key={key}
            className={`chip ${filter === key ? "chip--active" : ""}`}
            style={{
              "--chip-color": color,
              "--chip-bg":    bg,
            }}
            onClick={() => setFilter(key)}
          >
            <span className="chip__num" style={{ color }}>{counts[key]}</span>
            <span className="chip__label">{label}</span>
          </button>
        ))}
      </div>

      {/* ── SEARCH ── */}
      <div className="search-wrap">
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          placeholder="Search trainee name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── TRAINEE LIST ── */}
      {loading ? (
        <div className="empty">Loading trainees...</div>
      ) : visible.length === 0 ? (
        <div className="empty">
          {trainees.length === 0 ? (
            <>
              <span className="empty__accent">No trainees yet.</span>
              <br />
              Click &ldquo;+ Add Trainee&rdquo; to get started.
            </>
          ) : (
            "No trainees match your search or filter."
          )}
        </div>
      ) : (
        <div className="trainee-list">
          {visible.map((t, i) => (
            <TraineeCard
              key={t.id}
              trainee={t}
              index={i}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

    </div>
  );
}