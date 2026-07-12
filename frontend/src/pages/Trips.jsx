import { useEffect, useMemo, useRef, useState } from "react";
import client from "../api/client";
import DataTable from "../components/shared/DataTable";
import Modal from "../components/shared/Modal";
import StatusBadge from "../components/shared/StatusBadge";
import Toast from "../components/shared/Toast";

// ── Lifecycle stepper (visual only) ──────────────────────────────────────────
const LIFECYCLE = ["draft", "dispatched", "completed", "cancelled"];
const STEP_COLORS = {
  draft: "#8a8d92",
  dispatched: "#3aa0ff",
  completed: "#22c55e",
  cancelled: "#ff4757",
};

function LifecycleBar() {
  return (
    <div className="flex items-center gap-1 mb-4 flex-wrap">
      {LIFECYCLE.map((step, i) => (
        <div key={step} className="flex items-center gap-1">
          <div className="w-2 h-2 shrink-0" style={{ background: STEP_COLORS[step] }} />
          <span className="text-[10px] font-mono-hq uppercase" style={{ color: "var(--hq-text-dim)" }}>{step}</span>
          {i < LIFECYCLE.length - 1 && <span className="mx-1" style={{ color: "var(--hq-border)" }}>→</span>}
        </div>
      ))}
    </div>
  );
}

// ── Create-trip form ──────────────────────────────────────────────────────────
const EMPTY_TRIP = {
  source: "",
  destination: "",
  vehicle_id: "",
  driver_id: "",
  cargo_weight: "",
  planned_distance: "",
};

function CreateTripForm({ vehicles, drivers, onCreated, onError }) {
  const [form, setForm] = useState(EMPTY_TRIP);
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await client.post("/trips", {
        ...form,
        vehicle_id: Number(form.vehicle_id),
        driver_id: Number(form.driver_id),
        cargo_weight: Number(form.cargo_weight),
        planned_distance: Number(form.planned_distance),
      });
      setForm(EMPTY_TRIP);
      onCreated();
    } catch (err) {
      onError(err.response?.data?.detail || "Failed to create trip.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className={labelCls}>Source</label>
        <input id="trip-source" required type="text" placeholder="e.g. Gandhinagar Depot" value={form.source} onChange={set("source")} className={inputCls} style={inputStyle} />
      </div>

      <div>
        <label className={labelCls}>Destination</label>
        <input id="trip-destination" required type="text" placeholder="e.g. Ahmedabad Hub" value={form.destination} onChange={set("destination")} className={inputCls} style={inputStyle} />
      </div>

      <div>
        <label className={labelCls}>Vehicle (available only)</label>
        <select id="trip-vehicle" required value={form.vehicle_id} onChange={set("vehicle_id")} className={inputCls} style={inputStyle}>
          <option value="">— select vehicle —</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.reg_number} — {v.name} ({v.max_load_capacity} kg capacity)
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelCls}>Driver (available only)</label>
        <select id="trip-driver" required value={form.driver_id} onChange={set("driver_id")} className={inputCls} style={inputStyle}>
          <option value="">— select driver —</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>{d.name} — {d.license_category}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Cargo Weight (kg)</label>
          <input id="trip-cargo-weight" required type="number" min="0" step="0.1" placeholder="700" value={form.cargo_weight} onChange={set("cargo_weight")} className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className={labelCls}>Planned Distance (km)</label>
          <input id="trip-planned-distance" required type="number" min="0" step="0.1" placeholder="38" value={form.planned_distance} onChange={set("planned_distance")} className={inputCls} style={inputStyle} />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          id="trip-create-btn"
          type="submit"
          disabled={submitting}
          className="flex-1 text-sm font-display font-semibold tracking-wide px-4 py-2 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "var(--hq-amber)", color: "#0a0b0d" }}
        >
          {submitting ? "Creating…" : "CREATE TRIP"}
        </button>
        <button
          type="button"
          onClick={() => setForm(EMPTY_TRIP)}
          className="text-sm px-4 py-2 border transition-colors"
          style={{ borderColor: "var(--hq-border)", color: "var(--hq-text-dim)" }}
        >
          Clear
        </button>
      </div>
    </form>
  );
}

// ── Complete-trip modal ───────────────────────────────────────────────────────
const EMPTY_COMPLETE = {
  actual_distance: "",
  fuel_consumed: "",
  final_odometer: "",
};

function CompleteModal({ trip, open, onClose, onCompleted, onError }) {
  const [form, setForm] = useState(EMPTY_COMPLETE);
  const [submitting, setSubmitting] = useState(false);

  const prevTripId = useRef(null);
  if (open && trip && trip.id !== prevTripId.current) {
    prevTripId.current = trip.id;
  }
  useEffect(() => {
    if (open) setForm(EMPTY_COMPLETE);
  }, [open, trip?.id]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await client.post(`/trips/${trip.id}/complete`, {
        actual_distance: Number(form.actual_distance),
        fuel_consumed: Number(form.fuel_consumed),
        final_odometer: Number(form.final_odometer),
      });
      onClose();
      onCompleted();
    } catch (err) {
      onError(err.response?.data?.detail || "Failed to complete trip.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Complete Trip">
      {trip && (
        <p className="text-xs font-mono-hq mb-3" style={{ color: "var(--hq-text-dim)" }}>
          {trip.source} → {trip.destination}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className={labelCls}>Actual Distance (km)</label>
          <input id="complete-actual-distance" required type="number" min="0" step="0.1" placeholder="e.g. 42" value={form.actual_distance} onChange={set("actual_distance")} className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className={labelCls}>Fuel Consumed (L)</label>
          <input id="complete-fuel-consumed" required type="number" min="0" step="0.1" placeholder="e.g. 5.2" value={form.fuel_consumed} onChange={set("fuel_consumed")} className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className={labelCls}>Final Odometer (km)</label>
          <input id="complete-final-odometer" required type="number" min="0" step="0.1" placeholder="e.g. 12542" value={form.final_odometer} onChange={set("final_odometer")} className={inputCls} style={inputStyle} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="text-sm px-4 py-1.5 border transition-colors" style={{ borderColor: "var(--hq-border)", color: "var(--hq-text-dim)" }}>
            Cancel
          </button>
          <button
            id="complete-submit-btn"
            type="submit"
            disabled={submitting}
            className="text-sm px-4 py-1.5 font-display font-semibold tracking-wide transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "#22c55e", color: "#0a0b0d" }}
          >
            {submitting ? "Saving…" : "MARK COMPLETE"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [availVehicles, setAvailVehicles] = useState([]);
  const [availDrivers, setAvailDrivers] = useState([]);
  const [allVehicles, setAllVehicles] = useState([]);
  const [allDrivers, setAllDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  const vehicleMap = useMemo(() => Object.fromEntries(allVehicles.map((v) => [v.id, v])), [allVehicles]);
  const driverMap = useMemo(() => Object.fromEntries(allDrivers.map((d) => [d.id, d])), [allDrivers]);

  const [toast, setToast] = useState("");
  function showError(msg) {
    setToast(msg);
  }

  const [completeTrip, setCompleteTrip] = useState(null);
  const [actionId, setActionId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  async function fetchAll() {
    setLoading(true);
    try {
      const [tripsRes, vehiclesRes, driversRes, allVehiclesRes, allDriversRes] = await Promise.all([
        client.get("/trips"),
        client.get("/vehicles?status=available"),
        client.get("/drivers?assignable=true"),
        client.get("/vehicles"),
        client.get("/drivers"),
      ]);
      setTrips(tripsRes.data);
      setAvailVehicles(vehiclesRes.data);
      setAvailDrivers(driversRes.data);
      setAllVehicles(allVehiclesRes.data);
      setAllDrivers(allDriversRes.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  async function dispatch(trip) {
    setActionId(trip.id);
    try {
      await client.post(`/trips/${trip.id}/dispatch`);
      await fetchAll();
    } catch (err) {
      showError(err.response?.data?.detail || "Failed to dispatch trip.");
    } finally {
      setActionId(null);
    }
  }

  async function cancel(trip) {
    setActionId(trip.id);
    try {
      await client.post(`/trips/${trip.id}/cancel`);
      await fetchAll();
    } catch (err) {
      showError(err.response?.data?.detail || "Failed to cancel trip.");
    } finally {
      setActionId(null);
    }
  }

  const filtered = trips.filter((t) => {
    const q = search.toLowerCase();
    const vehicle = vehicleMap[t.vehicle_id];
    const driver = driverMap[t.driver_id];
    const matchSearch =
      !q ||
      t.source?.toLowerCase().includes(q) ||
      t.destination?.toLowerCase().includes(q) ||
      vehicle?.reg_number?.toLowerCase().includes(q) ||
      driver?.name?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns = [
    {
      key: "route",
      header: "Route",
      render: (row) => (
        <span className="font-medium" style={{ color: "var(--hq-text)" }}>
          {row.source}
          <span className="mx-1" style={{ color: "var(--hq-text-dim)" }}>→</span>
          {row.destination}
        </span>
      ),
    },
    {
      key: "vehicle",
      header: "Vehicle",
      render: (row) => {
        const vehicle = vehicleMap[row.vehicle_id];
        return vehicle ? (
          <span style={{ color: "var(--hq-text)" }}>{vehicle.reg_number}</span>
        ) : (
          <span style={{ color: "var(--hq-text-dim)" }}>—</span>
        );
      },
    },
    {
      key: "driver",
      header: "Driver",
      render: (row) => {
        const driver = driverMap[row.driver_id];
        return driver ? (
          <span style={{ color: "var(--hq-text)" }}>{driver.name}</span>
        ) : (
          <span style={{ color: "var(--hq-text-dim)" }}>—</span>
        );
      },
    },
    {
      key: "cargo_weight",
      header: "Cargo (kg)",
      render: (row) => <span>{row.cargo_weight ?? "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "_actions",
      header: "Actions",
      render: (row) => {
        const busy = actionId === row.id;
        return (
          <div className="flex items-center gap-1.5">
            {row.status === "draft" && (
              <button
                id={`dispatch-btn-${row.id}`}
                disabled={busy}
                onClick={() => dispatch(row)}
                className="text-[11px] uppercase tracking-wide px-2.5 py-1 border font-mono-hq font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ color: "#3aa0ff", borderColor: "#3aa0ff55", background: "#3aa0ff14" }}
              >
                {busy ? "…" : "Dispatch"}
              </button>
            )}
            {row.status === "dispatched" && (
              <button
                id={`complete-btn-${row.id}`}
                disabled={busy}
                onClick={() => setCompleteTrip(row)}
                className="text-[11px] uppercase tracking-wide px-2.5 py-1 border font-mono-hq font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ color: "#22c55e", borderColor: "#22c55e55", background: "#22c55e14" }}
              >
                Complete
              </button>
            )}
            {(row.status === "draft" || row.status === "dispatched") && (
              <button
                id={`cancel-btn-${row.id}`}
                disabled={busy}
                onClick={() => cancel(row)}
                className="text-[11px] uppercase tracking-wide px-2.5 py-1 border font-mono-hq font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ color: "#ff4757", borderColor: "#ff475755", background: "#ff475714" }}
              >
                {busy ? "…" : "Cancel"}
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-5 flex gap-4 h-full min-h-0">
      {/* ── Left panel: Create Trip ── */}
      <div className="w-80 shrink-0 flex flex-col gap-4">
        <div>
          <h1 className="font-display font-bold text-xl" style={{ color: "var(--hq-text)" }}>
            Trip Dispatcher
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--hq-text-dim)" }}>
            Create and manage fleet trips.
          </p>
        </div>

        <div className="hq-panel p-4 space-y-3">
          <div>
            <p className="text-[10px] font-mono-hq uppercase tracking-[0.14em] mb-2" style={{ color: "var(--hq-text-dim)" }}>
              Trip Lifecycle
            </p>
            <LifecycleBar />
          </div>

          <p className="text-[10px] font-mono-hq uppercase tracking-[0.14em]" style={{ color: "var(--hq-text-dim)" }}>
            Create Trip
          </p>

          <CreateTripForm vehicles={availVehicles} drivers={availDrivers} onCreated={fetchAll} onError={showError} />
        </div>

        <p className="text-xs leading-relaxed font-mono-hq" style={{ color: "var(--hq-amber)" }}>
          On Complete: odometer → fuel log → expenses → Vehicle &amp; Driver Available.
        </p>
      </div>

      {/* ── Right panel: Live Board ── */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-display font-semibold uppercase tracking-wide" style={{ color: "var(--hq-text)" }}>
            Live Board
          </h2>
          <span className="text-xs font-mono-hq ml-auto" style={{ color: "var(--hq-text-dim)" }}>
            {filtered.length} trip{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {toast && <Toast message={toast} onClose={() => setToast("")} />}

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <input
            id="trip-search"
            type="text"
            placeholder="Search route, vehicle, driver…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="hq-glow flex-1 min-w-[180px] text-sm px-3 py-1.5 border outline-none font-mono-hq"
            style={{ background: "var(--hq-panel)", borderColor: "var(--hq-border)", color: "var(--hq-text)" }}
          />
          <select
            id="trip-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="hq-glow text-sm px-3 py-1.5 border outline-none font-mono-hq"
            style={{ background: "var(--hq-panel)", borderColor: "var(--hq-border)", color: "var(--hq-text)" }}
          >
            {["all", "draft", "dispatched", "completed", "cancelled"].map((s) => (
              <option key={s} value={s}>{s === "all" ? "All Statuses" : s[0].toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="hq-panel flex-1 overflow-auto">
          {loading ? (
            <div className="py-12 text-center text-sm font-mono-hq" style={{ color: "var(--hq-text-dim)" }}>
              Loading trips…
            </div>
          ) : (
            <DataTable columns={columns} rows={filtered} />
          )}
        </div>
      </div>

      <CompleteModal trip={completeTrip} open={!!completeTrip} onClose={() => setCompleteTrip(null)} onCompleted={fetchAll} onError={showError} />
    </div>
  );
}

// ── Shared style helpers ──────────────────────────────────────────────────────
const labelCls = "block text-[10px] uppercase tracking-[0.12em] font-mono-hq mb-1";
const inputCls = "hq-glow w-full text-sm px-3 py-1.5 border outline-none font-mono-hq";
const inputStyle = { background: "var(--hq-bg)", borderColor: "var(--hq-border)", color: "var(--hq-text)" };
