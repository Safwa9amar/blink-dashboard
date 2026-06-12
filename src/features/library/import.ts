// Bulk-import parsing for the Library — reads CSV / Excel (.xlsx/.xls) / JSON in the
// browser and maps each row to a NewLibrary*Input (trilingual name/description,
// photos[], flexible/loose column headers). `xlsx` is dynamically imported so it
// only loads when an import is actually run.
import type {
  CategoryStatus,
  LibraryStatus,
  NewLibraryCategoryInput,
  NewLibraryProductInput,
} from "./types";

export interface ImportResult<T> {
  rows: T[];
  total: number; // rows found in the file
  skipped: number; // rows dropped (missing required English name)
}

type Row = Record<string, unknown>;

const PRODUCT_STATUSES = ["published", "draft", "archived"];
const CATEGORY_STATUSES = ["active", "inactive"];

// File → array of header-keyed row objects.
async function readRows(file: File): Promise<Row[]> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "json") {
    const data = JSON.parse(await file.text());
    if (Array.isArray(data)) return data as Row[];
    for (const k of ["items", "rows", "products", "categories", "data"]) {
      const v = (data as Row)?.[k];
      if (Array.isArray(v)) return v as Row[];
    }
    throw new Error("JSON must be an array of rows (or an object with an items/products/categories array).");
  }
  const XLSX = await import("xlsx");
  const wb =
    ext === "csv"
      ? XLSX.read(await file.text(), { type: "string" })
      : XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) throw new Error("The file has no sheets.");
  return XLSX.utils.sheet_to_json<Row>(sheet, { defval: "" });
}

// Lowercased, underscore-normalized scalar lookup over a row's keys.
function flat(row: Row): Record<string, string> {
  const o: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v == null || typeof v === "object") continue;
    o[k.trim().toLowerCase().replace(/\s+/g, "_")] = String(v).trim();
  }
  return o;
}
const pick = (o: Record<string, string>, ...keys: string[]) => {
  for (const k of keys) if (o[k]) return o[k];
  return "";
};

// Trilingual field from either a nested {en,fr,ar} object (JSON) or *_en/_fr/_ar columns.
function lang(row: Row, base: string, ...enAliases: string[]) {
  const nested = row[base];
  if (nested && typeof nested === "object") {
    const n = nested as Record<string, unknown>;
    return {
      en: String(n.en ?? n.english ?? "").trim(),
      fr: String(n.fr ?? "").trim(),
      ar: String(n.ar ?? "").trim(),
    };
  }
  const o = flat(row);
  return { en: pick(o, `${base}_en`, base, ...enAliases), fr: pick(o, `${base}_fr`), ar: pick(o, `${base}_ar`) };
}

export async function parseProductsFile(file: File): Promise<ImportResult<NewLibraryProductInput>> {
  const raw = await readRows(file);
  const rows: NewLibraryProductInput[] = [];
  for (const row of raw) {
    const name = lang(row, "name", "title");
    if (!name.en) continue;
    const o = flat(row);
    const statusRaw = pick(o, "status").toLowerCase();
    const status = (PRODUCT_STATUSES.includes(statusRaw) ? statusRaw : "draft") as LibraryStatus;
    const photoSrc = row.photos ?? row.images;
    const photos = (
      Array.isArray(photoSrc)
        ? photoSrc.map((s) => String(s).trim())
        : pick(o, "photos", "photo", "images", "image").split(/[\n,|;]+/).map((s) => s.trim())
    ).filter(Boolean);
    rows.push({
      name,
      description: lang(row, "description", "desc"),
      barcode: pick(o, "barcode", "ean", "sku"),
      brand: pick(o, "brand"),
      category: pick(o, "category", "category_en", "category_name"),
      unit: pick(o, "unit"),
      photos,
      status,
    });
  }
  return { rows, total: raw.length, skipped: raw.length - rows.length };
}

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export async function parseCategoriesFile(file: File): Promise<ImportResult<NewLibraryCategoryInput>> {
  const raw = await readRows(file);
  const rows: NewLibraryCategoryInput[] = [];
  for (const row of raw) {
    const name = lang(row, "name", "title");
    if (!name.en) continue;
    const o = flat(row);
    const statusRaw = pick(o, "status").toLowerCase();
    const status = (CATEGORY_STATUSES.includes(statusRaw) ? statusRaw : "active") as CategoryStatus;
    rows.push({
      name,
      slug: pick(o, "slug") || slugify(name.en),
      icon: pick(o, "icon") || "square.grid.2x2.fill",
      status,
      sortOrder: Number(pick(o, "sort_order", "sortorder", "order")) || 0,
    });
  }
  return { rows, total: raw.length, skipped: raw.length - rows.length };
}

// ─── Downloadable templates ──────────────────────────────────────────────────
// Flat rows for the CSV / Excel templates (one column per field). Photos use "|"
// to separate URLs (commas collide with CSV). Two filled-in sample rows.
const PRODUCT_TEMPLATE_ROWS = [
  {
    name_en: "Coca-Cola 1L", name_fr: "Coca-Cola 1L", name_ar: "كوكا كولا 1 لتر",
    description_en: "Carbonated soft drink", description_fr: "Boisson gazeuse", description_ar: "مشروب غازي",
    barcode: "6130001000017", brand: "Coca-Cola", category: "Drinks", unit: "1L Bottle",
    photos: "https://images.example.com/cola-front.jpg | https://images.example.com/cola-back.jpg",
    status: "published",
  },
  {
    name_en: "Pain Tradition", name_fr: "Pain Tradition", name_ar: "خبز تقليدي",
    description_en: "Traditional Algerian bread", description_fr: "Pain algérien traditionnel", description_ar: "خبز جزائري تقليدي",
    barcode: "6130002000016", brand: "Boulangerie Locale", category: "Food", unit: "piece",
    photos: "https://images.example.com/bread.jpg",
    status: "draft",
  },
];

const CATEGORY_TEMPLATE_ROWS = [
  { name_en: "Drinks", name_fr: "Boissons", name_ar: "مشروبات", slug: "drinks", icon: "cup.and.saucer.fill", status: "active", sort_order: 1 },
  { name_en: "Food", name_fr: "Alimentation", name_ar: "طعام", slug: "food", icon: "fork.knife", status: "active", sort_order: 2 },
];

// JSON templates use the richer nested shape (name/description objects, photos array).
const PRODUCT_TEMPLATE_JSON = PRODUCT_TEMPLATE_ROWS.map((r) => ({
  name: { en: r.name_en, fr: r.name_fr, ar: r.name_ar },
  description: { en: r.description_en, fr: r.description_fr, ar: r.description_ar },
  barcode: r.barcode, brand: r.brand, category: r.category, unit: r.unit,
  photos: r.photos.split("|").map((s) => s.trim()),
  status: r.status,
}));
const CATEGORY_TEMPLATE_JSON = CATEGORY_TEMPLATE_ROWS.map((r) => ({
  name: { en: r.name_en, fr: r.name_fr, ar: r.name_ar },
  slug: r.slug, icon: r.icon, status: r.status, sortOrder: r.sort_order,
}));

function saveBlob(data: BlobPart, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Generate + download a starter template the user can fill in and re-import.
export async function downloadTemplate(kind: "products" | "categories", format: "csv" | "xlsx" | "json") {
  const base = `blink-${kind}-template`;
  if (format === "json") {
    const data = kind === "products" ? PRODUCT_TEMPLATE_JSON : CATEGORY_TEMPLATE_JSON;
    saveBlob(JSON.stringify(data, null, 2), `${base}.json`, "application/json");
    return;
  }
  const rows = kind === "products" ? PRODUCT_TEMPLATE_ROWS : CATEGORY_TEMPLATE_ROWS;
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(rows);
  if (format === "csv") {
    // Prepend a UTF-8 BOM so Excel reads the Arabic columns correctly.
    saveBlob("﻿" + XLSX.utils.sheet_to_csv(ws), `${base}.csv`, "text/csv;charset=utf-8");
    return;
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, kind === "products" ? "Products" : "Categories");
  saveBlob(XLSX.write(wb, { type: "array", bookType: "xlsx" }), `${base}.xlsx`,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}
