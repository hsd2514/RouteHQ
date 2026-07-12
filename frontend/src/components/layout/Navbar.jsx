import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
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

  // Notifications State
  const [isOpen, setIsOpen] = useState(false);
  const [expiringDrivers, setExpiringDrivers] = useState([]);
  const [activeMaintenance, setActiveMaintenance] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const [driversRes, maintenanceRes, vehiclesRes] = await Promise.allSettled([
        client.get("/drivers/expiring?days=30"),
        client.get("/maintenance"),
        client.get("/vehicles"),
      ]);

      if (driversRes.status === "fulfilled") {
        setExpiringDrivers(driversRes.value.data);
      } else {
        console.warn("Failed to fetch expiring drivers", driversRes.reason);
      }

      if (maintenanceRes.status === "fulfilled") {
        const active = maintenanceRes.value.data.filter((log) => log.status === "active");
        setActiveMaintenance(active);
      } else {
        console.warn("Failed to fetch maintenance logs", maintenanceRes.reason);
      }

      if (vehiclesRes.status === "fulfilled") {
        setVehicles(vehiclesRes.value.data);
      } else {
        console.warn("Failed to fetch vehicles list", vehiclesRes.reason);
      }

      if (driversRes.status === "rejected" && maintenanceRes.status === "rejected") {
        setError("Failed to sync updates.");
      }
    } catch {
      setError("Sync failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleOutsideClick(e) {
      if (!e.target.closest("#notification-dropdown-container")) {
        setIsOpen(false);
      }
    }

    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [isOpen]);

  const handleToggleDropdown = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      fetchNotifications();
    }
  };

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

  const totalCount = expiringDrivers.length + activeMaintenance.length;

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
        {/* Notification Bell Dropdown */}
        <div className="relative" id="notification-dropdown-container">
          <button
            onClick={handleToggleDropdown}
            className="text-[11px] font-mono-hq uppercase tracking-wide px-2.5 py-1.5 border transition-colors flex items-center justify-center relative hq-glow cursor-pointer"
            style={{ borderColor: "var(--hq-border)", color: "var(--hq-text)" }}
            title="Notifications"
          >
            <span>🔔</span>
            {totalCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white animate-pulse"
                style={{ background: "var(--hq-amber)" }}
              >
                {totalCount}
              </span>
            )}
          </button>

          {isOpen && (
            <div
              className="absolute right-0 mt-2 w-80 hq-panel p-4 z-50 shadow-lg text-xs"
              style={{ background: "var(--hq-panel)", borderColor: "var(--hq-border)" }}
            >
              <h3 className="font-display font-semibold uppercase tracking-wider text-xs border-b pb-1.5 mb-2" style={{ color: "var(--hq-text)", borderColor: "var(--hq-border)" }}>
                Notifications
              </h3>
              
              {loading && (
                <div className="text-[11px] font-mono-hq text-center py-2" style={{ color: "var(--hq-text-dim)" }}>
                  Syncing updates…
                </div>
              )}

              {error && !loading && (
                <div className="text-[11px] font-mono-hq text-red-500 py-1 text-center border border-red-500/20 bg-red-500/5 rounded">
                  {error}
                </div>
              )}

              {!loading && !error && totalCount === 0 && (
                <div className="text-center py-4 font-mono-hq uppercase tracking-wider" style={{ color: "var(--hq-text-dim)" }}>
                  All clear
                </div>
              )}

              {!loading && totalCount > 0 && (
                <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                  {/* Licenses Expiring Section */}
                  {expiringDrivers.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="font-mono-hq uppercase tracking-wider font-bold text-[10px] pb-1 border-b" style={{ color: "var(--hq-amber)", borderColor: "var(--hq-border)" }}>
                        Licenses Expiring Soon ({expiringDrivers.length})
                      </h4>
                      <ul className="space-y-1.5">
                        {expiringDrivers.map((driver) => (
                          <li key={driver.id} className="flex justify-between items-center text-[11px] font-mono-hq">
                            <span style={{ color: "var(--hq-text)" }}>{driver.name}</span>
                            <span className="text-[10px]" style={{ color: "var(--hq-text-dim)" }}>
                              EXP: {driver.license_expiry}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Vehicles In Shop Section */}
                  {activeMaintenance.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="font-mono-hq uppercase tracking-wider font-bold text-[10px] pb-1 border-b" style={{ color: "var(--hq-amber)", borderColor: "var(--hq-border)" }}>
                        Vehicles In Shop ({activeMaintenance.length})
                      </h4>
                      <ul className="space-y-2">
                        {activeMaintenance.map((log) => {
                          const vehicle = vehicles.find((v) => v.id === log.vehicle_id);
                          const vehicleLabel = vehicle ? `${vehicle.name} (${vehicle.reg_number})` : `Vehicle ID: ${log.vehicle_id}`;
                          return (
                            <li key={log.id} className="text-[11px] font-mono-hq space-y-0.5">
                              <div style={{ color: "var(--hq-text)" }} className="font-semibold">
                                {vehicleLabel}
                              </div>
                              <div className="text-[10px] leading-tight" style={{ color: "var(--hq-text-dim)" }}>
                                {log.issue_description}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => setDark((d) => !d)}
          className="text-[11px] font-mono-hq uppercase tracking-wide px-2.5 py-1 border transition-colors hq-glow cursor-pointer"
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
          className="text-[11px] font-mono-hq uppercase tracking-wide transition-colors cursor-pointer"
          style={{ color: "var(--hq-text-dim)" }}
        >
          Logout
        </button>
      </div>
    </header>
  );
}

