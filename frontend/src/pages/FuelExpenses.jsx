import { useEffect, useState } from "react";
import client from "../api/client";
import DataTable from "../components/shared/DataTable";
import { useAuth } from "../context/AuthContext";

const labelCls = "block text-[10px] uppercase tracking-[0.12em] font-mono-hq mb-1";
const inputCls = "hq-glow w-full px-3 py-2 text-sm border outline-none font-mono-hq";
const inputStyle = { background: "var(--hq-bg)", borderColor: "var(--hq-border)", color: "var(--hq-text)" };

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

  return (
    <div className="p-5 space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-xl" style={{ color: "var(--hq-text)" }}>
            Fuel &amp; Expenses
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--hq-text-dim)" }}>
            Log and monitor fleet fuel consumption and other expenses.
          </p>
        </div>
      </div>

      {error && (
        <div className="text-sm px-3 py-2 border font-mono-hq" style={{ color: "#ff4757", borderColor: "#ff475755", background: "#ff475714" }}>
          {error}
        </div>
      )}

      {canAdd && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fuel Log Form */}
          <div className="hq-panel p-4">
            <h2 className="font-display font-semibold text-sm uppercase tracking-wider mb-4" style={{ color: "var(--hq-text)" }}>
              Log Fuel
            </h2>
            <form onSubmit={handleFuelSubmit} className="space-y-3">
              {fuelError && (
                <div className="text-sm px-3 py-2 border font-mono-hq" style={{ color: "#ff4757", borderColor: "#ff475755", background: "#ff475714" }}>
                  {fuelError}
                </div>
              )}
              <div>
                <label className={labelCls} style={{ color: "var(--hq-text-dim)" }}>Vehicle</label>
                <select required value={fuelForm.vehicle_id} onChange={(e) => setFuelForm({ ...fuelForm, vehicle_id: e.target.value })} className={inputCls} style={inputStyle}>
                  <option value="">-- Choose Vehicle --</option>
                  {activeVehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.name} ({v.reg_number})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} style={{ color: "var(--hq-text-dim)" }}>Liters</label>
                  <input type="number" step="any" required value={fuelForm.liters} onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })} className={inputCls} style={inputStyle} placeholder="0" />
                </div>
                <div>
                  <label className={labelCls} style={{ color: "var(--hq-text-dim)" }}>Cost (₹)</label>
                  <input type="number" step="any" required value={fuelForm.cost} onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })} className={inputCls} style={inputStyle} placeholder="0" />
                </div>
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--hq-text-dim)" }}>Date</label>
                <input type="date" required value={fuelForm.date} onChange={(e) => setFuelForm({ ...fuelForm, date: e.target.value })} className={inputCls} style={inputStyle} />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={fuelSubmitting}
                  className="w-full px-4 py-2 text-sm font-display font-semibold tracking-wide transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: "var(--hq-amber)", color: "#0a0b0d" }}
                >
                  {fuelSubmitting ? "SAVING…" : "SUBMIT FUEL LOG"}
                </button>
              </div>
            </form>
          </div>

          {/* Expense Form */}
          <div className="hq-panel p-4">
            <h2 className="font-display font-semibold text-sm uppercase tracking-wider mb-4" style={{ color: "var(--hq-text)" }}>
              Log Expense
            </h2>
            <form onSubmit={handleExpenseSubmit} className="space-y-3">
              {expenseError && (
                <div className="text-sm px-3 py-2 border font-mono-hq" style={{ color: "#ff4757", borderColor: "#ff475755", background: "#ff475714" }}>
                  {expenseError}
                </div>
              )}
              <div>
                <label className={labelCls} style={{ color: "var(--hq-text-dim)" }}>Vehicle</label>
                <select required value={expenseForm.vehicle_id} onChange={(e) => setExpenseForm({ ...expenseForm, vehicle_id: e.target.value })} className={inputCls} style={inputStyle}>
                  <option value="">-- Choose Vehicle --</option>
                  {activeVehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.name} ({v.reg_number})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} style={{ color: "var(--hq-text-dim)" }}>Type</label>
                  <select required value={expenseForm.type} onChange={(e) => setExpenseForm({ ...expenseForm, type: e.target.value })} className={inputCls} style={inputStyle}>
                    <option value="toll">Toll</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls} style={{ color: "var(--hq-text-dim)" }}>Amount (₹)</label>
                  <input type="number" step="any" required value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} className={inputCls} style={inputStyle} placeholder="0" />
                </div>
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--hq-text-dim)" }}>Date</label>
                <input type="date" required value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} className={inputCls} style={inputStyle} />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={expenseSubmitting}
                  className="w-full px-4 py-2 text-sm font-display font-semibold tracking-wide transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: "var(--hq-amber)", color: "#0a0b0d" }}
                >
                  {expenseSubmitting ? "SAVING…" : "SUBMIT EXPENSE LOG"}
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
            <h2 className="font-display font-semibold text-sm uppercase tracking-wider" style={{ color: "var(--hq-text)" }}>
              Fuel History
            </h2>
            <select
              value={fuelVehicleFilter}
              onChange={(e) => setFuelVehicleFilter(e.target.value)}
              className="hq-glow text-sm px-3 py-1.5 border outline-none font-mono-hq"
              style={inputStyle}
            >
              <option value="All">All Vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.name} ({v.reg_number})</option>
              ))}
            </select>
          </div>
          <div className="hq-panel overflow-hidden">
            {loading ? (
              <div className="p-4 text-center text-sm font-mono-hq" style={{ color: "var(--hq-text-dim)" }}>Loading…</div>
            ) : (
              <DataTable columns={fuelColumns} rows={filteredFuelLogs} />
            )}
          </div>
        </div>

        {/* Expenses Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-sm uppercase tracking-wider" style={{ color: "var(--hq-text)" }}>
              Expense History
            </h2>
            <select
              value={expenseVehicleFilter}
              onChange={(e) => setExpenseVehicleFilter(e.target.value)}
              className="hq-glow text-sm px-3 py-1.5 border outline-none font-mono-hq"
              style={inputStyle}
            >
              <option value="All">All Vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.name} ({v.reg_number})</option>
              ))}
            </select>
          </div>
          <div className="hq-panel overflow-hidden">
            {loading ? (
              <div className="p-4 text-center text-sm font-mono-hq" style={{ color: "var(--hq-text-dim)" }}>Loading…</div>
            ) : (
              <DataTable columns={expenseColumns} rows={filteredExpenses} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
