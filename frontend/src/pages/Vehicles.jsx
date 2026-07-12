// TICKET: Vehicles page
// - Fetch GET /vehicles on mount (client from ../api/client)
// - Render with <DataTable columns={...} rows={vehicles} onRowClick={...} />
//   columns: reg_number, name, type, max_load_capacity, odometer, status (use <StatusBadge/>), region
// - Add a search box (client-side filter on reg_number/name) + status filter dropdown
// - "+ Add Vehicle" button opens a <Modal> with a form -> POST /vehicles (fleet_manager only,
//   hide button otherwise using useAuth().user.role)
// - Row click opens a drawer/modal showing GET /vehicles/{id}/history (trips, maintenance, total cost)
// - Show backend error `detail` message on failed submit (e.g. duplicate reg_number)
export default function Vehicles() {
  return <div className="p-4 text-gray-500">Vehicles page — TODO</div>;
}
