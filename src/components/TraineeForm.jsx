// ============================================================
// src/components/TraineeForm.jsx
// Add / Edit trainee form used inside Modal
// ============================================================

import { useState } from "react";
import { todayStr } from "../utils/dateHelper";
import "../styles/TraineeForm.css";

const BLANK = { name: "", startDate: "", endDate: "", hours: "" };

export default function TraineeForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || { ...BLANK, startDate: todayStr() }
  );

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const isValid =
    form.name.trim() && form.startDate && form.endDate && form.hours;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid) onSave(form);
  };

  return (
    <form className="form" onSubmit={handleSubmit}>

      {/* Name */}
      <div className="form__group">
        <label className="form__label">Full Name</label>
        <input
          className="form__input"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Juan dela Cruz"
          required
        />
      </div>

      {/* Start & End Date */}
      <div className="form__row">
        <div className="form__group">
          <label className="form__label">Start Date</label>
          <input
            className="form__input"
            type="date"
            value={form.startDate}
            onChange={(e) => set("startDate", e.target.value)}
            required
          />
        </div>
        <div className="form__group">
          <label className="form__label">End Date</label>
          <input
            className="form__input"
            type="date"
            value={form.endDate}
            onChange={(e) => set("endDate", e.target.value)}
            required
          />
        </div>
      </div>

      {/* Required Hours */}
      <div className="form__group">
        <label className="form__label">Required Hours</label>
        <input
          className="form__input"
          type="number"
          min="1"
          value={form.hours}
          onChange={(e) => set("hours", e.target.value)}
          placeholder="e.g. 300"
          required
        />
      </div>

      {/* Actions */}
      <div className="form__actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={!isValid}
        >
          {initial ? "Save Changes" : "Add Trainee"}
        </button>
      </div>

    </form>
  );
}