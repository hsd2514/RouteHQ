import { useEffect, useState } from "react";
import client from "../api/client";
import DataTable from "../components/shared/DataTable";
import { useAuth } from "../context/AuthContext";

export default function FuelExpenses() {
  const { user } = useAuth();
  const canAdd = ["fleet_manager", "financial_analyst", "driver"].includes(user?.role);

  const [vehicles, setVehicles] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [fuelVehicleFilter, setFuelVehicleFilter] = useState("All");
  const [expenseVehicleFilter, setExpenseVehicleFilter] = useState("All");

  // Fuel Form
  const [fuelForm, setFuelForm] = useState({
    vehicle_id: "",
    liters: "",
    cost: "",
    date: new Date().toISOString().split('T')[0],
  });
  const [fuelError, setFuelError] = useState("");
  const [fuelSubmitting, setFuelSubmitting] = useState(false);

  // Expense Form
  const [expenseForm, setExpenseForm] = useState({
    vehicle_id: "",
    type: "toll",
    amount: "",
    date: new Date().toISOString().split('T')[0],
  });
  const [expenseError, setExpenseError] = useState("");
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const [vehiclesRes, fuelRes, expenseRes] = await Promise.all([
        client.get("/vehicles"),
        client.get("/fuel-logs"),
        client.get("/expenses"),
      ]);
      setVehicles(vehiclesRes.data);
      setFuelLogs(fuelRes.data);
      setExpenses(expenseRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFuelSubmit = async (e) => {
    e.preventDefault();
    setFuelError("");
    setFuelSubmitting(true);
    try {
      await client.post("/fuel-logs", {
        vehicle_id: parseInt(fuelForm.vehicle_id),
        liters: parseFloat(fuelForm.liters),
        cost: parseFloat(fuelForm.cost),
        date: fuelForm.date,
      });
      setFuelForm((prev) => ({ ...prev, liters: "", cost: "" }));
      await fetchData();
    } catch (err) {
      setFuelError(err.response?.data?.detail || "Failed to log fuel.");
    } finally {
      setFuelSubmitting(false);
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setExpenseError("");
    setExpenseSubmitting(true);
    try {
      await client.post("/expenses", {
        vehicle_id: parseInt(expenseForm.vehicle_id),
        type: expenseForm.type,
        amount: parseFloat(expenseForm.amount),
        date: expenseForm.date,
      });
      setExpenseForm((prev) => ({ ...prev, amount: "" }));
      await fetchData();
    } catch (err) {
      setExpenseError(err.response?.data?.detail || "Failed to log expense.");
    } finally {
      setExpenseSubmitting(false);
    }
  };

  const filteredFuelLogs = fuelLogs.filter(
    (log) => fuelVehicleFilter === "All" || log.vehicle_id.toString() === fuelVehicleFilter
  );

  const filteredExpenses = expenses.filter(
    (exp) => expenseVehicleFilter === "All" || exp.vehicle_id.toString() === expenseVehicleFilter
  );

  const vehicleMap = vehicles.reduce((acc, v) => {
    acc[v.id] = v.name + " (" + v.reg_number + ")";
    return acc;
  }, {});

  const fuelColumns = [
    { key: "vehicle_id", header: "Vehicle", render: (row) => vehicleMap[row.vehicle_id] || row.vehicle_id },
    { key: "date", header: "Date" },
    { key: "liters", header: "Liters", render: (row) => `${row.liters} L` },
    { key: "cost", header: "Cost", render: (row) => `₹${row.cost.toLocaleString()}` },
  ];

  const expenseColumns = [
    { key: "vehicle_id", header: "Vehicle", render: (row) => vehicleMap[row.vehicle_id] || row.vehicle_id },
    { key: "date", header: "Date" },
    { key: "type", header: "Type", render: (row) => <span className="capitalize">{row.type}</span> },
    { key: "amount", header: "Amount", render: (row) => `₹${row.amount.toLocaleString()}` },
  ];

  const activeVehicles = vehicles.filter((v) => v.status !== "retired");

  const inputCls = "w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500";
  const labelCls = "block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1";

  return (
    <div className="p-4 space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Fuel & Expenses
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Log and monitor fleet fuel consumption and other expenses.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 text-red-500 border border-red-500/40 bg-red-500/10 rounded-md">
          {error}
        </div>
      )}

      {canAdd && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fuel Log Form */}
          <div className="bg-white dark:bg-gray-900 p-4 rounded-md border border-gray-200 dark:border-gray-800 shadow-sm">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Log Fuel</h2>
            <form onSubmit={handleFuelSubmit} className="space-y-3">
              {fuelError && <div className="text-sm text-red-500 border border-red-500/40 bg-red-500/10 rounded-md px-3 py-2">{fuelError}</div>}
              <div>
                <label className={labelCls}>Vehicle</label>
                <select required value={fuelForm.vehicle_id} onChange={(e) => setFuelForm({ ...fuelForm, vehicle_id: e.target.value })} className={inputCls}>
                  <option value="" className="text-gray-400">-- Choose Vehicle --</option>
                  {activeVehicles.map((v) => (
                    <option key={v.id} value={v.id} className="bg-white dark:bg-gray-900">{v.name} ({v.reg_number})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Liters</label>
                  <input type="number" step="any" required value={fuelForm.liters} onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })} className={inputCls} placeholder="0" />
                </div>
                <div>
                  <label className={labelCls}>Cost (₹)</label>
                  <input type="number" step="any" required value={fuelForm.cost} onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })} className={inputCls} placeholder="0" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Date</label>
                <input type="date" required value={fuelForm.date} onChange={(e) => setFuelForm({ ...fuelForm, date: e.target.value })} className={inputCls} />
              </div>
              <div className="pt-2">
                <button type="submit" disabled={fuelSubmitting} className="w-full px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md transition-colors disabled:opacity-50">
                  {fuelSubmitting ? "Saving..." : "Submit Fuel Log"}
                </button>
              </div>
            </form>
          </div>

          {/* Expense Form */}
          <div className="bg-white dark:bg-gray-900 p-4 rounded-md border border-gray-200 dark:border-gray-800 shadow-sm">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Log Expense</h2>
            <form onSubmit={handleExpenseSubmit} className="space-y-3">
              {expenseError && <div className="text-sm text-red-500 border border-red-500/40 bg-red-500/10 rounded-md px-3 py-2">{expenseError}</div>}
              <div>
                <label className={labelCls}>Vehicle</label>
                <select required value={expenseForm.vehicle_id} onChange={(e) => setExpenseForm({ ...expenseForm, vehicle_id: e.target.value })} className={inputCls}>
                  <option value="" className="text-gray-400">-- Choose Vehicle --</option>
                  {activeVehicles.map((v) => (
                    <option key={v.id} value={v.id} className="bg-white dark:bg-gray-900">{v.name} ({v.reg_number})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Type</label>
                  <select required value={expenseForm.type} onChange={(e) => setExpenseForm({ ...expenseForm, type: e.target.value })} className={inputCls}>
                    <option value="toll" className="bg-white dark:bg-gray-900">Toll</option>
                    <option value="other" className="bg-white dark:bg-gray-900">Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Amount (₹)</label>
                  <input type="number" step="any" required value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} className={inputCls} placeholder="0" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Date</label>
                <input type="date" required value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} className={inputCls} />
              </div>
              <div className="pt-2">
                <button type="submit" disabled={expenseSubmitting} className="w-full px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md transition-colors disabled:opacity-50">
                  {expenseSubmitting ? "Saving..." : "Submit Expense Log"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fuel Logs Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Fuel History</h2>
            <select
              value={fuelVehicleFilter}
              onChange={(e) => setFuelVehicleFilter(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-transparent text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="All">All Vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id} className="bg-white dark:bg-gray-900">{v.name} ({v.reg_number})</option>
              ))}
            </select>
          </div>
          <div className="border border-gray-200 dark:border-gray-800 rounded-md bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-400">Loading...</div>
            ) : (
              <DataTable columns={fuelColumns} rows={filteredFuelLogs} />
            )}
          </div>
        </div>

        {/* Expenses Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Expense History</h2>
            <select
              value={expenseVehicleFilter}
              onChange={(e) => setExpenseVehicleFilter(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-transparent text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="All">All Vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id} className="bg-white dark:bg-gray-900">{v.name} ({v.reg_number})</option>
              ))}
            </select>
          </div>
          <div className="border border-gray-200 dark:border-gray-800 rounded-md bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-400">Loading...</div>
            ) : (
              <DataTable columns={expenseColumns} rows={filteredExpenses} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
