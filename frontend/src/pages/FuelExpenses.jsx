// TICKET: Fuel & Expenses page
// - Two simple forms (fleet_manager, financial_analyst, driver roles only):
//     Fuel log: vehicle dropdown, liters, cost, date -> POST /fuel-logs
//     Expense:  vehicle dropdown, type (toll/other), amount, date -> POST /expenses
// - Two tables below: GET /fuel-logs and GET /expenses, each filterable by vehicle
//   (use ?vehicle_id= query param, or filter client-side)
export default function FuelExpenses() {
  return (
    <div className="p-5 font-mono-hq text-xs uppercase tracking-widest" style={{ color: "var(--hq-text-dim)" }}>
      Fuel &amp; Expenses page — TODO
    </div>
  );
}
