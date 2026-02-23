// ============================================================
// src/components/TraineeCard.jsx
// Single trainee row with bar, countdown, and actions
// ============================================================

import {
  getDaysLeft,
  getDaysDone,
  getDaysTotal,
  getPct,
  getUrgency,
  formatDate,
  URGENCY_META,
} from "../utils/dateHelper";
import CountdownBar from "./CountdownBar";
import "../styles/TraineeCard.css";

export default function TraineeCard({ trainee, onEdit, onDelete, index }) {
  const { name, startDate, endDate, hours } = trainee;

  const urgency = getUrgency(startDate, endDate);
  const pct     = getPct(startDate, endDate);
  const left    = getDaysLeft(endDate);
  const done    = getDaysDone(startDate);
  const total   = getDaysTotal(startDate, endDate);
  const meta    = URGENCY_META[urgency];

  return (
    <div
      className={`card card--${urgency}`}
      style={{ animationDelay: `${index * 0.07}s` }}
    >
      {/* ── TOP ROW ── */}
      <div className="card__top">
        <div className="card__left">
          <div className="card__name">{name}</div>
          <div className="card__meta">
            <span>📅 {formatDate(startDate)} → {formatDate(endDate)}</span>
            <span>⏱ {hours} hrs required</span>
          </div>
        </div>

        <div className="card__right">
          <div className={`card__badge card__badge--${urgency}`}>
            {meta.label}
          </div>
          <div className="card__days">
            {left <= 0 ? (
              <span
                className="card__days-num card__days-num--done"
                style={{ color: meta.color }}
              >
                Done ✓
              </span>
            ) : (
              <>
                <span
                  className="card__days-num"
                  style={{ color: meta.color }}
                >
                  {left}
                </span>
                <span className="card__days-label">days left</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── PROGRESS BAR ── */}
      <CountdownBar pct={pct} urgency={urgency} />

      {/* ── BAR LABELS ── */}
      <div className="bar-labels">
        <span>{done} of {total} days elapsed</span>
        <span
          className="bar-labels__pct"
          style={{ color: meta.color }}
        >
          {pct}%
        </span>
      </div>

      {/* ── ACTIONS ── */}
      <div className="card__actions">
        <button
          className="card__btn-edit"
          onClick={() => onEdit(trainee)}
        >
          ✎ Edit
        </button>
        <button
          className="card__btn-delete"
          onClick={() => onDelete(trainee.id)}
        >
          ✕ Remove
        </button>
      </div>
    </div>
  );
}