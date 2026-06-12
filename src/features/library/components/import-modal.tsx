"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal, Button, DashIcon } from "@/components/ui";
import { parseProductsFile, parseCategoriesFile, downloadTemplate } from "../import";
import { importLibraryProducts, importLibraryCategories } from "@/app/d/library/action";
import type { NewLibraryCategoryInput, NewLibraryProductInput, TFn } from "../data";

// Accepted column headers, shown as a hint (language-neutral field names).
const COLUMNS = {
  products: "name_en · name_fr · name_ar · description_en/fr/ar · barcode · brand · category · unit · photos · status",
  categories: "name_en · name_fr · name_ar · slug · icon · status · sort_order",
};

export function ImportModal({
  t,
  kind,
  open,
  onClose,
}: {
  t: TFn;
  kind: "products" | "categories";
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, startTransition] = useTransition();
  const [parsing, setParsing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<{ rows: unknown[]; total: number; skipped: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const reset = () => {
    setErr(null);
    setParsed(null);
    setFileName("");
    setParsing(false);
  };
  const close = () => {
    reset();
    onClose();
  };

  const SUPPORTED = ["csv", "json", "xlsx", "xls"];

  async function handleFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!SUPPORTED.includes(ext)) {
      reset();
      setErr(t("import.bad_type"));
      return;
    }
    reset();
    setFileName(file.name);
    setParsing(true);
    try {
      const res = kind === "products" ? await parseProductsFile(file) : await parseCategoriesFile(file);
      setParsed(res);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Could not read the file.");
    } finally {
      setParsing(false);
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (parsing || importing) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function run() {
    if (!parsed?.rows.length) return;
    setErr(null);
    startTransition(async () => {
      const res =
        kind === "products"
          ? await importLibraryProducts(parsed.rows as NewLibraryProductInput[])
          : await importLibraryCategories(parsed.rows as NewLibraryCategoryInput[]);
      if (res.error) {
        setErr(res.error);
        return;
      }
      router.refresh();
      close();
    });
  }

  const names = parsed
    ? (parsed.rows as Array<{ name?: { en?: string } }>).slice(0, 4).map((r) => r.name?.en).filter(Boolean)
    : [];

  return (
    <Modal open={open} onClose={close} title={t(kind === "products" ? "import.title_products" : "import.title_categories")}>
      <p className="text-[13px] text-subtext mb-3">{t("import.desc")}</p>

      <div className="rounded-xl border border-border bg-background px-3 py-2.5 mb-3">
        <div className="text-[11px] font-semibold text-subtext uppercase tracking-wide mb-1">{t("import.columns")}</div>
        <div className="text-[11.5px] text-text font-mono break-words leading-relaxed">{COLUMNS[kind]}</div>
      </div>

      <div className="flex items-center gap-2.5 mb-4 text-[12px]">
        <span className="text-subtext">{t("import.template")}</span>
        {(["csv", "xlsx", "json"] as const).map((fmt) => (
          <button
            key={fmt}
            type="button"
            onClick={() => downloadTemplate(kind, fmt)}
            className="font-semibold text-primary hover:underline cursor-pointer"
          >
            {fmt === "xlsx" ? "Excel" : fmt.toUpperCase()}
          </button>
        ))}
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-disabled={parsing || importing}
        onClick={() => !parsing && !importing && fileRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!parsing && !importing) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`w-full rounded-xl border-2 border-dashed py-7 inline-flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${
          dragging
            ? "border-primary bg-soft-pink/60 text-primary"
            : "border-border hover:border-primary hover:bg-soft-pink/40 text-subtext hover:text-primary"
        } ${parsing || importing ? "opacity-60 pointer-events-none" : ""}`}
      >
        {parsing ? (
          <span className="w-6 h-6 rounded-full border-2 border-border border-t-primary animate-spin" />
        ) : (
          <DashIcon name="download" className="w-6 h-6" />
        )}
        <span className="text-sm font-semibold text-text">{fileName || t("import.choose")}</span>
        <span className="text-[11px]">{t("import.drop")}</span>
        <span className="text-[10.5px] opacity-70">CSV · XLSX · JSON</span>
      </div>

      {parsed && (
        <div className="mt-3 rounded-xl border border-border bg-background px-3.5 py-3 text-sm">
          <div className="font-semibold text-text">{t("import.ready", { count: parsed.rows.length })}</div>
          {parsed.skipped > 0 && (
            <div className="text-[12px] text-subtext mt-0.5">{t("import.skipped", { count: parsed.skipped })}</div>
          )}
          {names.length > 0 && (
            <div className="text-[12px] text-subtext mt-1 truncate">
              {names.join(" · ")}
              {parsed.rows.length > names.length ? " …" : ""}
            </div>
          )}
        </div>
      )}

      {err && <p className="text-danger text-sm mt-3">{err}</p>}

      <div className="flex gap-2.5 justify-end mt-5">
        <Button type="button" variant="secondary" onClick={close} disabled={importing}>
          {t("form.cancel")}
        </Button>
        <Button type="button" onClick={run} loading={importing} disabled={!parsed?.rows.length || parsing}>
          {t("import.run", { count: parsed?.rows.length ?? 0 })}
        </Button>
      </div>

      <input ref={fileRef} type="file" accept=".csv,.json,.xlsx,.xls" hidden onChange={onPick} />
    </Modal>
  );
}
