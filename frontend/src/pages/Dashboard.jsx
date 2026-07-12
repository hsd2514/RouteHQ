import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import client from "../api/client";
import KpiCard from "../components/shared/KpiCard";

const PIE_COLORS = ["#22c55e", "#3aa0ff", "#ff9500", "#ff4757"];

const panelTitleCls = "text-[10px] uppercase tracking-[0.14em] font-mono-hq mb-3";

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [costRows, setCostRows] = useState([]);
  const [expiring, setExpiring] = useState([]);

  useEffect(() => {
    client.get("/dashboard/kpis").then((r) => setKpis(r.data));
    client.get("/vehicles").then((r) => setVehicles(r.data));
    client.get("/reports/vehicle-costs").then((r) => setCostRows(r.data));
    client.get("/drivers/expiring?days=30").then((r) => setExpiring(r.data));
  }, []);

  if (!kpis)
    return (
      <div className="p-6 font-mono-hq text-xs uppercase tracking-widest" style={{ color: "var(--hq-text-dim)" }}>
        Loading telemetry…
      </div>
    );

  const statusCounts = ["available", "on_trip", "in_shop", "retired"].map((status) => ({
    name: status,
    value: vehicles.filter((v) => v.status === status).length,
  }));

  return (
    <div className="p-5 space-y-4">
      {expiring.length > 0 && (
        <div
          className="hq-panel hq-rise px-4 py-2.5 text-sm flex items-start gap-2"
          style={{ borderLeft: "3px solid #ff9500", color: "var(--hq-text)" }}
        >
          <span style={{ color: "#ff9500" }}>⚠</span>
          <span>
            <strong className="font-mono-hq" style={{ color: "#ff9500" }}>
              {expiring.length} driver{expiring.length !== 1 ? "s" : ""}
            </strong>{" "}
            have a license expiring within 30 days: {expiring.map((d) => d.name).join(", ")}
          </span>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Active Vehicles", value: kpis.active_vehicles, accent: "blue" },
          { label: "Available Vehicles", value: kpis.available_vehicles, accent: "green" },
          { label: "In Maintenance", value: kpis.in_maintenance, accent: "orange" },
          { label: "Active Trips", value: kpis.active_trips, accent: "blue" },
          { label: "Pending Trips", value: kpis.pending_trips, accent: "gray" },
          { label: "Drivers On Duty", value: kpis.drivers_on_duty, accent: "green" },
          { label: "Fleet Utilization", value: `${kpis.fleet_utilization}%`, accent: "orange" },
        ].map((kpi, i) => (
          <div key={kpi.label} className="hq-rise" style={{ animationDelay: `${i * 45}ms` }}>
            <KpiCard {...kpi} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="hq-panel p-4">
          <h3 className={panelTitleCls} style={{ color: "var(--hq-text-dim)" }}>
            Operational Cost / Vehicle
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={costRows}>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--hq-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "IBM Plex Mono", fill: "var(--hq-text-dim)" }} />
              <YAxis tick={{ fontSize: 11, fontFamily: "IBM Plex Mono", fill: "var(--hq-text-dim)" }} />
              <Tooltip
                contentStyle={{ background: "var(--hq-panel)", border: "1px solid var(--hq-border)", fontFamily: "IBM Plex Mono", fontSize: 12 }}
              />
              <Bar dataKey="operational_cost" fill="var(--hq-amber)" radius={[0, 0, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="hq-panel p-4">
          <h3 className={panelTitleCls} style={{ color: "var(--hq-text-dim)" }}>
            Vehicle Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusCounts} dataKey="value" nameKey="name" outerRadius={90} label>
                {statusCounts.map((entry, i) => (
                  <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="var(--hq-panel)" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "var(--hq-panel)", border: "1px solid var(--hq-border)", fontFamily: "IBM Plex Mono", fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
