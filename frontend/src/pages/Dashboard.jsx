import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import client from "../api/client";
import KpiCard from "../components/shared/KpiCard";

const PIE_COLORS = ["#22c55e", "#3b82f6", "#f97316", "#ef4444"];

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

  if (!kpis) return <div className="p-4 text-gray-500">Loading...</div>;

  const statusCounts = ["available", "on_trip", "in_shop", "retired"].map((status) => ({
    name: status,
    value: vehicles.filter((v) => v.status === status).length,
  }));

  return (
    <div className="p-4 space-y-4">
      {expiring.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/40 text-yellow-600 dark:text-yellow-400 rounded-md px-4 py-2 text-sm">
          {expiring.length} driver(s) have a license expiring within 30 days:{" "}
          {expiring.map((d) => d.name).join(", ")}
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Active Vehicles" value={kpis.active_vehicles} accent="blue" />
        <KpiCard label="Available Vehicles" value={kpis.available_vehicles} accent="green" />
        <KpiCard label="In Maintenance" value={kpis.in_maintenance} accent="orange" />
        <KpiCard label="Active Trips" value={kpis.active_trips} accent="blue" />
        <KpiCard label="Pending Trips" value={kpis.pending_trips} accent="gray" />
        <KpiCard label="Drivers On Duty" value={kpis.drivers_on_duty} accent="green" />
        <KpiCard label="Fleet Utilization" value={`${kpis.fleet_utilization}%`} accent="orange" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border border-gray-200 dark:border-gray-800 rounded-md p-3 bg-white dark:bg-gray-900">
          <h3 className="text-sm text-gray-500 mb-2">Operational Cost per Vehicle</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={costRows}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="operational_cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="border border-gray-200 dark:border-gray-800 rounded-md p-3 bg-white dark:bg-gray-900">
          <h3 className="text-sm text-gray-500 mb-2">Vehicle Status Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusCounts} dataKey="value" nameKey="name" outerRadius={90} label>
                {statusCounts.map((entry, i) => (
                  <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
