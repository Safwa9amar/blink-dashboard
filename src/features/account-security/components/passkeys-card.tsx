"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button, Modal } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { recordPasskeyChange } from "@/app/d/settings/security/action";
import { isPasskeyDisabled, isUserCancel } from "../helpers";

type Passkey = { id: string; friendly_name?: string; created_at: string; last_used_at?: string };

export function PasskeysCard() {
  const t = useTranslations("accountSecurity.passkeys");
  const locale = useLocale();
  const [supabase] = useState(() => createClient());

  const [items, setItems] = useState<Passkey[] | null>(null);
  const [disabled, setDisabled] = useState(false);
  const [supported, setSupported] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [renaming, setRenaming] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [deleting, setDeleting] = useState<Passkey | null>(null);

  const load = useCallback(async () => {
    try {
      const { data, error: err } = await supabase.auth.passkey.list();
      if (err) {
        if (isPasskeyDisabled(err)) setDisabled(true);
        else setError(t("load_error"));
        setItems([]);
        return;
      }
      setItems(data ?? []);
    } catch {
      setError(t("load_error"));
      setItems([]);
    }
  }, [supabase, t]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setSupported(typeof window !== "undefined" && typeof window.PublicKeyCredential !== "undefined");
    void load();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [load]);

  async function add() {
    setNotice("");
    setError("");
    setBusy(true);
    try {
      const { error: err } = await supabase.auth.registerPasskey();
      if (err) {
        if (isPasskeyDisabled(err)) setDisabled(true);
        else if (!isUserCancel(err)) setError(t("error"));
      } else {
        await recordPasskeyChange("added");
        setNotice(t("added_toast"));
        await load();
      }
    } catch (e) {
      if (!isUserCancel(e)) setError(t("error"));
    }
    setBusy(false);
  }

  async function saveName(id: string) {
    const name = draft.trim().slice(0, 120);
    if (!name) return;
    setBusy(true);
    const { error: err } = await supabase.auth.passkey.update({ passkeyId: id, friendlyName: name });
    setBusy(false);
    if (err) {
      setError(t("error"));
      return;
    }
    setRenaming(null);
    await load();
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    const { error: err } = await supabase.auth.passkey.delete({ passkeyId: deleting.id });
    if (err) {
      setBusy(false);
      setDeleting(null);
      setError(t("error"));
      return;
    }
    await recordPasskeyChange("removed");
    setBusy(false);
    setDeleting(null);
    setNotice(t("deleted_toast"));
    await load();
  }

  const date = (iso: string) => new Date(iso).toLocaleDateString(locale, { dateStyle: "medium" });

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-text">{t("title")}</h3>
          <p className="text-sm text-subtext mt-1">{t("description")}</p>
        </div>
        {supported && !disabled && (
          <Button size="sm" loading={busy && !renaming && !deleting} onClick={add}>
            {busy && !renaming && !deleting ? t("adding") : t("add")}
          </Button>
        )}
      </div>

      {disabled && (
        <p className="mt-4 text-sm text-info bg-info-light rounded-xl px-4 py-3">{t("disabled_note")}</p>
      )}
      {!supported && !disabled && <p className="mt-4 text-sm text-subtext">{t("unsupported")}</p>}

      {!disabled && items && items.length === 0 && <p className="mt-4 text-sm text-subtext">{t("none")}</p>}
      {items && items.length > 0 && (
        <ul className="mt-4 divide-y divide-border border border-border rounded-xl">
          {items.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                {renaming === p.id ? (
                  <form
                    className="flex items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void saveName(p.id);
                    }}
                  >
                    <input
                      aria-label={t("name_label")}
                      value={draft}
                      maxLength={120}
                      autoFocus
                      onChange={(e) => setDraft(e.target.value)}
                      className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <Button type="submit" size="xs" loading={busy}>
                      {t("save")}
                    </Button>
                    <Button type="button" size="xs" variant="secondary" onClick={() => setRenaming(null)}>
                      {t("cancel")}
                    </Button>
                  </form>
                ) : (
                  <p className="text-sm font-medium text-text truncate">{p.friendly_name || t("unnamed")}</p>
                )}
                <p className="text-xs text-subtext mt-0.5">
                  {t("created", { date: date(p.created_at) })} ·{" "}
                  {p.last_used_at ? t("last_used", { date: date(p.last_used_at) }) : t("never_used")}
                </p>
              </div>
              {renaming !== p.id && (
                <div className="flex items-center gap-2">
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={() => {
                      setRenaming(p.id);
                      setDraft(p.friendly_name ?? "");
                    }}
                  >
                    {t("rename")}
                  </Button>
                  <Button size="xs" variant="danger" onClick={() => setDeleting(p)}>
                    {t("delete")}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {notice && <p className="mt-3 text-sm text-success">{notice}</p>}
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title={t("delete_title")}>
        <p className="text-sm text-subtext">
          {t("delete_body", { name: deleting?.friendly_name || t("unnamed") })}
        </p>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" size="sm" onClick={() => setDeleting(null)}>
            {t("cancel")}
          </Button>
          <Button variant="danger" size="sm" loading={busy} onClick={confirmDelete}>
            {t("confirm_delete")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
