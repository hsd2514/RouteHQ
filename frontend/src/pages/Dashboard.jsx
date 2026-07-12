import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import client from "../api/client";
import KpiCard from "../components/shared/KpiCard";

const PIE_COLORS = ["#22c55e", "#3aa0ff", "#ff9500", "#ff4757"];

const panelTitleCls = "text-[10px] uppercase tracking-[0.14em] font-mono-hq mb-3";
const selectCls = "hq-glow text-sm px-3 py-1.5 border outline-none font-mono-hq";
const selectStyle = { background: "var(--hq-panel)", borderColor: "var(--hq-border)", color: "var(--hq-text)" };
const filterLabelCls = "block text-[10px] uppercase tracking-[0.12em] font-mono-hq mb-1";

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [costRows, setCostRows] = useState([]);
  const [expiring, setExpiring] = useState([]);

  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [regionFilter, setRegionFilter] = useState("All");

  useEffect(() => {
    client.get("/dashboard/kpis").then((r) => setKpis(r.data));
    client.get("/vehicles").then((r) => setVehicles(r.data));
    client.get("/reports/vehicle-costs").then((r) => setCostRows(r.data));
    client.get("/drivers/expiring?days=30").then((r) => setExpiring(r.data));
  }, []);

  const vehicleTypes = useMemo(() => [...new Set(vehicles.map((v) => v.type))], [vehicles]);
  const regions = useMemo(() => [...new Set(vehicles.map((v) => v.region).filter(Boolean))], [vehicles]);

  const filtersActive = typeFilter !== "All" || statusFilter !== "All" || regionFilter !== "All";

  const filteredVehicles = useMemo(
    () =>
      vehicles.filter(
        (v) =>
          (typeFilter === "All" || v.type === typeFilter) &&
          (statusFilter === "All" || v.status === statusFilter) &&
          (regionFilter === "All" || v.region === regionFilter)
      ),
    [vehicles, typeFilter, statusFilter, regionFilter]
  );

  const filteredVehicleIds = useMemo(() => new Set(filteredVehicles.map((v) => v.id)), [filteredVehicles]);
  const filteredCostRows = costRows.filter((r) => filteredVehicleIds.has(r.vehicle_id));

  if (!kpis)
    return (
      <div className="p-6 font-mono-hq text-xs uppercase tracking-widest" style={{ color: "var(--hq-text-dim)" }}>
        Loading telemetry…
      </div>
    );

  const statusCounts = ["available", "on_trip", "in_shop", "retired"].map((status) => ({
    name: status,
    value: filteredVehicles.filter((v) => v.status === status).length,
  }));

  // When a filter is active, vehicle-derived KPIs are recomputed client-side
  // from the filtered set (the backend's /dashboard/kpis has no filter params).
  // Trip/driver KPIs stay global -- they aren't meaningfully scoped by vehicle attributes.
  const activeVehicleCount = filtersActive
    ? filteredVehicles.filter((v) => v.status !== "retired").length
    : kpis.active_vehicles;
  const availableVehicleCount = filtersActive
    ? filteredVehicles.filter((v) => v.status === "available").length
    : kpis.available_vehicles;
  const inMaintenanceCount = filtersActive
    ? filteredVehicles.filter((v) => v.status === "in_shop").length
    : kpis.in_maintenance;
  const onTripCount = filtersActive ? filteredVehicles.filter((v) => v.status === "on_trip").length : null;
  const fleetUtilization = filtersActive
    ? activeVehicleCount > 0
      ? Math.round((onTripCount / activeVehicleCount) * 1000) / 10
      : 0
    : kpis.fleet_utilization;

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

      {/* Filters */}
      <div className="hq-panel flex flex-wrap items-end gap-4 p-3">
        <div>
          <label className={filterLabelCls} style={{ color: "var(--hq-text-dim)" }}>Vehicle Type</label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectCls} style={selectStyle}>
            <option value="All">All Types</option>
            {vehicleTypes.map((t) => (
              <option key={t} value={t} className="capitalize">{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={filterLabelCls} style={{ color: "var(--hq-text-dim)" }}>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectCls} style={selectStyle}>
            <option value="All">All Statuses</option>
            <option value="available">Available</option>
            <option value="on_trip">On Trip</option>
            <option value="in_shop">In Shop</option>
            <option value="retired">Retired</option>
          </select>
        </div>
        <div>
          <label className={filterLabelCls} style={{ color: "var(--hq-text-dim)" }}>Region</label>
          <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} className={selectCls} style={selectStyle}>
            <option value="All">All Regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        {filtersActive && (
          <button
            onClick={() => {
              setTypeFilter("All");
              setStatusFilter("All");
              setRegionFilter("All");
            }}
            className="text-[11px] font-mono-hq uppercase tracking-wide px-3 py-1.5 border transition-colors"
            style={{ borderColor: "var(--hq-border)", color: "var(--hq-text-dim)" }}
          >
            Clear Filters
          </button>
        )}
        <span className="text-xs font-mono-hq ml-auto" style={{ color: "var(--hq-text-dim)" }}>
          {filteredVehicles.length} vehicle{filteredVehicles.length !== 1 ? "s" : ""} matched
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Active Vehicles", value: activeVehicleCount, accent: "blue" },
          { label: "Available Vehicles", value: availableVehicleCount, accent: "green" },
          { label: "In Maintenance", value: inMaintenanceCount, accent: "orange" },
          { label: "Active Trips", value: kpis.active_trips, accent: "blue" },
          { label: "Pending Trips", value: kpis.pending_trips, accent: "gray" },
          { label: "Drivers On Duty", value: kpis.drivers_on_duty, accent: "green" },
          { label: "Fleet Utilization", value: `${fleetUtilization}%`, accent: "orange" },
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
            <BarChart data={filteredCostRows}>
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
