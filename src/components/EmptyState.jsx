import { Icon } from "./Icons.jsx";

export function SkeletonList() {
  return (
    <div className="skel-wrap">
      {[75, 55, 65].map((w, i) => (
        <div key={i} className="skel-card">
          <div className="skel-line" style={{ width: `${w}%`, height: 14, marginBottom: 14 }} />
          <div className="skel-line" style={{ width: "40%", height: 10, marginBottom: 20 }} />
          <div className="skel-line" style={{ width: "100%", height: 7, borderRadius: 99, marginBottom: 8 }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div className="skel-line" style={{ width: "28%", height: 10, marginBottom: 0 }} />
            <div className="skel-line" style={{ width: "18%", height: 10, marginBottom: 0 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ hasTrainees, onAdd }) {
  return (
    <div className="empty">
      <div className="empty-ico"><Icon.Clipboard /></div>
      <div className="empty-title">
        {hasTrainees ? "No results found" : "No trainees yet"}
      </div>
      <div className="empty-desc">
        {hasTrainees
          ? "Try adjusting your search or clearing the active filter."
          : "Add your first OJT trainee to start tracking their journey!"}
      </div>
      {!hasTrainees && (
        <button className="btn btn-primary" onClick={onAdd}>
          <Icon.Plus /> Add First Trainee
        </button>
      )}
    </div>
  );
}