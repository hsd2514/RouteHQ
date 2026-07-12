const ACCENTS = {
  blue: "border-blue-500",
  green: "border-green-500",
  orange: "border-orange-500",
  red: "border-red-500",
  gray: "border-gray-500",
};

export default function KpiCard({ label, value, accent = "gray" }) {
  return (
    <div
      className={`border-l-4 ${ACCENTS[accent]} border border-gray-200 dark:border-gray-800 rounded-md p-3 bg-white dark:bg-gray-900`}
    >
      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-1">
        {value}
      </div>
    </div>
  );
}
