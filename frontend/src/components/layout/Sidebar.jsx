import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", glyph: "◧" },
  { to: "/vehicles", label: "Fleet", glyph: "▣" },
  { to: "/drivers", label: "Drivers", glyph: "◈" },
  { to: "/trips", label: "Trips", glyph: "➤" },
  { to: "/maintenance", label: "Maintenance", glyph: "⚙" },
  { to: "/fuel-expenses", label: "Fuel & Expenses", glyph: "⛽" },
  { to: "/reports", label: "Analytics", glyph: "◭" },
];

export default function Sidebar() {
  return (
    <aside
      className="w-60 shrink-0 flex flex-col"
      style={{ background: "var(--hq-panel)", borderRight: "1px solid var(--hq-border)" }}
    >
      <div className="px-5 py-5" style={{ borderBottom: "1px solid var(--hq-border)" }}>
        <div className="flex items-center gap-2">
          <span
            className="w-7 h-7 flex items-center justify-center font-display font-bold text-sm"
            style={{ background: "var(--hq-amber)", color: "#0a0b0d" }}
          >
            T
          </span>
          <span className="font-display font-bold text-lg tracking-wide" style={{ color: "var(--hq-text)" }}>
            TransitOps
          </span>
        </div>
        <p className="text-[10px] font-mono-hq uppercase tracking-[0.16em] mt-1.5" style={{ color: "var(--hq-text-dim)" }}>
          Fleet Command
        </p>
      </div>

      <nav className="flex-1 py-3 px-3 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors border-l-2 ${
                isActive ? "" : "border-transparent"
              }`
            }
            style={({ isActive }) => ({
              color: isActive ? "var(--hq-amber)" : "var(--hq-text-dim)",
              background: isActive ? "color-mix(in srgb, var(--hq-amber) 10%, transparent)" : "transparent",
              borderLeftColor: isActive ? "var(--hq-amber)" : "transparent",
            })}
          >
            <span className="text-xs w-4 text-center opacity-80">{item.glyph}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-3 text-[10px] font-mono-hq" style={{ color: "var(--hq-text-dim)", borderTop: "1px solid var(--hq-border)" }}>
        TRANSITOPS © 2026 · RBAC ENABLED
      </div>
    </aside>
  );
}
