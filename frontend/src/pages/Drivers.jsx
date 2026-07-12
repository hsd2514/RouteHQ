import { useEffect, useState } from "react";
import client from "../api/client";
import DataTable from "../components/shared/DataTable";
import Modal from "../components/shared/Modal";
import StatusBadge from "../components/shared/StatusBadge";
import { useAuth } from "../context/AuthContext";

const STATUS_OPTIONS = ["all", "available", "on_trip", "off_duty", "suspended"];

const LICENSE_CATEGORIES = ["LMV", "HMV", "HPMV", "PSV", "Transport"];

function isExpired(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function ExpiryCell({ value }) {
  const expired = isExpired(value);
  return (
    <span
      className={`inline-flex items-center gap-1 text-sm font-medium ${
        expired ? "text-red-500" : "text-gray-700 dark:text-gray-300"
      }`}
    >
      {value ?? "—"}
      {expired && (
        <span className="inline-block text-xs bg-red-500/10 border border-red-500/40 text-red-500 px-1.5 py-0.5 rounded-md leading-none">
          Expired
        </span>
      )}
    </span>
  );
}

function SafetyScore({ score }) {
  if (score == null) return <span className="text-gray-400">—</span>;
  const color =
    score >= 90
      ? "text-green-500"
      : score >= 70
      ? "text-yellow-500"
      : "text-red-500";
  return <span className={`font-semibold tabular-nums ${color}`}>{score}</span>;
}

const EMPTY_FORM = {
  name: "",
  license_number: "",
  license_category: "LMV",
  license_expiry: "",
  contact_number: "",
};

export default function Drivers() {
  const { user } = useAuth();
  const canManage =
    user?.role === "fleet_manager" || user?.role === "safety_officer";

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Add driver modal
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Suspend/reactivate loading per row
  const [patchingId, setPatchingId] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────
  async function fetchDrivers() {
    setLoading(true);
    try {
      const { data } = await client.get("/drivers");
      setDrivers(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDrivers();
  }, []);

  // ── Client-side filter ────────────────────────────────────────────────
  const filtered = drivers.filter((d) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      d.name?.toLowerCase().includes(q) ||
      d.license_number?.toLowerCase().includes(q) ||
      d.contact_number?.toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === "all" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ── Add driver ────────────────────────────────────────────────────────
  function openModal() {
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await client.post("/drivers", form);
      setModalOpen(false);
      await fetchDrivers();
    } catch (err) {
      setFormError(
        err.response?.data?.detail || "An unexpected error occurred."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ── Suspend / Reactivate ──────────────────────────────────────────────
  async function toggleStatus(driver) {
    const newStatus =
      driver.status === "suspended" ? "available" : "suspended";
    setPatchingId(driver.id);
    try {
      await client.patch(`/drivers/${driver.id}`, { status: newStatus });
      await fetchDrivers();
    } finally {
      setPatchingId(null);
    }
  }

  // ── Table columns ─────────────────────────────────────────────────────
  const columns = [
    { key: "name", header: "Driver" },
    { key: "license_number", header: "License No." },
    { key: "license_category", header: "Category" },
    {
      key: "license_expiry",
      header: "Expiry",
      render: (row) => <ExpiryCell value={row.license_expiry} />,
    },
    { key: "contact_number", header: "Contact" },
    {
      key: "safety_score",
      header: "Safety Score",
      render: (row) => <SafetyScore score={row.safety_score} />,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    ...(canManage
      ? [
          {
            key: "_actions",
            header: "Action",
            render: (row) => {
              const isSuspended = row.status === "suspended";
              const isLoading = patchingId === row.id;
              return (
                <button
                  id={`driver-action-${row.id}`}
                  disabled={isLoading}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStatus(row);
                  }}
                  className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isSuspended
                      ? "border-green-500/40 text-green-500 bg-green-500/10 hover:bg-green-500/20"
                      : "border-orange-500/40 text-orange-500 bg-orange-500/10 hover:bg-orange-500/20"
                  }`}
                >
                  {isLoading
                    ? "…"
                    : isSuspended
                    ? "Reactivate"
                    : "Suspend"}
                </button>
              );
            },
          },
        ]
      : []),
  ];

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Drivers &amp; Safety Profiles
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage driver roster, licenses, and safety records.
          </p>
        </div>
        {canManage && (
          <button
            id="add-driver-btn"
            onClick={openModal}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
          >
            <span className="text-base leading-none">+</span> Add Driver
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          id="driver-search"
          type="text"
          placeholder="Search by name, license or contact…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[220px] max-w-sm text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md px-3 py-1.5 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <select
          id="driver-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md px-3 py-1.5 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "all"
                ? "All Statuses"
                : s
                    .split("_")
                    .map((w) => w[0].toUpperCase() + w.slice(1))
                    .join(" ")}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-400 ml-auto">
          {filtered.length} driver{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-md bg-white dark:bg-gray-900 overflow-x-auto">
        {loading ? (
          <div className="py-10 text-center text-sm text-gray-400">
            Loading drivers…
          </div>
        ) : (
          <DataTable columns={columns} rows={filtered} />
        )}
      </div>

      {/* Rule notice */}
      <p className="text-xs text-orange-500/80">
        Rule: Expired license or Suspended status → blocked from trip assignment.
      </p>

      {/* Add Driver Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Driver"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          {formError && (
            <div
              id="driver-form-error"
              className="text-sm text-red-500 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2"
            >
              {formError}
            </div>
          )}

          <FormField label="Full Name" required>
            <input
              id="driver-name"
              required
              type="text"
              placeholder="e.g. Alex Johnson"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
            />
          </FormField>

          <FormField label="License Number" required>
            <input
              id="driver-license-number"
              required
              type="text"
              placeholder="e.g. DL-88213"
              value={form.license_number}
              onChange={(e) =>
                setForm({ ...form, license_number: e.target.value })
              }
              className={inputCls}
            />
          </FormField>

          <FormField label="License Category" required>
            <select
              id="driver-license-category"
              value={form.license_category}
              onChange={(e) =>
                setForm({ ...form, license_category: e.target.value })
              }
              className={inputCls}
            >
              {LICENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="License Expiry Date" required>
            <input
              id="driver-license-expiry"
              required
              type="date"
              value={form.license_expiry}
              onChange={(e) =>
                setForm({ ...form, license_expiry: e.target.value })
              }
              className={inputCls}
            />
          </FormField>

          <FormField label="Contact Number">
            <input
              id="driver-contact-number"
              type="text"
              placeholder="e.g. 9876500000"
              value={form.contact_number}
              onChange={(e) =>
                setForm({ ...form, contact_number: e.target.value })
              }
              className={inputCls}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="text-sm px-4 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              id="driver-submit-btn"
              type="submit"
              disabled={submitting}
              className="text-sm px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Saving…" : "Add Driver"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────
const inputCls =
  "w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-1.5 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500";

function FormField({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
