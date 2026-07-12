import { useEffect, useState } from "react";
import client from "../api/client";
import DataTable from "../components/shared/DataTable";
import StatusBadge from "../components/shared/StatusBadge";
import Modal from "../components/shared/Modal";
import { useAuth } from "../context/AuthContext";

const labelCls = "block text-[10px] uppercase tracking-[0.12em] font-mono-hq mb-1";
const inputCls = "hq-glow w-full px-3 py-2 text-sm border outline-none font-mono-hq";
const inputStyle = { background: "var(--hq-bg)", borderColor: "var(--hq-border)", color: "var(--hq-text)" };

export default function Maintenance() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addLogError, setAddLogError] = useState("");
  const [newLog, setNewLog] = useState({
    vehicle_id: "",
    issue_description: "",
    cost: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const [vehiclesRes, maintenanceRes] = await Promise.all([
        client.get("/vehicles"),
        client.get("/maintenance"),
      ]);
      setVehicles(vehiclesRes.data);
      setMaintenanceLogs(maintenanceRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setAddLogError("");
    setNewLog({ vehicle_id: "", issue_description: "", cost: "" });
  };

  const handleCreateMaintenance = async (e) => {
    e.preventDefault();
    setAddLogError("");

    if (!newLog.vehicle_id) {
      setAddLogError("Please select a vehicle.");
      return;
    }

    const payload = {
      vehicle_id: parseInt(newLog.vehicle_id),
      issue_description: newLog.issue_description.trim(),
      cost: parseFloat(newLog.cost) || 0,
    };

    try {
      await client.post("/maintenance", payload);
      handleCloseAddModal();
      await fetchData();
    } catch (err) {
      setAddLogError(err.response?.data?.detail || "Failed to log maintenance.");
    }
  };

  const handleCloseMaintenance = async (id) => {
    try {
      await client.post(`/maintenance/${id}/close`);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to close maintenance log.");
    }
  };

  const columns = [
    {
      key: "vehicle",
      header: "Vehicle",
      render: (row) => {
        const vehicle = vehicles.find((v) => v.id === row.vehicle_id);
        return vehicle ? `${vehicle.name} (${vehicle.reg_number})` : `Vehicle ID: ${row.vehicle_id}`;
      },
    },
    { key: "issue_description", header: "Issue/Service" },
    {
      key: "cost",
      header: "Cost",
      render: (row) => `₹${row.cost.toLocaleString()}`,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  if (user?.role === "fleet_manager") {
    columns.push({
      key: "actions",
      header: "Actions",
      render: (row) =>
        row.status === "active" ? (
          <button
            onClick={() => handleCloseMaintenance(row.id)}
            className="text-[11px] uppercase tracking-wide px-2.5 py-1 border font-mono-hq font-medium transition-colors"
            style={{ color: "#ff4757", borderColor: "#ff475755", background: "#ff475714" }}
          >
            Close
          </button>
        ) : null,
    });
  }

  const activeVehiclesForDropdown = vehicles.filter((v) => v.status !== "retired");

  return (
    <div className="p-5 space-y-4">
      {/* Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-xl" style={{ color: "var(--hq-text)" }}>
            Maintenance Registry
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--hq-text-dim)" }}>
            Log new maintenance records and track fleet services.
          </p>
        </div>
        {user?.role === "fleet_manager" && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 text-sm font-display font-semibold tracking-wide transition-opacity hover:opacity-90 self-end"
            style={{ background: "var(--hq-amber)", color: "#0a0b0d" }}
          >
            + LOG MAINTENANCE
          </button>
        )}
      </div>

      {/* Main Grid/Table */}
      {loading ? (
        <div className="p-4 text-center text-sm font-mono-hq" style={{ color: "var(--hq-text-dim)" }}>
          Loading maintenance records…
        </div>
      ) : error ? (
        <div className="text-sm px-3 py-2 border font-mono-hq" style={{ color: "#ff4757", borderColor: "#ff475755", background: "#ff475714" }}>
          {error}
        </div>
      ) : (
        <div className="hq-panel overflow-hidden">
          <DataTable columns={columns} rows={maintenanceLogs} />
        </div>
      )}

      {/* Add Maintenance Modal */}
      <Modal open={isAddModalOpen} onClose={handleCloseAddModal} title="Record Maintenance Service">
        <form onSubmit={handleCreateMaintenance} className="space-y-4">
          {addLogError && (
            <div className="text-sm px-3 py-2 border font-mono-hq" style={{ color: "#ff4757", borderColor: "#ff475755", background: "#ff475714" }}>
              {addLogError}
            </div>
          )}

          <div>
            <label className={labelCls} style={{ color: "var(--hq-text-dim)" }}>Select Vehicle</label>
            <select
              required
              value={newLog.vehicle_id}
              onChange={(e) => setNewLog((prev) => ({ ...prev, vehicle_id: e.target.value }))}
              className={inputCls}
              style={inputStyle}
            >
              <option value="">-- Choose Vehicle --</option>
              {activeVehiclesForDropdown.map((v) => (
                <option key={v.id} value={v.id}>{v.name} ({v.reg_number}) - {v.status}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls} style={{ color: "var(--hq-text-dim)" }}>Issue/Service Description</label>
            <textarea
              required
              rows={3}
              value={newLog.issue_description}
              onChange={(e) => setNewLog((prev) => ({ ...prev, issue_description: e.target.value }))}
              className={inputCls}
              style={inputStyle}
              placeholder="Describe the maintenance issue, parts replaced, or service details…"
            />
          </div>

          <div>
            <label className={labelCls} style={{ color: "var(--hq-text-dim)" }}>Service Cost (₹)</label>
            <input
              type="number"
              step="any"
              required
              value={newLog.cost}
              onChange={(e) => setNewLog((prev) => ({ ...prev, cost: e.target.value }))}
              className={inputCls}
              style={inputStyle}
              placeholder="0"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3" style={{ borderTop: "1px solid var(--hq-border)" }}>
            <button
              type="button"
              onClick={handleCloseAddModal}
              className="px-4 py-2 text-sm font-medium border"
              style={{ borderColor: "var(--hq-border)", color: "var(--hq-text-dim)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-display font-semibold tracking-wide transition-opacity hover:opacity-90"
              style={{ background: "var(--hq-amber)", color: "#0a0b0d" }}
            >
              RECORD LOG
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
