"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button, Card, DashIcon, Modal, btnSecondary } from "@/components/ui";
import { fInput } from "@/components/ui/primitives";
import { pageCount, toQuery } from "../lib/filters";
import type { TFn } from "../types";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Shown when a table/column from the Full Blink Cash migration isn't in the database yet. */
export function MigrationNotice({ t }: { t: TFn }) {
  return (
    <div className="mb-4 rounded-xl border border-warning/30 bg-warning-light px-4 py-3 text-sm text-warning" role="status">
      {t("migration")}
    </div>
  );
}

export function LoadError({ t, error }: { t: TFn; error?: string }) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-xl bg-danger-light text-danger inline-flex items-center justify-center shrink-0">
          <DashIcon name="warn" className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-text">{t("load_error")}</p>
          <p className="text-sm text-subtext mt-1">{t("load_error_desc")}</p>
          {error && <p className="text-xs text-danger font-mono mt-2 break-all">{error}</p>}
        </div>
      </div>
    </Card>
  );
}

/** Prev / next for server-paginated lists; keeps every other query param. */
export function Pagination({
  base,
  query,
  page,
  total,
  size,
}: {
  base: string;
  query: Record<string, string | number | undefined | null>;
  page: number;
  total: number;
  size: number;
}) {
  const t = useTranslations("common");
  const pages = pageCount(total, size);
  if (total <= size) return null;
  const href = (p: number) => {
    const qs = toQuery({ ...query, page: p });
    return qs ? `${base}?${qs}` : base;
  };
  const from = (page - 1) * size + 1;
  const to = Math.min(page * size, total);
  const arrow = "w-8 h-8 inline-flex items-center justify-center rounded-lg border border-border text-text hover:bg-card-hover transition-colors";
  const off = "opacity-40 pointer-events-none";
  return (
    <div className="flex items-center justify-between gap-4 mt-3 text-[13px] text-subtext">
      <span className="tabular-nums">{t("rows_range", { from, to, total })}</span>
      <div className="flex items-center gap-2">
        <span className="tabular-nums">{t("page_of", { page, pages })}</span>
        <Link href={href(Math.max(1, page - 1))} aria-label={t("prev_page")} aria-disabled={page <= 1} className={`${arrow} ${page <= 1 ? off : ""}`}>
          <DashIcon name="chevron-left" className="w-4 h-4 rtl:-scale-x-100" />
        </Link>
        <Link href={href(Math.min(pages, page + 1))} aria-label={t("next_page")} aria-disabled={page >= pages} className={`${arrow} ${page >= pages ? off : ""}`}>
          <DashIcon name="chevron-right" className="w-4 h-4 rtl:-scale-x-100" />
        </Link>
      </div>
    </div>
  );
}

/** A download link (CSV route handler) styled as a secondary button. */
export function ExportLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} download className={btnSecondary}>
      <DashIcon name="download" className="w-4 h-4" />
      {label}
    </a>
  );
}

const labelCls = "block text-xs font-semibold text-text mb-1.5";

/** Labelled field wrapper used inside dialogs and drawers. */
export function Field({ label: l, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <label className={labelCls}>
        {l}
        {hint && <span className="text-[11.5px] text-subtext font-normal ms-2">{hint}</span>}
        <div className="mt-1.5 font-normal">{children}</div>
      </label>
      {error && (
        <p className="text-xs text-danger mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export interface DialogField {
  key: string;
  label: string;
  kind: "text" | "textarea" | "number" | "select";
  required?: boolean;
  placeholder?: string;
  initial?: string;
  hint?: string;
  options?: [string, string][];
  /** Rendered LTR (references, numbers). */
  ltr?: boolean;
}

function DialogBody({
  t,
  description,
  fields,
  confirmLabel,
  danger,
  onSubmit,
  onClose,
  extra,
}: {
  t: TFn;
  description?: string;
  fields: DialogField[];
  confirmLabel: string;
  danger?: boolean;
  onSubmit: (values: Record<string, string>) => Promise<ActionResult>;
  onClose: () => void;
  extra?: ReactNode;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.initial ?? f.options?.[0]?.[0] ?? ""]))
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const missing = fields.some((f) => f.required && !values[f.key]?.trim());

  function submit() {
    setError(null);
    start(async () => {
      const res = await onSubmit(values);
      if (res.ok) onClose();
      else setError(res.error);
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!missing && !pending) submit();
      }}
    >
      {description && <p className="text-[13px] text-subtext mb-4">{description}</p>}
      {extra}
      {fields.map((f) => (
        <Field key={f.key} label={f.label} hint={f.hint}>
          {f.kind === "textarea" ? (
            <textarea
              className={`${fInput} min-h-20`}
              dir="auto"
              value={values[f.key]}
              maxLength={500}
              placeholder={f.placeholder}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            />
          ) : f.kind === "select" ? (
            <select className={fInput} value={values[f.key]} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}>
              {f.options?.map(([val, lbl]) => (
                <option key={val} value={val}>
                  {lbl}
                </option>
              ))}
            </select>
          ) : (
            <input
              className={fInput}
              dir={f.ltr || f.kind === "number" ? "ltr" : "auto"}
              inputMode={f.kind === "number" ? "decimal" : undefined}
              value={values[f.key]}
              placeholder={f.placeholder}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            />
          )}
        </Field>
      ))}
      {error && (
        <p className="text-sm text-danger mb-3" role="alert">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2.5">
        <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
          {t("cancel")}
        </Button>
        <Button type="submit" variant={danger ? "danger" : "primary"} loading={pending} disabled={missing}>
          {confirmLabel}
        </Button>
      </div>
    </form>
  );
}

/**
 * A confirmation dialog with a few fields (reason / reference / amount…). The body only
 * mounts while open, so its inputs reset every time. `onSubmit` returns the server
 * action's result; success closes, failure shows the translated message inline.
 */
export function ActionDialog(props: {
  t: TFn;
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  fields: DialogField[];
  confirmLabel: string;
  danger?: boolean;
  extra?: ReactNode;
  onSubmit: (values: Record<string, string>) => Promise<ActionResult>;
}) {
  const { open, onClose, title, ...rest } = props;
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <DialogBody {...rest} onClose={onClose} />
    </Modal>
  );
}

/** A button that opens an ActionDialog. */
export function useDialog() {
  const [open, setOpen] = useState(false);
  return { open, show: () => setOpen(true), hide: () => setOpen(false) };
}
