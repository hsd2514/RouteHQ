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
  const [dark, setDark] = useState(localStorage.getItem("theme") === "dark");

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
    <header className="h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <input
        type="text"
        placeholder="Search..."
        className="w-64 px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-transparent text-gray-700 dark:text-gray-300"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={() => setDark((d) => !d)}
          className="text-sm px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300"
        >
          {dark ? "Light" : "Dark"}
        </button>
        <span className="text-sm text-gray-700 dark:text-gray-300">{user?.name}</span>
        <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/40">
          {ROLE_LABELS[user?.role] || user?.role}
        </span>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-red-500"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
