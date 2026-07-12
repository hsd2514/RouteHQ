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
      className="inline-flex items-center gap-1.5 font-mono-hq text-[13px]"
      style={{ color: expired ? "#ff4757" : "var(--hq-text)" }}
    >
      {value ?? "—"}
      {expired && (
        <span
          className="inline-block text-[10px] uppercase px-1.5 py-0.5 border leading-none font-mono-hq"
          style={{ color: "#ff4757", borderColor: "#ff475755", background: "#ff475714" }}
        >
          Expired
        </span>
      )}
    </span>
  );
}

function SafetyScore({ score }) {
  if (score == null) return <span style={{ color: "var(--hq-text-dim)" }}>—</span>;
  const color = score >= 90 ? "#22c55e" : score >= 70 ? "#ffb020" : "#ff4757";
  return <span className="font-semibold font-mono-hq" style={{ color }}>{score}</span>;
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
  const canManage = user?.role === "fleet_manager" || user?.role === "safety_officer";

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [patchingId, setPatchingId] = useState(null);

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

  const filtered = drivers.filter((d) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      d.name?.toLowerCase().includes(q) ||
      d.license_number?.toLowerCase().includes(q) ||
      d.contact_number?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
      setFormError(err.response?.data?.detail || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(driver) {
    const newStatus = driver.status === "suspended" ? "available" : "suspended";
    setPatchingId(driver.id);
    try {
      await client.patch(`/drivers/${driver.id}`, { status: newStatus });
      await fetchDrivers();
    } finally {
      setPatchingId(null);
    }
  }

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
              const color = isSuspended ? "#22c55e" : "#ff9500";
              return (
                <button
                  id={`driver-action-${row.id}`}
                  disabled={isLoading}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStatus(row);
                  }}
                  className="text-[11px] uppercase tracking-wide px-2.5 py-1 border font-mono-hq font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ color, borderColor: `${color}55`, background: `${color}14` }}
                >
                  {isLoading ? "…" : isSuspended ? "Reactivate" : "Suspend"}
                </button>
              );
            },
          },
        ]
      : []),
  ];

  return (
    <div className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-xl" style={{ color: "var(--hq-text)" }}>
            Drivers &amp; Safety Profiles
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--hq-text-dim)" }}>
            Manage driver roster, licenses, and safety records.
          </p>
        </div>
        {canManage && (
          <button
            id="add-driver-btn"
            onClick={openModal}
            className="flex items-center gap-1.5 text-sm font-display font-semibold tracking-wide px-4 py-2 transition-opacity hover:opacity-90"
            style={{ background: "var(--hq-amber)", color: "#0a0b0d" }}
          >
            <span className="text-base leading-none">+</span> ADD DRIVER
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="hq-panel flex flex-wrap items-center gap-3 p-3">
        <input
          id="driver-search"
          type="text"
          placeholder="Search by name, license or contact…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="hq-glow flex-1 min-w-[220px] max-w-sm text-sm px-3 py-1.5 border outline-none font-mono-hq"
          style={{ background: "var(--hq-bg)", borderColor: "var(--hq-border)", color: "var(--hq-text)" }}
        />
        <select
          id="driver-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="hq-glow text-sm px-3 py-1.5 border outline-none font-mono-hq"
          style={{ background: "var(--hq-bg)", borderColor: "var(--hq-border)", color: "var(--hq-text)" }}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All Statuses" : s.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")}
            </option>
          ))}
        </select>
        <span className="text-xs font-mono-hq ml-auto" style={{ color: "var(--hq-text-dim)" }}>
          {filtered.length} driver{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="hq-panel overflow-x-auto">
        {loading ? (
          <div className="py-10 text-center text-sm font-mono-hq" style={{ color: "var(--hq-text-dim)" }}>
            Loading drivers…
          </div>
        ) : (
          <DataTable columns={columns} rows={filtered} />
        )}
      </div>

      {/* Rule notice */}
      <p className="text-xs font-mono-hq" style={{ color: "var(--hq-amber)" }}>
        RULE: Expired license or Suspended status → blocked from trip assignment.
      </p>

      {/* Add Driver Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Driver">
        <form onSubmit={handleSubmit} className="space-y-3">
          {formError && (
            <div
              id="driver-form-error"
              className="text-sm px-3 py-2 border font-mono-hq"
              style={{ color: "#ff4757", borderColor: "#ff475755", background: "#ff475714" }}
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
              style={inputStyle}
            />
          </FormField>

          <FormField label="License Number" required>
            <input
              id="driver-license-number"
              required
              type="text"
              placeholder="e.g. DL-88213"
              value={form.license_number}
              onChange={(e) => setForm({ ...form, license_number: e.target.value })}
              className={inputCls}
              style={inputStyle}
            />
          </FormField>

          <FormField label="License Category" required>
            <select
              id="driver-license-category"
              value={form.license_category}
              onChange={(e) => setForm({ ...form, license_category: e.target.value })}
              className={inputCls}
              style={inputStyle}
            >
              {LICENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </FormField>

          <FormField label="License Expiry Date" required>
            <input
              id="driver-license-expiry"
              required
              type="date"
              value={form.license_expiry}
              onChange={(e) => setForm({ ...form, license_expiry: e.target.value })}
              className={inputCls}
              style={inputStyle}
            />
          </FormField>

          <FormField label="Contact Number">
            <input
              id="driver-contact-number"
              type="text"
              placeholder="e.g. 9876500000"
              value={form.contact_number}
              onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
              className={inputCls}
              style={inputStyle}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-3" style={{ borderTop: "1px solid var(--hq-border)" }}>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="text-sm px-4 py-1.5 border transition-colors"
              style={{ borderColor: "var(--hq-border)", color: "var(--hq-text-dim)" }}
            >
              Cancel
            </button>
            <button
              id="driver-submit-btn"
              type="submit"
              disabled={submitting}
              className="text-sm px-4 py-1.5 font-display font-semibold tracking-wide transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "var(--hq-amber)", color: "#0a0b0d" }}
            >
              {submitting ? "Saving…" : "ADD DRIVER"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────
const inputCls = "hq-glow w-full text-sm px-3 py-1.5 border outline-none font-mono-hq";
const inputStyle = { background: "var(--hq-bg)", borderColor: "var(--hq-border)", color: "var(--hq-text)" };

function FormField({ label, required, children }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.12em] font-mono-hq mb-1" style={{ color: "var(--hq-text-dim)" }}>
        {label}
        {required && <span style={{ color: "#ff4757" }} className="ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
