// ============================================================
// src/utils/dateHelpers.js
// All date calculation logic used across the app
// ============================================================

const MS_DAY = 1000 * 60 * 60 * 24;

/** Total days between start and end date */
export function getDaysTotal(startDate, endDate) {
  return Math.max(1, Math.round((new Date(endDate) - new Date(startDate)) / MS_DAY));
}

/** Days remaining from today until end date (can be negative if past) */
export function getDaysLeft(endDate) {
  return Math.ceil((new Date(endDate) - new Date()) / MS_DAY);
}

/** Days elapsed from start date until today */
export function getDaysDone(startDate) {
  return Math.max(0, Math.floor((new Date() - new Date(startDate)) / MS_DAY));
}

/** Percentage of OJT completed (0–100) */
export function getPct(startDate, endDate) {
  const total = getDaysTotal(startDate, endDate);
  const done  = getDaysDone(startDate);
  return Math.min(100, Math.max(0, Math.round((done / total) * 100)));
}

/**
 * Urgency level based on progress and days remaining
 * Returns: "ok" | "warning" | "critical" | "done"
 */
export function getUrgency(startDate, endDate) {
  const left = getDaysLeft(endDate);
  const pct  = getPct(startDate, endDate);
  if (left <= 0)               return "done";
  if (pct >= 85 || left <= 7)  return "critical";
  if (pct >= 60 || left <= 21) return "warning";
  return "ok";
}

/** Format a date string to readable form e.g. "Mar 5, 2025" */
export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-PH", {
    month: "short",
    day:   "numeric",
    year:  "numeric",
  });
}

/** Get today's date as a YYYY-MM-DD string (for date input default) */
export function todayStr() {
  return new Date().toISOString().split("T")[0];
}

/** Urgency display metadata: label, color, glow, background */
export const URGENCY_META = {
  ok: {
    label: "On Track",
    color: "#4ade80",
    glow:  "rgba(74, 222, 128, 0.25)",
    bg:    "rgba(74, 222, 128, 0.07)",
  },
  warning: {
    label: "Warning",
    color: "#fbbf24",
    glow:  "rgba(251, 191, 36, 0.25)",
    bg:    "rgba(251, 191, 36, 0.07)",
  },
  critical: {
    label: "Critical",
    color: "#f87171",
    glow:  "rgba(248, 113, 113, 0.30)",
    bg:    "rgba(248, 113, 113, 0.07)",
  },
  done: {
    label: "Completed",
    color: "#a78bfa",
    glow:  "rgba(167, 139, 250, 0.20)",
    bg:    "rgba(167, 139, 250, 0.07)",
  },
};