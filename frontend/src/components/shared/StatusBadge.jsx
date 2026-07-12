const STYLES = {
  available: { color: "#22c55e", label: "Available" },
  on_trip: { color: "#3aa0ff", label: "On Trip", live: true },
  in_shop: { color: "#ff9500", label: "In Shop" },
  retired: { color: "#ff4757", label: "Retired" },
  off_duty: { color: "#8a8d92", label: "Off Duty" },
  suspended: { color: "#ff9500", label: "Suspended" },
  draft: { color: "#8a8d92", label: "Draft" },
  dispatched: { color: "#3aa0ff", label: "Dispatched", live: true },
  completed: { color: "#22c55e", label: "Completed" },
  cancelled: { color: "#ff4757", label: "Cancelled" },
  active: { color: "#ff9500", label: "Active", live: true },
  closed: { color: "#22c55e", label: "Closed" },
};

export default function StatusBadge({ status }) {
  const s = STYLES[status] || { color: "#8a8d92", label: status };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono-hq font-medium uppercase tracking-wide border"
      style={{
        color: s.color,
        borderColor: `${s.color}55`,
        background: `${s.color}14`,
      }}
    >
      <span
        className={`inline-block w-1.5 h-1.5 rounded-full ${s.live ? "hq-live-dot" : ""}`}
        style={{ background: s.color, color: s.color }}
      />
      {s.label}
    </span>
  );
}
