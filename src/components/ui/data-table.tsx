interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[] | null;
  error?: string | null;
  emptyMessage?: string;
  keyField?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  error,
  emptyMessage = "No data found.",
  keyField = "id",
}: DataTableProps<T>) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-3.5 text-xs font-semibold text-subtext uppercase tracking-wider ${col.className ?? ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {error ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-danger">
                  {error}
                </td>
              </tr>
            ) : !data?.length ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-subtext">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row[keyField] as string}
                  className="text-text hover:bg-card-hover transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-6 py-4 ${col.className ?? ""}`}>
                      {col.render ? col.render(row) : (row[col.key] as React.ReactNode) ?? "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
