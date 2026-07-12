export default function DataTable({ columns, rows, onRowClick }) {
  return (
    <table className="w-full text-sm text-left">
      <thead>
        <tr className="text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
          {columns.map((col) => (
            <th key={col.key} className="py-2 px-3 font-medium">
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr
            key={row.id ?? i}
            onClick={() => onRowClick?.(row)}
            className={`border-b border-gray-100 dark:border-gray-900 ${
              onRowClick ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900" : ""
            }`}
          >
            {columns.map((col) => (
              <td key={col.key} className="py-2 px-3 text-gray-700 dark:text-gray-300">
                {col.render ? col.render(row) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan={columns.length} className="py-6 text-center text-gray-400">
              No data
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
