import { useState } from "react";

const labelCls = "block text-[10px] uppercase tracking-[0.12em] font-mono-hq mb-1";
const inputCls = "hq-glow w-full px-3 py-2 text-sm border outline-none font-mono-hq";
const inputStyle = { background: "var(--hq-bg)", borderColor: "var(--hq-border)", color: "var(--hq-text)" };

function SuccessToast({ message, onClose }) {
  if (!message) return null;
  return (
    <div
      id="settings-success-toast"
      className="hq-rise flex items-start gap-3 px-4 py-3 text-sm border font-mono-hq rounded text-green-600 dark:text-green-400 border-green-500/30 bg-green-500/10"
      role="alert"
    >
      <span className="mt-0.5 shrink-0">✓</span>
      <span className="flex-1 break-words">{message}</span>
      <button onClick={onClose} className="ml-2 shrink-0 hover:opacity-70" aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}

export default function Settings() {
  const [depotName, setDepotName] = useState(localStorage.getItem("settings_depotName") || "");
  const [currency, setCurrency] = useState(localStorage.getItem("settings_currency") || "INR");
  const [distanceUnit, setDistanceUnit] = useState(localStorage.getItem("settings_distanceUnit") || "Kilometers");
  const [toast, setToast] = useState("");

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem("settings_depotName", depotName);
    localStorage.setItem("settings_currency", currency);
    localStorage.setItem("settings_distanceUnit", distanceUnit);
    setToast("Settings successfully saved to local storage!");
    setTimeout(() => {
      setToast("");
    }, 4000);
  };

  const rbacData = [
    {
      roleName: "Fleet Manager",
      roleKey: "fleet_manager",
      fleet: "✓",
      drivers: "✓",
      trips: "✓",
      fuelExp: "✓",
      analytics: "view",
    },
    {
      roleName: "Dispatcher",
      roleKey: "driver",
      fleet: "view",
      drivers: "—",
      trips: "✓",
      fuelExp: "✓",
      analytics: "view",
    },
    {
      roleName: "Safety Officer",
      roleKey: "safety_officer",
      fleet: "view",
      drivers: "✓",
      trips: "view",
      fuelExp: "view",
      analytics: "view",
    },
    {
      roleName: "Financial Analyst",
      roleKey: "financial_analyst",
      fleet: "view",
      drivers: "view",
      trips: "view",
      fuelExp: "✓",
      analytics: "view",
    },
  ];

  return (
    <div className="p-5 space-y-6">
      {/* Title Bar */}
      <div>
        <h1 className="font-display font-bold text-xl uppercase tracking-wider" style={{ color: "var(--hq-text)" }}>
          Settings & RBAC
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--hq-text-dim)" }}>
          Configure depot options and view role permissions.
        </p>
      </div>

      {toast && <SuccessToast message={toast} onClose={() => setToast("")} />}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* General Settings */}
        <div className="lg:col-span-4 hq-panel p-5 space-y-4">
          <h2 className="font-display font-semibold text-sm uppercase tracking-wider" style={{ color: "var(--hq-text)" }}>
            General
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className={labelCls} style={{ color: "var(--hq-text-dim)" }}>
                Depot Name
              </label>
              <input
                type="text"
                placeholder="Enter Depot Name..."
                value={depotName}
                onChange={(e) => setDepotName(e.target.value)}
                className={inputCls}
                style={inputStyle}
              />
            </div>

            <div>
              <label className={labelCls} style={{ color: "var(--hq-text-dim)" }}>
                Currency
              </label>
              <input
                type="text"
                placeholder="e.g. INR, USD"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={inputCls}
                style={inputStyle}
              />
            </div>

            <div>
              <label className={labelCls} style={{ color: "var(--hq-text-dim)" }}>
                Distance Unit
              </label>
              <input
                type="text"
                placeholder="e.g. Kilometers, Miles"
                value={distanceUnit}
                onChange={(e) => setDistanceUnit(e.target.value)}
                className={inputCls}
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 text-sm font-display font-semibold tracking-wide transition-opacity hover:opacity-90 w-full lg:w-auto"
              style={{ background: "var(--hq-amber)", color: "#0a0b0d" }}
            >
              SAVE CHANGES
            </button>
          </form>
        </div>

        {/* RBAC Section */}
        <div className="lg:col-span-8 hq-panel p-5 space-y-4 overflow-hidden">
          <h2 className="font-display font-semibold text-sm uppercase tracking-wider" style={{ color: "var(--hq-text)" }}>
            Role-Based Access (RBAC)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="text-[10px] uppercase font-mono-hq border-b" style={{ color: "var(--hq-text-dim)", borderColor: "var(--hq-border)" }}>
                  <th className="py-2.5 px-3 font-semibold">Role</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Fleet</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Drivers</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Trips</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Fuel/Exp.</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Analytics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-solid" style={{ divideColor: "var(--hq-border)" }}>
                {rbacData.map((row) => (
                  <tr key={row.roleKey} className="hover:bg-gray-100/10 transition-colors" style={{ borderBottom: "1px solid var(--hq-border)" }}>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-gray-800 dark:text-gray-200">{row.roleName}</div>
                      <div className="text-[10px] font-mono-hq uppercase mt-0.5" style={{ color: "var(--hq-text-dim)" }}>
                        {row.roleKey}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono-hq text-sm">
                      <span className={row.fleet === "✓" ? "text-amber-500 font-bold" : "text-gray-500 opacity-60"}>
                        {row.fleet}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono-hq text-sm">
                      <span className={row.drivers === "✓" ? "text-amber-500 font-bold" : "text-gray-500 opacity-60"}>
                        {row.drivers}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono-hq text-sm">
                      <span className={row.trips === "✓" ? "text-amber-500 font-bold" : "text-gray-500 opacity-60"}>
                        {row.trips}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono-hq text-sm">
                      <span className={row.fuelExp === "✓" ? "text-amber-500 font-bold" : "text-gray-500 opacity-60"}>
                        {row.fuelExp}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono-hq text-sm">
                      <span className={row.analytics === "✓" ? "text-amber-500 font-bold" : "text-gray-500 opacity-60"}>
                        {row.analytics}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
