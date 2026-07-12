import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/vehicles", label: "Fleet" },
  { to: "/drivers", label: "Drivers" },
  { to: "/trips", label: "Trips" },
  { to: "/maintenance", label: "Maintenance" },
  { to: "/fuel-expenses", label: "Fuel & Expenses" },
  { to: "/reports", label: "Analytics" },
];

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 flex flex-col gap-1">
      <div className="text-lg font-semibold px-2 py-3 text-gray-900 dark:text-gray-100">
        TransitOps
      </div>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `px-3 py-2 rounded-md text-sm ${
              isActive
                ? "bg-orange-500/10 text-orange-500 border border-orange-500/40"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900"
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </aside>
  );
}
