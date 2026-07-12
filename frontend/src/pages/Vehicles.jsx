import { useEffect, useState } from "react";
import client from "../api/client";
import DataTable from "../components/shared/DataTable";
import StatusBadge from "../components/shared/StatusBadge";
import Modal from "../components/shared/Modal";
import { useAuth } from "../context/AuthContext";

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
    <div className="p-4 space-y-4">
      {/* Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Vehicle Registry
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your fleet registration, status, and log details.
          </p>
        </div>
        {user?.role === "fleet_manager" && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md transition-colors shadow-sm self-end"
          >
            + Add Vehicle
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white dark:bg-gray-900 p-3 rounded-md border border-gray-200 dark:border-gray-800">
        <div className="flex flex-col gap-1 w-full md:w-auto">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
            Status Filter
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-transparent text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="All">All Statuses</option>
            <option value="available">Available</option>
            <option value="on_trip">On Trip</option>
            <option value="in_shop">In Shop</option>
            <option value="retired">Retired</option>
          </select>
        </div>

        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
            Search
          </label>
          <input
            type="text"
            placeholder="Search reg. number or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:max-w-md px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Main Grid/Table */}
      {loading ? (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
          Loading fleet data...
        </div>
      ) : error ? (
        <div className="p-4 text-red-500 border border-red-500/40 bg-red-500/10 rounded-md">
          {error}
        </div>
      ) : (
        <div className="border border-gray-200 dark:border-gray-800 rounded-md bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
          <DataTable
            columns={columns}
            rows={filteredVehicles}
            onRowClick={handleRowClick}
          />
        </div>
      )}

      {/* Add Vehicle Modal */}
      <Modal
        open={isAddModalOpen}
        onClose={handleCloseAddModal}
        title="Register New Vehicle"
      >
        <form onSubmit={handleCreateVehicle} className="space-y-4">
          {addVehicleError && (
            <div className="text-sm text-red-500 border border-red-500/40 bg-red-500/10 rounded-md px-3 py-2">
              {addVehicleError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Reg. Number
              </label>
              <input
                type="text"
                required
                value={newVehicle.reg_number}
                onChange={(e) => updateForm("reg_number", e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                placeholder="e.g. GJ01AB4521"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Name/Model
              </label>
              <input
                type="text"
                required
                value={newVehicle.name}
                onChange={(e) => updateForm("name", e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                placeholder="e.g. Van-05"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Type
              </label>
              <input
                type="text"
                required
                value={newVehicle.type}
                onChange={(e) => updateForm("type", e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                placeholder="e.g. van, truck, mini"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Capacity (kg)
              </label>
              <input
                type="number"
                step="any"
                required
                value={newVehicle.max_load_capacity}
                onChange={(e) => updateForm("max_load_capacity", e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                placeholder="500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Odometer (km)
              </label>
              <input
                type="number"
                step="any"
                value={newVehicle.odometer}
                onChange={(e) => updateForm("odometer", e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Acquisition Cost
              </label>
              <input
                type="number"
                step="any"
                value={newVehicle.acquisition_cost}
                onChange={(e) => updateForm("acquisition_cost", e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              Region
            </label>
            <input
              type="text"
              value={newVehicle.region}
              onChange={(e) => updateForm("region", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
              placeholder="e.g. Gandhinagar"
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
              Add Vehicle
            </button>
          </div>
        </form>
      </Modal>

      {/* Vehicle History Modal */}
      <Modal
        open={!!selectedHistory}
        onClose={() => setSelectedHistory(null)}
        title={`Vehicle History - ${selectedHistory?.vehicle.name} (${selectedHistory?.vehicle.reg_number})`}
      >
        <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
          {selectedHistory && (
            <>
              {/* Vehicle Quick Info */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-gray-50 dark:bg-gray-900 p-3 rounded-md border border-gray-100 dark:border-gray-800 text-xs">
                <div>
                  <span className="text-gray-500 block mb-0.5">Status</span>
                  <StatusBadge status={selectedHistory.vehicle.status} />
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Type</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200 capitalize">
                    {selectedHistory.vehicle.type}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Max Capacity</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {selectedHistory.vehicle.max_load_capacity} kg
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Odometer</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {selectedHistory.vehicle.odometer.toLocaleString()} km
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Region</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {selectedHistory.vehicle.region || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Total Cost</span>
                  <span className="font-semibold text-orange-500">
                    ₹{selectedHistory.total_cost.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Trips History */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-800 pb-1">
                  Trips ({selectedHistory.trips.length})
                </h3>
                {selectedHistory.trips.length === 0 ? (
                  <p className="text-xs text-gray-400">No trips recorded.</p>
                ) : (
                  <div className="border border-gray-200 dark:border-gray-800 rounded-md overflow-hidden text-xs max-h-40 overflow-y-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 border-b border-gray-200 dark:border-gray-800">
                        <tr className="text-gray-500">
                          <th className="py-1.5 px-3 font-medium">Route</th>
                          <th className="py-1.5 px-3 font-medium">Cargo</th>
                          <th className="py-1.5 px-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedHistory.trips.map((trip) => (
                          <tr
                            key={trip.id}
                            className="border-b border-gray-100 dark:border-gray-900 last:border-none"
                          >
                            <td className="py-1.5 px-3 text-gray-700 dark:text-gray-300">
                              {trip.source} → {trip.destination}
                            </td>
                            <td className="py-1.5 px-3 text-gray-700 dark:text-gray-300">
                              {trip.cargo_weight} kg
                            </td>
                            <td className="py-1.5 px-3">
                              <StatusBadge status={trip.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Maintenance History */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-800 pb-1">
                  Maintenance Logs ({selectedHistory.maintenance.length})
                </h3>
                {selectedHistory.maintenance.length === 0 ? (
                  <p className="text-xs text-gray-400">No maintenance records.</p>
                ) : (
                  <div className="border border-gray-200 dark:border-gray-800 rounded-md overflow-hidden text-xs max-h-40 overflow-y-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 border-b border-gray-200 dark:border-gray-800">
                        <tr className="text-gray-500">
                          <th className="py-1.5 px-3 font-medium">Issue</th>
                          <th className="py-1.5 px-3 font-medium">Cost</th>
                          <th className="py-1.5 px-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedHistory.maintenance.map((log) => (
                          <tr
                            key={log.id}
                            className="border-b border-gray-100 dark:border-gray-900 last:border-none"
                          >
                            <td className="py-1.5 px-3 text-gray-700 dark:text-gray-300">
                              {log.issue_description}
                            </td>
                            <td className="py-1.5 px-3 text-gray-700 dark:text-gray-300">
                              ₹{log.cost.toLocaleString()}
                            </td>
                            <td className="py-1.5 px-3">
                              <StatusBadge status={log.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setSelectedHistory(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

