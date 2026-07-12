import { useEffect, useMemo, useRef, useState } from "react";
import client from "../api/client";
import DataTable from "../components/shared/DataTable";
import Modal from "../components/shared/Modal";
import StatusBadge from "../components/shared/StatusBadge";

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div
      id="trip-error-toast"
      className="flex items-start gap-3 bg-red-500/10 border border-red-500/40 text-red-500 rounded-md px-4 py-3 text-sm"
      role="alert"
    >
      <span className="mt-0.5 shrink-0">⚠</span>
      <span className="flex-1 break-words">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 shrink-0 text-red-400 hover:text-red-600"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

// ── Lifecycle stepper (visual only) ──────────────────────────────────────────
const LIFECYCLE = ["draft", "dispatched", "completed", "cancelled"];
const STEP_COLORS = {
  draft: "bg-green-500",
  dispatched: "bg-blue-500",
  completed: "bg-gray-400",
  cancelled: "bg-red-400",
};

function LifecycleBar() {
  return (
    <div className="flex items-center gap-1 mb-4">
      {LIFECYCLE.map((step, i) => (
        <div key={step} className="flex items-center gap-1">
          <div
            className={`w-3 h-3 rounded-full ${STEP_COLORS[step]} shrink-0`}
          />
          <span className="text-xs text-gray-500 capitalize">{step}</span>
          {i < LIFECYCLE.length - 1 && (
            <span className="text-gray-600 mx-1">→</span>
          )}
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

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

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
        <input
          id="trip-source"
          required
          type="text"
          placeholder="e.g. Gandhinagar Depot"
          value={form.source}
          onChange={set("source")}
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Destination</label>
        <input
          id="trip-destination"
          required
          type="text"
          placeholder="e.g. Ahmedabad Hub"
          value={form.destination}
          onChange={set("destination")}
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Vehicle (available only)</label>
        <select
          id="trip-vehicle"
          required
          value={form.vehicle_id}
          onChange={set("vehicle_id")}
          className={inputCls}
        >
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
        <select
          id="trip-driver"
          required
          value={form.driver_id}
          onChange={set("driver_id")}
          className={inputCls}
        >
          <option value="">— select driver —</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} — {d.license_category}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Cargo Weight (kg)</label>
          <input
            id="trip-cargo-weight"
            required
            type="number"
            min="0"
            step="0.1"
            placeholder="700"
            value={form.cargo_weight}
            onChange={set("cargo_weight")}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Planned Distance (km)</label>
          <input
            id="trip-planned-distance"
            required
            type="number"
            min="0"
            step="0.1"
            placeholder="38"
            value={form.planned_distance}
            onChange={set("planned_distance")}
            className={inputCls}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          id="trip-create-btn"
          type="submit"
          disabled={submitting}
          className="flex-1 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded-md transition-colors"
        >
          {submitting ? "Creating…" : "Create Trip"}
        </button>
        <button
          type="button"
          onClick={() => setForm(EMPTY_TRIP)}
          className="text-sm px-4 py-2 rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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

  // Reset when modal opens for a new trip
  const prevTripId = useRef(null);
  if (open && trip && trip.id !== prevTripId.current) {
    prevTripId.current = trip.id;
    // don't call setState during render — use effect below
  }
  useEffect(() => {
    if (open) setForm(EMPTY_COMPLETE);
  }, [open, trip?.id]);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

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
        <p className="text-xs text-gray-500 mb-3">
          {trip.source} → {trip.destination}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className={labelCls}>Actual Distance (km)</label>
          <input
            id="complete-actual-distance"
            required
            type="number"
            min="0"
            step="0.1"
            placeholder="e.g. 42"
            value={form.actual_distance}
            onChange={set("actual_distance")}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Fuel Consumed (L)</label>
          <input
            id="complete-fuel-consumed"
            required
            type="number"
            min="0"
            step="0.1"
            placeholder="e.g. 5.2"
            value={form.fuel_consumed}
            onChange={set("fuel_consumed")}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Final Odometer (km)</label>
          <input
            id="complete-final-odometer"
            required
            type="number"
            min="0"
            step="0.1"
            placeholder="e.g. 12542"
            value={form.final_odometer}
            onChange={set("final_odometer")}
            className={inputCls}
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="text-sm px-4 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            id="complete-submit-btn"
            type="submit"
            disabled={submitting}
            className="text-sm px-4 py-1.5 rounded-md bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
          >
            {submitting ? "Saving…" : "Mark Complete"}
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
  const [loading, setLoading] = useState(true);

  // ── Lookup maps: id → object (rebuilt only when source arrays change) ───
  const vehicleMap = useMemo(
    () => Object.fromEntries(availVehicles.map((v) => [v.id, v])),
    [availVehicles]
  );
  const driverMap = useMemo(
    () => Object.fromEntries(availDrivers.map((d) => [d.id, d])),
    [availDrivers]
  );

  // Toast error
  const [toast, setToast] = useState("");
  function showError(msg) {
    setToast(msg);
  }

  // Complete modal
  const [completeTrip, setCompleteTrip] = useState(null);

  // Per-row action loading
  const [actionId, setActionId] = useState(null);

  // Search / status filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // ── Fetch all data ──────────────────────────────────────────────────────
  async function fetchAll() {
    setLoading(true);
    try {
      const [tripsRes, vehiclesRes, driversRes] = await Promise.all([
        client.get("/trips"),
        client.get("/vehicles?status=available"),
        client.get("/drivers?assignable=true"),
      ]);
      setTrips(tripsRes.data);
      setAvailVehicles(vehiclesRes.data);
      setAvailDrivers(driversRes.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────
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

  // ── Client-side filter ──────────────────────────────────────────────────
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

  // ── Table columns ────────────────────────────────────────────────────────
  const columns = [
    {
      key: "route",
      header: "Route",
      render: (row) => (
        <span className="font-medium text-gray-800 dark:text-gray-200">
          {row.source}
          <span className="mx-1 text-gray-400">→</span>
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
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {vehicle.reg_number}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        );
      },
    },
    {
      key: "driver",
      header: "Driver",
      render: (row) => {
        const driver = driverMap[row.driver_id];
        return driver ? (
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {driver.name}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        );
      },
    },
    {
      key: "cargo_weight",
      header: "Cargo (kg)",
      render: (row) => (
        <span className="tabular-nums text-sm">{row.cargo_weight ?? "—"}</span>
      ),
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
                className="text-xs px-2.5 py-1 rounded-md border border-blue-500/40 text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? "…" : "Dispatch"}
              </button>
            )}
            {row.status === "dispatched" && (
              <button
                id={`complete-btn-${row.id}`}
                disabled={busy}
                onClick={() => setCompleteTrip(row)}
                className="text-xs px-2.5 py-1 rounded-md border border-green-500/40 text-green-500 bg-green-500/10 hover:bg-green-500/20 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Complete
              </button>
            )}
            {(row.status === "draft" || row.status === "dispatched") && (
              <button
                id={`cancel-btn-${row.id}`}
                disabled={busy}
                onClick={() => cancel(row)}
                className="text-xs px-2.5 py-1 rounded-md border border-red-500/40 text-red-500 bg-red-500/10 hover:bg-red-500/20 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? "…" : "Cancel"}
              </button>
            )}
          </div>
        );
      },
    },
  ];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-4 flex gap-4 h-full min-h-0">
      {/* ── Left panel: Create Trip ── */}
      <div className="w-80 shrink-0 flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Trip Dispatcher
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Create and manage fleet trips.
          </p>
        </div>

        <div className="border border-gray-200 dark:border-gray-800 rounded-md bg-white dark:bg-gray-900 p-4 space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
              Trip Lifecycle
            </p>
            <LifecycleBar />
          </div>

          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Create Trip
          </p>

          <CreateTripForm
            vehicles={availVehicles}
            drivers={availDrivers}
            onCreated={fetchAll}
            onError={showError}
          />
        </div>

        <p className="text-xs text-orange-500/80 leading-relaxed">
          On Complete: odometer → fuel log → expenses → Vehicle &amp; Driver
          Available.
        </p>
      </div>

      {/* ── Right panel: Live Board ── */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Live Board
          </h2>
          <span className="text-xs text-gray-400 ml-auto">
            {filtered.length} trip{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Toast */}
        {toast && (
          <Toast message={toast} onClose={() => setToast("")} />
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <input
            id="trip-search"
            type="text"
            placeholder="Search route, vehicle, driver…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[180px] text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md px-3 py-1.5 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <select
            id="trip-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md px-3 py-1.5 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {["all", "draft", "dispatched", "completed", "cancelled"].map(
              (s) => (
                <option key={s} value={s}>
                  {s === "all"
                    ? "All Statuses"
                    : s[0].toUpperCase() + s.slice(1)}
                </option>
              )
            )}
          </select>
        </div>

        {/* Table */}
        <div className="flex-1 border border-gray-200 dark:border-gray-800 rounded-md bg-white dark:bg-gray-900 overflow-auto">
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-400">
              Loading trips…
            </div>
          ) : (
            <DataTable columns={columns} rows={filtered} />
          )}
        </div>
      </div>

      {/* Complete-trip modal */}
      <CompleteModal
        trip={completeTrip}
        open={!!completeTrip}
        onClose={() => setCompleteTrip(null)}
        onCompleted={fetchAll}
        onError={showError}
      />
    </div>
  );
}

// ── Shared style helpers ──────────────────────────────────────────────────────
const labelCls =
  "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

const inputCls =
  "w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-1.5 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500";
