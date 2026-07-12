// TICKET: Reports page
// - GET /reports/vehicle-costs -> table: reg_number, name, total_fuel_cost,
//   total_maintenance_cost, total_expenses, operational_cost, avg_fuel_efficiency, trip_count
// - "Download CSV" button -> GET /reports/vehicle-costs/csv
//   (window.open, or fetch as blob + create an <a download> link — it's a StreamingResponse
//   with Content-Disposition attachment, so a simple window.location/window.open works too)
export default function Reports() {
  return <div className="p-4 text-gray-500">Reports page — TODO</div>;
}
