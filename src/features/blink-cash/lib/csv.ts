// CSV building for the Blink Cash exports. Pure. Cells that start with a formula
// trigger are prefixed with "'" so a spreadsheet never evaluates staff-visible text
// (names, memos, references); numbers are written raw.

export type CsvCell = string | number | boolean | null | undefined;
export interface CsvColumn<T> {
  header: string;
  value: (row: T) => CsvCell;
}

const FORMULA = /^[=+\-@\t\r]/;

export function csvCell(v: CsvCell): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "";
  let s = typeof v === "boolean" ? (v ? "true" : "false") : v;
  if (FORMULA.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv<T>(columns: CsvColumn<T>[], rows: T[]): string {
  const head = columns.map((c) => csvCell(c.header)).join(",");
  const body = rows.map((r) => columns.map((c) => csvCell(c.value(r))).join(","));
  return [head, ...body].join("\r\n") + "\r\n";
}

/** UTF-8 BOM so Excel opens Arabic / accented text correctly. */
export const CSV_BOM = "﻿";
