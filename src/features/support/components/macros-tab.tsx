"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { SearchBox, Button, Card, Badge, Modal, FormRow, Segmented, fInput, EmptyState, type Variant } from "@/components/ui";
import { formatDay } from "@/features/promotions";
import { createMacro, updateMacro, deleteMacro } from "@/app/d/support/macros-action";
import {
  MACRO_BODY_MAX,
  MACRO_LOCALES,
  MACRO_ROLES,
  MACRO_TITLE_MAX,
  searchMacros,
  type MacroRow,
} from "../macros";
import type { TFn } from "../types";

const ROLE_VAR: Record<string, Variant> = { customer: "info", rider: "success", merchant: "primary", agent: "warning" };

const ANY = "any";
type Opt = string; // "any" | locale | role

function MacroForm({
  t,
  initial,
  onClose,
  onSaved,
}: {
  t: TFn;
  initial: MacroRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [locale, setLocale] = useState<Opt>(initial?.locale ?? ANY);
  const [role, setRole] = useState<Opt>(initial?.target_role ?? ANY);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const errText = (code: string) =>
    code === "migration_pending"
      ? t("mac.migration")
      : code.startsWith("invalid_")
        ? t(`mac.err_${code.slice(8)}`)
        : code;

  async function save() {
    setBusy(true);
    setErr(null);
    const input = {
      title,
      body,
      locale: locale === ANY ? null : locale,
      target_role: role === ANY ? null : role,
    };
    const res = initial ? await updateMacro(initial.id, input) : await createMacro(input);
    setBusy(false);
    if (res.error) return setErr(errText(res.error));
    onSaved();
  }

  return (
    <>
      <FormRow label={t("mac.f_title")}>
        <input
          className={fInput}
          dir="auto"
          value={title}
          maxLength={MACRO_TITLE_MAX}
          onChange={(e) => setTitle(e.target.value)}
        />
      </FormRow>
      <FormRow label={t("mac.f_body")} hint={t("mac.f_body_hint")}>
        <textarea
          className={`${fInput} min-h-[130px] resize-y`}
          dir="auto"
          value={body}
          maxLength={MACRO_BODY_MAX}
          onChange={(e) => setBody(e.target.value)}
        />
      </FormRow>
      <FormRow label={t("mac.f_locale")}>
        <Segmented<Opt>
          options={[[ANY, t("mac.any")], ...MACRO_LOCALES.map((l) => [l, l.toUpperCase()] as [Opt, string])]}
          value={locale}
          onChange={setLocale}
        />
      </FormRow>
      <FormRow label={t("mac.f_role")}>
        <div className="overflow-x-auto">
          <Segmented<Opt>
            options={[[ANY, t("mac.any")], ...MACRO_ROLES.map((r) => [r, t(`mac.role_${r}`)] as [Opt, string])]}
            value={role}
            onChange={setRole}
          />
        </div>
      </FormRow>
      {err && <p className="text-[12.5px] text-danger mb-3">{err}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          {t("mac.cancel")}
        </Button>
        <Button onClick={save} loading={busy} disabled={!title.trim() || !body.trim()}>
          {t("mac.save")}
        </Button>
      </div>
    </>
  );
}

export function MacrosTab({
  t,
  macros,
  migrationPending = false,
  error,
}: {
  t: TFn;
  macros: MacroRow[];
  migrationPending?: boolean;
  error?: string;
}) {
  const router = useRouter();
  const locale = useLocale();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<MacroRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<MacroRow | null>(null);
  const [delBusy, setDelBusy] = useState(false);
  const [delErr, setDelErr] = useState<string | null>(null);

  const rows = useMemo(() => searchMacros(macros, q), [macros, q]);

  async function confirmDelete() {
    if (!deleting) return;
    setDelBusy(true);
    setDelErr(null);
    const res = await deleteMacro(deleting.id);
    setDelBusy(false);
    if (res.error) return setDelErr(res.error);
    setDeleting(null);
    router.refresh();
  }

  if (migrationPending) {
    return (
      <Card>
        <EmptyState title={t("mac.migration_title")} description={t("mac.migration")} />
      </Card>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-[18px]">
        <SearchBox placeholder={t("mac.search")} value={q} onChange={setQ} />
        <Button icon="plus" className="ms-auto" onClick={() => setEditing("new")}>
          {t("mac.new")}
        </Button>
      </div>
      {error && <p className="mb-3 text-[13px] text-danger">{error}</p>}
      <Card title={t("mac.title")} description={t("mac.desc")}>
        {rows.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-subtext">{macros.length ? t("mac.no_match") : t("mac.empty")}</p>
        ) : (
          rows.map((m) => (
            <div key={m.id} className="flex flex-wrap gap-3.5 items-start py-3.5 border-t border-border first:border-t-0">
              <div className="flex-1 min-w-[220px]">
                <div className="flex flex-wrap items-center gap-1.5">
                  <b className="text-sm font-bold text-text" dir="auto">
                    {m.title}
                  </b>
                  <Badge variant="default">{m.locale ? m.locale.toUpperCase() : t("mac.any_lang")}</Badge>
                  <Badge variant={m.target_role ? ROLE_VAR[m.target_role] : "default"}>
                    {m.target_role ? t(`mac.role_${m.target_role}`) : t("mac.any_role")}
                  </Badge>
                </div>
                <p className="text-[12.5px] text-subtext mt-1 leading-normal whitespace-pre-wrap" dir="auto">
                  {m.body}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11.5px] text-subtext whitespace-nowrap">
                  {t("mac.used", { n: m.uses.toLocaleString(locale) })} · {formatDay(m.updated_at, locale)}
                </span>
                <Button size="xs" variant="secondary" icon="pencil" onClick={() => setEditing(m)} aria-label={t("mac.edit")} />
                <Button size="xs" variant="ghost" icon="trash" onClick={() => setDeleting(m)} aria-label={t("mac.delete")} />
              </div>
            </div>
          ))
        )}
      </Card>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? t("mac.new") : t("mac.edit")}
        widthClassName="max-w-lg"
      >
        {editing !== null && (
          <MacroForm
            t={t}
            initial={editing === "new" ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              router.refresh();
            }}
          />
        )}
      </Modal>

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title={t("mac.delete")}>
        <p className="text-[13px] text-subtext mb-4" dir="auto">
          {t("mac.delete_confirm", { title: deleting?.title ?? "" })}
        </p>
        {delErr && <p className="text-[12.5px] text-danger mb-3">{delErr}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)} disabled={delBusy}>
            {t("mac.cancel")}
          </Button>
          <Button variant="danger" onClick={confirmDelete} loading={delBusy}>
            {t("mac.delete")}
          </Button>
        </div>
      </Modal>
    </>
  );
}
