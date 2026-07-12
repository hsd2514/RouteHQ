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
          <h1 className="font-display font-bold text-xl" style={{ color: "var(--hq-text)" }}>
            Reports &amp; Analytics
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--hq-text-dim)" }}>
            Overview of vehicle costs, trips, and performance.
          </p>
        </div>
        <button
          onClick={handleDownloadCSV}
          className="px-4 py-2 text-sm font-display font-semibold tracking-wide transition-opacity hover:opacity-90 self-end"
          style={{ background: "var(--hq-amber)", color: "#0a0b0d" }}
        >
          DOWNLOAD CSV
        </button>
      </div>

      {/* Main Grid/Table */}
      {loading ? (
        <div className="p-4 text-center text-sm font-mono-hq" style={{ color: "var(--hq-text-dim)" }}>
          Loading report data…
        </div>
      ) : error ? (
        <div className="text-sm px-3 py-2 border font-mono-hq" style={{ color: "#ff4757", borderColor: "#ff475755", background: "#ff475714" }}>
          {error}
        </div>
      ) : (
        <div className="hq-panel overflow-hidden">
          <DataTable columns={columns} rows={data} />
        </div>
      )}
    </div>
  );
}
