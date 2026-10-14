"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Modal } from "@/components/ui";
import { grantStaffAccess, searchGrantCandidates } from "@/app/d/access/action";
import type { CandidateHit } from "@/features/access/types";
import type { StaffRole } from "../data";
import { ErrorBox, FIELD, LABEL, RoleSelect, useErrorText } from "./shared";

export function GrantAccessDialog({
  initialQuery = "",
  onClose,
  onDone,
}: {
  initialQuery?: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const t = useTranslations("access");
  const errorText = useErrorText();
  const [query, setQuery] = useState(initialQuery);
  const [hits, setHits] = useState<CandidateHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<CandidateHit | null>(null);
  const [role, setRole] = useState<StaffRole>("ops_admin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const q = query.trim();
  const searchable = q.length >= 2;

  // Debounced search (250 ms). State is only set from the timer callback.
  useEffect(() => {
    if (picked || !searchable) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchGrantCandidates(q);
        if (!cancelled) setHits(res);
      } catch {
        if (!cancelled) setHits([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q, searchable, picked]);

  async function submit() {
    if (!picked) return;
    setBusy(true);
    setError(null);
    const res = await grantStaffAccess(picked.id, role);
    setBusy(false);
    if (res.error) setError(errorText(res.error));
    else onDone();
  }

  return (
    <Modal open onClose={onClose} title={t("grant.title")}>
      <p className="text-sm text-subtext mb-4">{t("grant.desc")}</p>

      {picked ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2.5 mb-4">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-text truncate" dir="auto">
              {picked.name}
            </div>
            <div className="text-xs text-subtext truncate" dir="ltr">
              {picked.email}
            </div>
          </div>
          <Button variant="ghost" size="xs" onClick={() => setPicked(null)}>
            {t("grant.change_user")}
          </Button>
        </div>
      ) : (
        <div className="mb-4">
          <label htmlFor="ga-q" className={LABEL}>
            {t("grant.search_label")}
          </label>
          <input
            id="ga-q"
            autoFocus
            dir="auto"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("grant.search_ph")}
            className={FIELD}
          />
          <div className="mt-2 max-h-56 overflow-y-auto" aria-live="polite">
            {!searchable ? (
              <p className="text-xs text-subtext px-1 py-2">{t("grant.type_more")}</p>
            ) : searching ? (
              <p className="text-xs text-subtext px-1 py-2">{t("grant.searching")}</p>
            ) : hits.length === 0 ? (
              <p className="text-xs text-subtext px-1 py-2">{t("grant.no_results")}</p>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                {hits.map((h) => (
                  <li key={h.id}>
                    <button
                      type="button"
                      onClick={() => setPicked(h)}
                      className="w-full text-start px-3 py-2 hover:bg-card-hover cursor-pointer"
                    >
                      <div className="text-sm font-medium text-text" dir="auto">
                        {h.name}
                      </div>
                      <div className="text-xs text-subtext" dir="ltr">
                        {h.email}
                        {h.phone ? ` · ${h.phone}` : ""}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {picked && (
        <div>
          <label htmlFor="ga-role" className={LABEL}>
            {t("grant.role")}
          </label>
          <RoleSelect id="ga-role" value={role} onChange={setRole} />
        </div>
      )}

      {error && <ErrorBox>{error}</ErrorBox>}

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="secondary" size="sm" onClick={onClose} disabled={busy}>
          {t("cancel")}
        </Button>
        <Button size="sm" onClick={submit} loading={busy} disabled={!picked}>
          {busy ? t("grant.saving") : t("grant.submit")}
        </Button>
      </div>
    </Modal>
  );
}
