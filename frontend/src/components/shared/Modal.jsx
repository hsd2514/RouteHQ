export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className="hq-panel hq-rise w-full max-w-md p-5" style={{ background: "var(--hq-panel)" }}>
        <div className="flex justify-between items-center mb-4 pb-3 border-b" style={{ borderColor: "var(--hq-border)" }}>
          <h2 className="font-display font-semibold text-base tracking-wide" style={{ color: "var(--hq-text)" }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-sm hover:text-(--hq-amber) transition-colors"
            style={{ color: "var(--hq-text-dim)" }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
