const COLORS = {
  available: "bg-green-500/10 text-green-500 border-green-500/40",
  on_trip: "bg-blue-500/10 text-blue-500 border-blue-500/40",
  in_shop: "bg-orange-500/10 text-orange-500 border-orange-500/40",
  retired: "bg-red-500/10 text-red-500 border-red-500/40",
  off_duty: "bg-gray-500/10 text-gray-400 border-gray-500/40",
  suspended: "bg-orange-500/10 text-orange-500 border-orange-500/40",
  draft: "bg-gray-500/10 text-gray-400 border-gray-500/40",
  dispatched: "bg-blue-500/10 text-blue-500 border-blue-500/40",
  completed: "bg-green-500/10 text-green-500 border-green-500/40",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/40",
  active: "bg-orange-500/10 text-orange-500 border-orange-500/40",
  closed: "bg-green-500/10 text-green-500 border-green-500/40",
};

function toLabel(status) {
  return status
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export default function StatusBadge({ status }) {
  const classes = COLORS[status] || "bg-gray-500/10 text-gray-400 border-gray-500/40";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-xs border ${classes}`}>
      {toLabel(status)}
    </span>
  );
}
