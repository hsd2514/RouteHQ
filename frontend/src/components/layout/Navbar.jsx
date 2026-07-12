import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ROLE_LABELS = {
  fleet_manager: "Fleet Manager",
  driver: "Dispatcher",
  safety_officer: "Safety Officer",
  financial_analyst: "Financial Analyst",
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(localStorage.getItem("theme") !== "light");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const initials = (user?.name || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header
      className="h-14 flex items-center justify-between px-5"
      style={{ background: "var(--hq-panel)", borderBottom: "1px solid var(--hq-border)" }}
    >
      <div className="hq-glow flex items-center">
        <input
          type="text"
          placeholder="SEARCH…"
          className="w-64 px-3 py-1.5 text-xs font-mono-hq uppercase tracking-wide border outline-none"
          style={{
            background: "var(--hq-bg)",
            borderColor: "var(--hq-border)",
            color: "var(--hq-text)",
          }}
        />
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={() => setDark((d) => !d)}
          className="text-[11px] font-mono-hq uppercase tracking-wide px-2.5 py-1 border transition-colors"
          style={{ borderColor: "var(--hq-border)", color: "var(--hq-text-dim)" }}
        >
          {dark ? "☾ Dark" : "☀ Light"}
        </button>
        <span className="text-sm font-medium" style={{ color: "var(--hq-text)" }}>
          {user?.name}
        </span>
        <span
          className="flex items-center gap-2 pl-1 pr-2.5 py-1 text-[11px] font-mono-hq uppercase tracking-wide border"
          style={{ borderColor: "var(--hq-border)", color: "var(--hq-amber)" }}
        >
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{ background: "var(--hq-amber)", color: "#0a0b0d" }}
          >
            {initials}
          </span>
          {ROLE_LABELS[user?.role] || user?.role}
        </span>
        <button
          onClick={handleLogout}
          className="text-[11px] font-mono-hq uppercase tracking-wide transition-colors"
          style={{ color: "var(--hq-text-dim)" }}
        >
          Logout
        </button>
      </div>
    </header>
  );
}
