import { useMemo, useState } from "react";

export default function DataTable({ columns, rows, onRowClick }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    const withValues = rows.map((row) => [row, row[sortKey]]);
    withValues.sort(([, a], [, b]) => {
      if (a == null && b == null) return 0;
      if (a == null) return 1;
      if (b == null) return -1;
      if (typeof a === "number" && typeof b === "number") return a - b;
      return String(a).localeCompare(String(b));
    });
    const sorted = withValues.map(([row]) => row);
    return sortDir === "asc" ? sorted : sorted.reverse();
  }, [rows, sortKey, sortDir]);

  function toggleSort(col) {
    if (col.sortable === false || col.key.startsWith("_")) return;
    if (sortKey === col.key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col.key);
      setSortDir("asc");
    }
  }

  return (
    <table className="w-full text-sm text-left border-collapse">
      <thead>
        <tr style={{ borderBottom: "1px solid var(--hq-border)" }}>
          {columns.map((col) => {
            const isSortable = col.sortable !== false && !col.key.startsWith("_");
            const isActive = sortKey === col.key;
            return (
              <th
                key={col.key}
                onClick={() => toggleSort(col)}
                className={`py-2.5 px-3 font-mono-hq text-[10px] uppercase tracking-[0.12em] font-medium select-none ${isSortable ? "cursor-pointer hover:opacity-70" : ""}`}
                style={{ color: isActive ? "var(--hq-amber)" : "var(--hq-text-dim)" }}
              >
                {col.header}
                {isSortable && isActive && (sortDir === "asc" ? " ▲" : " ▼")}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {sortedRows.map((row, i) => (
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
        {sortedRows.length === 0 && (
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
