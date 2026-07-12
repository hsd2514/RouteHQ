import { useEffect, useState } from "react";
import client from "../api/client";
import DataTable from "../components/shared/DataTable";

export default function Reports() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await client.get("/reports/vehicle-costs");
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDownloadCSV = async () => {
    try {
      const response = await client.get("/reports/vehicle-costs/csv", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "vehicle-costs.csv");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert("Failed to download CSV.");
    }
  };

  const columns = [
    { key: "reg_number", header: "Reg. Number" },
    { key: "name", header: "Name" },
    { key: "total_fuel_cost", header: "Fuel Cost", render: (row) => `₹${row.total_fuel_cost.toLocaleString()}` },
    { key: "total_maintenance_cost", header: "Maintenance Cost", render: (row) => `₹${row.total_maintenance_cost.toLocaleString()}` },
    { key: "total_expenses", header: "Expenses", render: (row) => `₹${row.total_expenses.toLocaleString()}` },
    { key: "operational_cost", header: "Operational Cost", render: (row) => `₹${row.operational_cost.toLocaleString()}` },
    { key: "avg_fuel_efficiency", header: "Avg Fuel Efficiency", render: (row) => row.avg_fuel_efficiency ? `${row.avg_fuel_efficiency} km/l` : "N/A" },
    { key: "trip_count", header: "Trip Count" },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-display font-semibold text-gray-900 dark:text-gray-100">
            Reports & Analytics
          </h1>
          <p className="text-sm font-mono-hq text-gray-500 dark:text-gray-400" style={{ color: "var(--hq-text-dim)" }}>
            Overview of vehicle costs, trips, and performance.
          </p>
        </div>
        <button
          onClick={handleDownloadCSV}
          className="px-4 py-2 text-sm font-medium text-white transition-colors shadow-sm self-end rounded-md hover:opacity-90"
          style={{ backgroundColor: "var(--hq-amber)" }}
        >
          Download CSV
        </button>
      </div>

      {/* Main Grid/Table */}
      {loading ? (
        <div className="p-4 text-center font-mono-hq text-sm text-gray-500 dark:text-gray-400">
          Loading report data...
        </div>
      ) : error ? (
        <div className="p-4 text-red-500 border border-red-500/40 bg-red-500/10 rounded-md font-mono-hq text-sm">
          {error}
        </div>
      ) : (
        <div className="hq-panel overflow-hidden shadow-sm font-mono-hq text-sm">
          <DataTable columns={columns} rows={data} />
        </div>
      )}
    </div>
  );
}
