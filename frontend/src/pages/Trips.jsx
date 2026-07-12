// TICKET: Trips page (the most important one — read carefully)
// - Create form: source, destination, vehicle dropdown (GET /vehicles?status=available),
//   driver dropdown (GET /drivers?assignable=true), cargo_weight, planned_distance
//   -> POST /trips
// - Trips table (GET /trips): source -> destination, vehicle, driver, cargo_weight, status (<StatusBadge/>)
// - Per-row action buttons based on trip.status:
//     draft      -> "Dispatch" button -> POST /trips/{id}/dispatch
//     dispatched -> "Complete" button -> opens modal asking actual_distance, fuel_consumed,
//                   final_odometer -> POST /trips/{id}/complete
//     draft/dispatched -> "Cancel" button -> POST /trips/{id}/cancel
// - CRITICAL: on any 400 error, show err.response.data.detail verbatim as a red toast/alert.
//   These messages come straight from backend business rules (capacity exceeded, driver
//   license expired, vehicle not available, etc.) — do not reword them.
// - Re-fetch trips (and vehicle/driver dropdowns) after every action since statuses change.
export default function Trips() {
  return <div className="p-4 text-gray-500">Trips page — TODO</div>;
}
