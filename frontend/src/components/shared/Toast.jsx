const VARIANTS = {
  error: { color: "#ff4757", icon: "⚠" },
  success: { color: "#22c55e", icon: "✓" },
};

export default function Toast({ message, onClose, variant = "error" }) {
  if (!message) return null;
  const v = VARIANTS[variant] || VARIANTS.error;

  return (
    <div
      className="hq-rise flex items-start gap-3 px-4 py-3 text-sm border font-mono-hq"
      style={{ color: v.color, borderColor: `${v.color}55`, background: `${v.color}14` }}
      role="alert"
    >
      <span className="mt-0.5 shrink-0">{v.icon}</span>
      <span className="flex-1 wrap-break-word">{message}</span>
      <button onClick={onClose} className="ml-2 shrink-0 hover:opacity-70" aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}
