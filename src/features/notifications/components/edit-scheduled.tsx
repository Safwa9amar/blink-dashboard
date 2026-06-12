"use client";

import { useState } from "react";
import {
  Modal,
  Button,
  FormRow,
  RoleChips,
  LangTabs,
  DashIcon,
  fInput,
  dirFor,
  toggleInList,
  type Lang,
} from "@/components/ui";
import { CHANNELS, NTYPES, NTYPE_KEYS, N_ROLES, type TFn } from "../data";
import type { ScheduledNotification } from "../types";
import { updateScheduled } from "@/app/d/notifications/action";

// ISO → a value the <input type="datetime-local"> expects (local "YYYY-MM-DDThh:mm").
function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

// Edit a still-pending scheduled broadcast. A focused, self-contained modal
// (not the full composer) — only the editable fields, saved via updateScheduled.
export function EditScheduled({
  t,
  row,
  onClose,
  onSaved,
}: {
  t: TFn;
  row: ScheduledNotification;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [lang, setLang] = useState<Lang>("en");
  const [ntype, setNtype] = useState(row.type);
  const [title, setTitle] = useState(row.titleByLang);
  const [msg, setMsg] = useState(row.msgByLang);
  const [roles, setRoles] = useState<string[]>(row.roles.length ? row.roles : ["All"]);
  const [chans, setChans] = useState<string[]>(row.channels.length ? row.channels : ["push"]);
  const [link, setLink] = useState(row.link);
  const [schedAt, setSchedAt] = useState(isoToLocalInput(row.scheduledAt));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleChan = (id: string) =>
    setChans((cur) =>
      cur.includes(id) ? (cur.length > 1 ? cur.filter((x) => x !== id) : cur) : [...cur, id]
    );

  const save = async () => {
    setError(null);
    const finalTitle = title.en || title.fr || title.ar;
    if (!finalTitle) {
      setError(t("c.title_required"));
      setLang("en");
      return;
    }
    if (!schedAt) {
      setError(t("c.sched_future"));
      return;
    }
    const d = new Date(schedAt);
    if (Number.isNaN(d.getTime()) || d.getTime() <= Date.now()) {
      setError(t("c.sched_future"));
      return;
    }
    setSaving(true);
    const res = await updateScheduled(row.id, {
      type: ntype,
      title,
      message: msg,
      roles,
      channels: chans,
      link: link?.trim() || undefined,
      scheduledAt: d.toISOString(),
    });
    setSaving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onSaved();
  };

  return (
    <Modal open onClose={onClose} title={t("edit_scheduled")}>
      <div className="max-h-[70vh] overflow-y-auto pe-1 space-y-1">
        <FormRow label={t("c.when")}>
          <input
            type="datetime-local"
            className={fInput}
            value={schedAt}
            onChange={(e) => setSchedAt(e.target.value)}
          />
        </FormRow>

        <FormRow label={t("c.type")}>
          <select className={fInput} value={ntype} onChange={(e) => setNtype(e.target.value)}>
            {NTYPE_KEYS.map((k) => (
              <option key={k} value={k}>
                {NTYPES[k].label}
              </option>
            ))}
          </select>
        </FormRow>

        <FormRow label={t("c.roles")}>
          <RoleChips
            roles={N_ROLES}
            selected={roles}
            onToggle={(r) => setRoles(toggleInList(roles, r))}
          />
        </FormRow>

        <FormRow label={t("c.channels")}>
          <div className="grid grid-cols-4 gap-2">
            {CHANNELS.map(([id, lb, ic]) => {
              const on = chans.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleChan(id)}
                  className={`flex flex-col gap-1 items-center py-2.5 px-1.5 border rounded-xl cursor-pointer transition-colors ${
                    on ? "border-soft-border bg-soft-pink text-primary" : "border-border bg-background text-subtext"
                  }`}
                >
                  <DashIcon name={ic} className="w-4 h-4" />
                  <span className="text-[11px] font-semibold">{lb}</span>
                </button>
              );
            })}
          </div>
        </FormRow>

        <FormRow label={t("c.lang")}>
          <LangTabs
            active={lang}
            onChange={setLang}
            filled={{ en: !!title.en, fr: !!title.fr, ar: !!title.ar }}
          />
        </FormRow>

        <FormRow label={t("c.title")}>
          <input
            className={fInput}
            dir={dirFor(lang)}
            value={title[lang]}
            onChange={(e) => setTitle({ ...title, [lang]: e.target.value })}
            placeholder={t("c.title_ph")}
          />
        </FormRow>

        <FormRow label={t("c.message")}>
          <textarea
            className={`${fInput} min-h-[90px] resize-y`}
            dir={dirFor(lang)}
            value={msg[lang]}
            onChange={(e) => setMsg({ ...msg, [lang]: e.target.value })}
            placeholder={t("c.message_ph")}
          />
        </FormRow>

        <FormRow label={t("c.deeplink")} className="!mb-0">
          <input
            className={fInput}
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="/(customer)/…"
          />
        </FormRow>

        {error && <p className="text-danger text-xs mt-2">{error}</p>}
      </div>

      <div className="flex gap-2.5 mt-4">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
          {t("cancel")}
        </Button>
        <Button type="button" icon="send" onClick={save} disabled={saving} className="flex-1">
          {t("save")}
        </Button>
      </div>
    </Modal>
  );
}
