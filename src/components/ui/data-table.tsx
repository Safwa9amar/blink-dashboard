"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { DashIcon } from "./icons";

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  /** Custom header content (overrides `label` for rendering) — e.g. a select-all checkbox. */
  header?: ReactNode;
  /** Extra classes for the cell. `tdClass` is a legacy alias of `className`. */
  className?: string;
  tdClass?: string;
  /** Override sort behaviour. Defaults to sortable when `key` maps to a real data field. */
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[] | null;
  error?: string | null;
  /** `empty` is a legacy alias of `emptyMessage`. */
  empty?: string;
  emptyMessage?: string;
  keyField?: string;
  pageSize?: number;
  enableSorting?: boolean;
  enablePagination?: boolean;
}

const PAGE_SIZES = [10, 25, 50];

export function DataTable<T>({
  columns,
  data,
  error,
  empty,
  emptyMessage,
  keyField = "id",
  pageSize = 10,
  enableSorting = true,
  enablePagination = true,
}: DataTableProps<T>) {
  const t = useTranslations("common");
  const [sorting, setSorting] = useState<SortingState>([]);

  const rows = data ?? [];
  const emptyText = empty ?? emptyMessage ?? t("no_data");
  const get = (row: T, key: string) => (row as Record<string, unknown>)?.[key];

  const columnDefs: ColumnDef<T>[] = columns.map((col) => {
    const backedByField = rows.some((r) => r && typeof r === "object" && col.key in (r as object));
    return {
      id: col.key,
      accessorFn: (row) => get(row, col.key),
      // TanStack's header accepts string | render-fn; wrap a custom ReactNode in a thunk.
      header: col.header != null ? () => col.header : col.label,
      enableSorting: enableSorting && (col.sortable ?? backedByField),
      cell: ({ row }) =>
        col.render ? col.render(row.original) : ((get(row.original, col.key) as ReactNode) ?? "—"),
    };
  });

  const table = useReactTable({
    data: rows,
    columns: columnDefs,
    state: { sorting },
    onSortingChange: setSorting,
    enableSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(enablePagination ? { getPaginationRowModel: getPaginationRowModel() } : {}),
    initialState: enablePagination ? { pagination: { pageSize } } : {},
    getRowId: (row, i) => String(get(row, keyField) ?? i),
  });

  const showPagination = enablePagination && !error && rows.length > Math.min(...PAGE_SIZES);
  const { pageIndex, pageSize: activePageSize } = table.getState().pagination;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-start">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-border">
                {hg.headers.map((header) => {
                  const col = columns.find((c) => c.key === header.column.id);
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const headLabel = flexRender(header.column.columnDef.header, header.getContext());
                  return (
                    <th
                      key={header.id}
                      className={`px-6 py-3.5 text-start text-[11px] font-semibold text-subtext uppercase tracking-wider ${col?.className ?? col?.tdClass ?? ""}`}
                    >
                      {canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-text transition-colors cursor-pointer select-none"
                        >
                          {headLabel}
                          <DashIcon
                            name={sorted === "asc" ? "chevron-up" : sorted === "desc" ? "chevron-down" : "chevron-up-down"}
                            className={`w-3 h-3 ${sorted ? "text-primary" : "opacity-40"}`}
                          />
                        </button>
                      ) : (
                        headLabel
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {error ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-danger">
                  {error}
                </td>
              </tr>
            ) : !rows.length ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-subtext">
                  {emptyText}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="text-text hover:bg-card-hover transition-colors">
                  {row.getVisibleCells().map((cell) => {
                    const col = columns.find((c) => c.key === cell.column.id);
                    return (
                      <td key={cell.id} className={`px-6 py-3.5 ${col?.tdClass ?? col?.className ?? ""}`}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div className="flex items-center justify-between gap-4 px-6 py-3 border-t border-border text-[13px] text-subtext">
          <label className="flex items-center gap-2">
            <span>{t("rows_per_page")}</span>
            <select
              value={activePageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="bg-background border border-border rounded-lg px-2 py-1 text-text outline-none focus:border-primary cursor-pointer"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-3">
            <span className="tabular-nums">
              {t("page_of", { page: pageIndex + 1, pages: table.getPageCount() })}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label={t("prev_page")}
                className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-border text-text hover:bg-card-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <DashIcon name="chevron-left" className="w-4 h-4 rtl:-scale-x-100" />
              </button>
              <button
                type="button"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label={t("next_page")}
                className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-border text-text hover:bg-card-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <DashIcon name="chevron-right" className="w-4 h-4 rtl:-scale-x-100" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
