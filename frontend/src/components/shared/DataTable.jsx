export default function DataTable({ columns, rows, onRowClick }) {
  return (
    <table className="w-full text-sm text-left border-collapse">
      <thead>
        <tr style={{ borderBottom: "1px solid var(--hq-border)" }}>
          {columns.map((col) => (
            <th
              key={col.key}
              className="py-2.5 px-3 font-mono-hq text-[10px] uppercase tracking-[0.12em] font-medium"
              style={{ color: "var(--hq-text-dim)" }}
            >
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
            className={onRowClick ? "cursor-pointer transition-colors hover:bg-(--hq-panel-2)" : ""}
            style={{ borderBottom: "1px solid var(--hq-border)" }}
          >
            {columns.map((col) => (
              <td key={col.key} className="py-2.5 px-3 font-mono-hq text-[13px]" style={{ color: "var(--hq-text)" }}>
                {col.render ? col.render(row) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan={columns.length} className="py-8 text-center text-xs font-mono-hq" style={{ color: "var(--hq-text-dim)" }}>
              NO RECORDS
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
