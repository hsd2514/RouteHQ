const ACCENTS = {
  blue: "#3aa0ff",
  green: "#22c55e",
  orange: "#ff9500",
  red: "#ff4757",
  gray: "#8a8d92",
};

export default function KpiCard({ label, value, accent = "gray" }) {
  const color = ACCENTS[accent] || ACCENTS.gray;
  return (
    <div
      className="hq-panel px-4 py-3"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div
        className="text-[10px] uppercase tracking-[0.14em] font-mono-hq"
        style={{ color: "var(--hq-text-dim)" }}
      >
        {label}
      </div>
      <div className="font-display text-3xl font-bold mt-1 font-mono-hq" style={{ color: "var(--hq-text)" }}>
        {value}
      </div>
    </div>
  );
}
