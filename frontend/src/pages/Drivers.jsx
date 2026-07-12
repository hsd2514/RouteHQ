// TICKET: Drivers page
// - Fetch GET /drivers on mount
// - Render with <DataTable/>: name, license_number, license_category, license_expiry
//   (red badge if expiry < today), contact_number, safety_score, status (<StatusBadge/>)
// - Search box + status filter dropdown (client-side)
// - "+ Add Driver" modal -> POST /drivers (fleet_manager, safety_officer only)
// - Suspend/Reactivate button per row -> PATCH /drivers/{id} { status } (fleet_manager, safety_officer only)
// - Show backend error `detail` on failed submit (e.g. duplicate license_number)
export default function Drivers() {
  return <div className="p-4 text-gray-500">Drivers page — TODO</div>;
}
