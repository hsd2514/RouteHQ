// TICKET: Maintenance page
// - Create form: vehicle dropdown (GET /vehicles), issue_description, cost -> POST /maintenance
//   (fleet_manager only). Backend rejects if vehicle is on_trip — show detail message on error.
// - Table of logs (GET /maintenance): vehicle, issue_description, cost, status (<StatusBadge/>)
// - "Close" button on active rows -> POST /maintenance/{id}/close (fleet_manager only)
// - Re-fetch after create/close since vehicle status changes (in_shop <-> available)
export default function Maintenance() {
  return <div className="p-4 text-gray-500">Maintenance page — TODO</div>;
}
