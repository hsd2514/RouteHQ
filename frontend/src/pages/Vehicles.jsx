import { useEffect, useState } from "react";
import client from "../api/client";
import DataTable from "../components/shared/DataTable";
import StatusBadge from "../components/shared/StatusBadge";
import Modal from "../components/shared/Modal";
import { useAuth } from "../context/AuthContext";

const labelCls = "block text-[10px] uppercase tracking-[0.12em] font-mono-hq mb-1";
const inputCls = "hq-glow w-full px-3 py-2 text-sm border outline-none font-mono-hq";
const inputStyle = { background: "var(--hq-bg)", borderColor: "var(--hq-border)", color: "var(--hq-text)" };

export default function Vehicles() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Register Vehicle Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addVehicleError, setAddVehicleError] = useState("");
  const [newVehicle, setNewVehicle] = useState({
    reg_number: "",
    name: "",
    type: "",
    max_load_capacity: "",
    odometer: "0",
    acquisition_cost: "0",
    region: "",
  });

  // History Modal State
  const [selectedHistory, setSelectedHistory] = useState(null);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await client.get("/vehicles");
      setVehicles(response.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load vehicles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setAddVehicleError("");
    setNewVehicle({
      reg_number: "",
      name: "",
      type: "",
      max_load_capacity: "",
      odometer: "0",
      acquisition_cost: "0",
      region: "",
    });
  };

  const updateForm = (field, value) => {
    setNewVehicle((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    setAddVehicleError("");

    const payload = {
      reg_number: newVehicle.reg_number.trim(),
      name: newVehicle.name.trim(),
      type: newVehicle.type.trim(),
      max_load_capacity: parseFloat(newVehicle.max_load_capacity) || 0,
      odometer: parseFloat(newVehicle.odometer) || 0,
      acquisition_cost: parseFloat(newVehicle.acquisition_cost) || 0,
      region: newVehicle.region.trim() || null,
    };

    try {
      await client.post("/vehicles", payload);
      handleCloseAddModal();
      await fetchVehicles();
    } catch (err) {
      setAddVehicleError(err.response?.data?.detail || "Failed to create vehicle.");
    }
  };

  const handleRowClick = async (row) => {
    try {
      const response = await client.get(`/vehicles/${row.id}/history`);
      setSelectedHistory(response.data);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to load vehicle history.");
    }
  };

  // Client-side filtering
  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.reg_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    { key: "reg_number", header: "Reg. Number" },
    { key: "name", header: "Name" },
    { key: "type", header: "Type" },
    {
      key: "max_load_capacity",
      header: "Capacity",
      render: (row) => `${row.max_load_capacity} kg`,
    },
    {
      key: "odometer",
      header: "Odometer",
      render: (row) => `${row.odometer.toLocaleString()} km`,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    { key: "region", header: "Region", render: (row) => row.region || "N/A" },
  ];

  return (
    <div className="p-5 space-y-4">
      {/* Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-xl" style={{ color: "var(--hq-text)" }}>
            Vehicle Registry
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--hq-text-dim)" }}>
            Manage your fleet registration, status, and log details.
          </p>
        </div>
        {user?.role === "fleet_manager" && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 text-sm font-display font-semibold tracking-wide transition-opacity hover:opacity-90 self-end"
            style={{ background: "var(--hq-amber)", color: "#0a0b0d" }}
          >
            + ADD VEHICLE
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="hq-panel flex flex-col md:flex-row md:items-center gap-4 p-3">
        <div className="flex flex-col gap-1 w-full md:w-auto">
          <label className={labelCls} style={{ color: "var(--hq-text-dim)" }}>
            Status Filter
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={inputCls}
            style={inputStyle}
          >
            <option value="All">All Statuses</option>
            <option value="available">Available</option>
            <option value="on_trip">On Trip</option>
            <option value="in_shop">In Shop</option>
            <option value="retired">Retired</option>
          </select>
        </div>

        <div className="flex flex-col gap-1 flex-1">
          <label className={labelCls} style={{ color: "var(--hq-text-dim)" }}>
            Search
          </label>
          <input
            type="text"
            placeholder="Search reg. number or name…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full md:max-w-md ${inputCls}`}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Main Grid/Table */}
      {loading ? (
        <div className="p-4 text-center text-sm font-mono-hq" style={{ color: "var(--hq-text-dim)" }}>
          Loading fleet data…
        </div>
      ) : error ? (
        <div className="text-sm px-3 py-2 border font-mono-hq" style={{ color: "#ff4757", borderColor: "#ff475755", background: "#ff475714" }}>
          {error}
        </div>
      ) : (
        <div className="hq-panel overflow-hidden">
          <DataTable columns={columns} rows={filteredVehicles} onRowClick={handleRowClick} />
        </div>
      )}

      {/* Add Vehicle Modal */}
      <Modal open={isAddModalOpen} onClose={handleCloseAddModal} title="Register New Vehicle">
        <form onSubmit={handleCreateVehicle} className="space-y-4">
          {addVehicleError && (
            <div className="text-sm px-3 py-2 border font-mono-hq" style={{ color: "#ff4757", borderColor: "#ff475755", background: "#ff475714" }}>
              {addVehicleError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={{ color: "var(--hq-text-dim)" }}>Reg. Number</label>
              <input required value={newVehicle.reg_number} onChange={(e) => updateForm("reg_number", e.target.value)} className={inputCls} style={inputStyle} placeholder="e.g. GJ01AB4521" />
            </div>
            <div>
              <label className={labelCls} style={{ color: "var(--hq-text-dim)" }}>Name/Model</label>
              <input required value={newVehicle.name} onChange={(e) => updateForm("name", e.target.value)} className={inputCls} style={inputStyle} placeholder="e.g. Van-05" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={{ color: "var(--hq-text-dim)" }}>Type</label>
              <input required value={newVehicle.type} onChange={(e) => updateForm("type", e.target.value)} className={inputCls} style={inputStyle} placeholder="e.g. van, truck, mini" />
            </div>
            <div>
              <label className={labelCls} style={{ color: "var(--hq-text-dim)" }}>Capacity (kg)</label>
              <input type="number" step="any" required value={newVehicle.max_load_capacity} onChange={(e) => updateForm("max_load_capacity", e.target.value)} className={inputCls} style={inputStyle} placeholder="500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={{ color: "var(--hq-text-dim)" }}>Odometer (km)</label>
              <input type="number" step="any" value={newVehicle.odometer} onChange={(e) => updateForm("odometer", e.target.value)} className={inputCls} style={inputStyle} placeholder="0" />
            </div>
            <div>
              <label className={labelCls} style={{ color: "var(--hq-text-dim)" }}>Acquisition Cost</label>
              <input type="number" step="any" value={newVehicle.acquisition_cost} onChange={(e) => updateForm("acquisition_cost", e.target.value)} className={inputCls} style={inputStyle} placeholder="0" />
            </div>
          </div>

          <div>
            <label className={labelCls} style={{ color: "var(--hq-text-dim)" }}>Region</label>
            <input value={newVehicle.region} onChange={(e) => updateForm("region", e.target.value)} className={inputCls} style={inputStyle} placeholder="e.g. Gandhinagar" />
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
              ADD VEHICLE
            </button>
          </div>
        </form>
      </Modal>

      {/* Vehicle History Modal */}
      <Modal
        open={!!selectedHistory}
        onClose={() => setSelectedHistory(null)}
        title={`${selectedHistory?.vehicle.name} · ${selectedHistory?.vehicle.reg_number}`}
      >
        <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
          {selectedHistory && (
            <>
              {/* Vehicle Quick Info */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-3 text-xs" style={{ background: "var(--hq-panel-2)", border: "1px solid var(--hq-border)" }}>
                <div>
                  <span className="block mb-0.5 font-mono-hq" style={{ color: "var(--hq-text-dim)" }}>Status</span>
                  <StatusBadge status={selectedHistory.vehicle.status} />
                </div>
                <div>
                  <span className="block mb-0.5 font-mono-hq" style={{ color: "var(--hq-text-dim)" }}>Type</span>
                  <span className="font-semibold capitalize font-mono-hq" style={{ color: "var(--hq-text)" }}>{selectedHistory.vehicle.type}</span>
                </div>
                <div>
                  <span className="block mb-0.5 font-mono-hq" style={{ color: "var(--hq-text-dim)" }}>Max Capacity</span>
                  <span className="font-semibold font-mono-hq" style={{ color: "var(--hq-text)" }}>{selectedHistory.vehicle.max_load_capacity} kg</span>
                </div>
                <div>
                  <span className="block mb-0.5 font-mono-hq" style={{ color: "var(--hq-text-dim)" }}>Odometer</span>
                  <span className="font-semibold font-mono-hq" style={{ color: "var(--hq-text)" }}>{selectedHistory.vehicle.odometer.toLocaleString()} km</span>
                </div>
                <div>
                  <span className="block mb-0.5 font-mono-hq" style={{ color: "var(--hq-text-dim)" }}>Region</span>
                  <span className="font-semibold font-mono-hq" style={{ color: "var(--hq-text)" }}>{selectedHistory.vehicle.region || "N/A"}</span>
                </div>
                <div>
                  <span className="block mb-0.5 font-mono-hq" style={{ color: "var(--hq-text-dim)" }}>Total Cost</span>
                  <span className="font-semibold font-mono-hq" style={{ color: "var(--hq-amber)" }}>₹{selectedHistory.total_cost.toLocaleString()}</span>
                </div>
              </div>

              {/* Trips History */}
              <div className="space-y-2">
                <h3 className="text-sm font-display font-semibold pb-1" style={{ color: "var(--hq-text)", borderBottom: "1px solid var(--hq-border)" }}>
                  Trips ({selectedHistory.trips.length})
                </h3>
                {selectedHistory.trips.length === 0 ? (
                  <p className="text-xs font-mono-hq" style={{ color: "var(--hq-text-dim)" }}>No trips recorded.</p>
                ) : (
                  <div className="overflow-hidden text-xs max-h-40 overflow-y-auto" style={{ border: "1px solid var(--hq-border)" }}>
                    <table className="w-full text-left">
                      <thead className="sticky top-0" style={{ background: "var(--hq-panel-2)", borderBottom: "1px solid var(--hq-border)" }}>
                        <tr style={{ color: "var(--hq-text-dim)" }}>
                          <th className="py-1.5 px-3 font-medium font-mono-hq">Route</th>
                          <th className="py-1.5 px-3 font-medium font-mono-hq">Cargo</th>
                          <th className="py-1.5 px-3 font-medium font-mono-hq">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedHistory.trips.map((trip) => (
                          <tr key={trip.id} style={{ borderBottom: "1px solid var(--hq-border)" }}>
                            <td className="py-1.5 px-3 font-mono-hq" style={{ color: "var(--hq-text)" }}>{trip.source} → {trip.destination}</td>
                            <td className="py-1.5 px-3 font-mono-hq" style={{ color: "var(--hq-text)" }}>{trip.cargo_weight} kg</td>
                            <td className="py-1.5 px-3"><StatusBadge status={trip.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Maintenance History */}
              <div className="space-y-2">
                <h3 className="text-sm font-display font-semibold pb-1" style={{ color: "var(--hq-text)", borderBottom: "1px solid var(--hq-border)" }}>
                  Maintenance Logs ({selectedHistory.maintenance.length})
                </h3>
                {selectedHistory.maintenance.length === 0 ? (
                  <p className="text-xs font-mono-hq" style={{ color: "var(--hq-text-dim)" }}>No maintenance records.</p>
                ) : (
                  <div className="overflow-hidden text-xs max-h-40 overflow-y-auto" style={{ border: "1px solid var(--hq-border)" }}>
                    <table className="w-full text-left">
                      <thead className="sticky top-0" style={{ background: "var(--hq-panel-2)", borderBottom: "1px solid var(--hq-border)" }}>
                        <tr style={{ color: "var(--hq-text-dim)" }}>
                          <th className="py-1.5 px-3 font-medium font-mono-hq">Issue</th>
                          <th className="py-1.5 px-3 font-medium font-mono-hq">Cost</th>
                          <th className="py-1.5 px-3 font-medium font-mono-hq">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedHistory.maintenance.map((log) => (
                          <tr key={log.id} style={{ borderBottom: "1px solid var(--hq-border)" }}>
                            <td className="py-1.5 px-3 font-mono-hq" style={{ color: "var(--hq-text)" }}>{log.issue_description}</td>
                            <td className="py-1.5 px-3 font-mono-hq" style={{ color: "var(--hq-text)" }}>₹{log.cost.toLocaleString()}</td>
                            <td className="py-1.5 px-3"><StatusBadge status={log.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex justify-end pt-2" style={{ borderTop: "1px solid var(--hq-border)" }}>
            <button
              onClick={() => setSelectedHistory(null)}
              className="px-4 py-2 text-sm font-medium border"
              style={{ borderColor: "var(--hq-border)", color: "var(--hq-text-dim)" }}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
