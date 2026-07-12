import { useEffect, useState } from "react";
import client from "../api/client";
import DataTable from "../components/shared/DataTable";
import StatusBadge from "../components/shared/StatusBadge";
import Modal from "../components/shared/Modal";
import { useAuth } from "../context/AuthContext";

export default function Maintenance() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create Form State
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
    setNewLog({
      vehicle_id: "",
      issue_description: "",
      cost: "",
    });
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
    {
      key: "issue_description",
      header: "Issue/Service",
    },
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
            className="px-2 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
          >
            Close
          </button>
        ) : null,
    });
  }

  // Filter out retired vehicles for dropdown log options
  const activeVehiclesForDropdown = vehicles.filter((v) => v.status !== "retired");

  return (
    <div className="p-4 space-y-4">
      {/* Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Maintenance Registry
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Log new maintenance records and track fleet services.
          </p>
        </div>
        {user?.role === "fleet_manager" && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md transition-colors shadow-sm self-end"
          >
            + Log Maintenance
          </button>
        )}
      </div>

      {/* Main Grid/Table */}
      {loading ? (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
          Loading maintenance records...
        </div>
      ) : error ? (
        <div className="p-4 text-red-500 border border-red-500/40 bg-red-500/10 rounded-md">
          {error}
        </div>
      ) : (
        <div className="border border-gray-200 dark:border-gray-800 rounded-md bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
          <DataTable columns={columns} rows={maintenanceLogs} />
        </div>
      )}

      {/* Add Maintenance Modal */}
      <Modal
        open={isAddModalOpen}
        onClose={handleCloseAddModal}
        title="Record Maintenance Service"
      >
        <form onSubmit={handleCreateMaintenance} className="space-y-4">
          {addLogError && (
            <div className="text-sm text-red-500 border border-red-500/40 bg-red-500/10 rounded-md px-3 py-2">
              {addLogError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              Select Vehicle
            </label>
            <select
              required
              value={newLog.vehicle_id}
              onChange={(e) =>
                setNewLog((prev) => ({ ...prev, vehicle_id: e.target.value }))
              }
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="" className="text-gray-400">
                -- Choose Vehicle --
              </option>
              {activeVehiclesForDropdown.map((v) => (
                <option
                  key={v.id}
                  value={v.id}
                  className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                >
                  {v.name} ({v.reg_number}) - {v.status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              Issue/Service Description
            </label>
            <textarea
              required
              rows={3}
              value={newLog.issue_description}
              onChange={(e) =>
                setNewLog((prev) => ({
                  ...prev,
                  issue_description: e.target.value,
                }))
              }
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder-gray-400"
              placeholder="Describe the maintenance issue, parts replaced, or service details..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              Service Cost (₹)
            </label>
            <input
              type="number"
              step="any"
              required
              value={newLog.cost}
              onChange={(e) =>
                setNewLog((prev) => ({ ...prev, cost: e.target.value }))
              }
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
              placeholder="0"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={handleCloseAddModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md transition-colors"
            >
              Record Log
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

