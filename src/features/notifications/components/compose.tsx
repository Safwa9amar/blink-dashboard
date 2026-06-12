"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import {
  Card,
  Button,
  FormRow,
  Segmented,
  RoleChips,
  LangTabs,
  DashIcon,
  fInput,
  dirFor,
  toggleInList,
  type Lang,
} from "@/components/ui";
import { CHANNELS, NTYPES, NTYPE_KEYS, N_ROLES, REACH_BASE, type TFn } from "../data";
import { useNotificationsStore } from "../store";
import type { ComposeDraft } from "../types";
import { sendCampaign, scheduleCampaign } from "@/app/d/notifications/action";
import {
  DeepLinkField,
  useDeepLinksStore,
  parseDeepLink,
  missingParams,
  matchesAudience,
  isExternalUrl,
} from "@/features/deep-links";


// datetime-local value ("2026-06-12T14:30", local time) → a future UTC ISO
// string, or null if empty / unparseable / not in the future.
function parseSchedAt(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime()) || d.getTime() <= Date.now()) return null;
  return d.toISOString();
}

interface ComposeForm {
  chans: string[];
  ntype: string;
  title: { en: string; fr: string; ar: string };
  msg: { en: string; fr: string; ar: string };
  roles: string[];
  seg: string;
  link: string;
  when: "now" | "schedule";
  schedAt: string;
}

export function Compose({
  t,
  onCancel,
  initialDraft,
}: {
  t: TFn;
  onCancel: () => void;
  initialDraft?: ComposeDraft | null;
}) {
  const td = useTranslations("dash");
  const segments = useNotificationsStore((s) => s.segments);
  const createCampaign = useNotificationsStore((s) => s.createCampaign);
  const dlRoutes = useDeepLinksStore((s) => s.routes);
  const [lang, setLang] = useState<Lang>("en");

  const { register, handleSubmit, watch, setValue, setError, formState: { errors } } = useForm<ComposeForm>({
    defaultValues: {
      chans: ["push"],
      ntype: initialDraft?.type ?? "promo",
      title: { en: initialDraft?.title ?? "", fr: "", ar: "" },
      msg: { en: initialDraft?.body ?? "", fr: "", ar: "" },
      roles: ["All"],
      seg: segments[0]?.name ?? "Everyone",
      link: "",
      when: "now",
      schedAt: "",
    },
  });

  const chans = watch("chans");
  const ntype = watch("ntype");
  const title = watch("title");
  const msg = watch("msg");
  const roles = watch("roles");
  const seg = watch("seg");
  const when = watch("when");
  const link = watch("link");

  const toggleChan = (id: string) =>
    setValue("chans", chans.includes(id) ? (chans.length > 1 ? chans.filter((x) => x !== id) : chans) : [...chans, id], {
      shouldDirty: true,
    });

  let reach = roles.includes("All") ? REACH_BASE.All : roles.reduce((s, r) => s + (REACH_BASE[r] || 0), 0);
  const segMult: Record<string, number> = {
    "New users (7d)": 0.08,
    "Inactive (30d)": 0.22,
    "High spenders": 0.12,
    "By city: Algiers": 0.45,
    "Pending KYC": 0.05,
  };
  if (segMult[seg]) reach = Math.round(reach * segMult[seg]);

  const c = NTYPES[ntype];

  const submit = (status: "draft" | "scheduled" | "sent") =>
    handleSubmit(async (data) => {
      const finalTitle = data.title.en || data.title.fr || data.title.ar;
      if (status !== "draft" && !finalTitle) {
        setError("title.en", { type: "required", message: t("c.title_required") });
        setLang("en");
        return;
      }
      const url = data.link?.trim();
      if (status !== "draft" && url && !isExternalUrl(url)) {
        const miss = missingParams(url);
        if (miss.length) {
          setError("link", { message: t("c.link_params", { params: miss.join(", ") }) });
          return;
        }
        const parsed = parseDeepLink(url, dlRoutes);
        if (!parsed.valid) {
          setError("link", { message: t("c.link_unknown") });
          return;
        }
        if (!matchesAudience(parsed.route, data.roles)) {
          setError("link", { message: t("c.link_role") });
          return;
        }
      }

      // "Schedule" enqueues a DB row (scheduled_notifications); the blink-server
      // cron fires it at the chosen time via the same broadcast path as "Send".
      // No local store record — the queue is the source of truth and the
      // campaigns list reads it back server-side.
      if (status === "scheduled") {
        const iso = parseSchedAt(data.schedAt);
        if (!iso) {
          setError("schedAt", { message: t("c.sched_future") });
          return;
        }
        const res = await scheduleCampaign({
          type: data.ntype,
          title: data.title,
          message: data.msg,
          roles: data.roles,
          channels: data.chans,
          link: data.link?.trim() || undefined,
          scheduledAt: iso,
        });
        if (res.error) {
          setError("schedAt", { message: res.error });
          return;
        }
        onCancel();
        return;
      }

      // "Send" delivers for real: write one notification row per targeted user
      // (in-app) + an Expo push when the push channel is on. Draft stays a local
      // record only.
      let realReach = status === "draft" ? 0 : reach;
      if (status === "sent") {
        const res = await sendCampaign({
          type: data.ntype,
          title: data.title,
          message: data.msg,
          roles: data.roles,
          channels: data.chans,
          link: data.link?.trim() || undefined,
        });
        if (res.error) {
          setError("title.en", { message: res.error });
          setLang("en");
          return;
        }
        realReach = res.recipients;
      }

      createCampaign({
        title: finalTitle || t("c.preview_title"),
        type: data.ntype,
        chans: data.chans,
        audience: data.roles.includes("All") ? "All" : data.roles[0],
        segment: data.seg,
        body: data.msg.en || data.msg.fr || data.msg.ar || undefined,
        link: data.link,
        status,
        reach: realReach,
        date: status === "sent" ? td("send_now") : "—",
      });
      onCancel();
    });

  return (
    <form className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
      <Card title={t("c.new")} description={t("c.new_desc")}>
        <FormRow label={t("c.channels")} hint={t("c.channels_hint")}>
          <div className="grid grid-cols-4 gap-2.5">
            {CHANNELS.map(([id, lb, ic]) => {
              const on = chans.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleChan(id)}
                  className={`flex flex-col gap-1.5 items-center py-3.5 px-2 border rounded-xl cursor-pointer transition-colors ${
                    on ? "border-soft-border bg-soft-pink text-primary" : "border-border bg-background text-subtext"
                  }`}
                >
                  <DashIcon name={ic} className="w-5 h-5" />
                  <span className="text-xs font-semibold">{lb}</span>
                </button>
              );
            })}
          </div>
        </FormRow>
        <FormRow label={t("c.type")} hint={t("c.type_hint")}>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {NTYPE_KEYS.map((k) => {
              const on = ntype === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setValue("ntype", k, { shouldDirty: true })}
                  className={`flex flex-col items-center gap-1.5 py-3 px-1.5 border rounded-xl cursor-pointer transition-colors ${
                    on ? "border-primary bg-soft-pink" : "border-border bg-background hover:border-subtext"
                  }`}
                >
                  <span className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center" style={{ background: NTYPES[k].bg, color: NTYPES[k].color }}>
                    <DashIcon name={NTYPES[k].icon} className="w-4 h-4" />
                  </span>
                  <span className={`text-[11px] font-bold ${on ? "text-primary" : "text-subtext"}`}>{NTYPES[k].label}</span>
                </button>
              );
            })}
          </div>
        </FormRow>
        <FormRow label={t("c.lang")} hint={t("c.lang_hint")}>
          <LangTabs active={lang} onChange={setLang} filled={{ en: !!title.en, fr: !!title.fr, ar: !!title.ar }} />
        </FormRow>
        <FormRow label={t("c.title")}>
          <input
            className={fInput}
            dir={dirFor(lang)}
            value={title[lang]}
            onChange={(e) => setValue(`title.${lang}`, e.target.value, { shouldDirty: true, shouldValidate: true })}
            placeholder={t("c.title_ph")}
          />
          {errors.title?.en && lang === "en" && (
            <p className="text-danger text-xs mt-1.5">{errors.title.en.message}</p>
          )}
        </FormRow>
        <FormRow label={t("c.message")}>
          <textarea
            className={`${fInput} min-h-[110px] resize-y`}
            dir={dirFor(lang)}
            value={msg[lang]}
            onChange={(e) => setValue(`msg.${lang}`, e.target.value, { shouldDirty: true })}
            placeholder={t("c.message_ph")}
          />
        </FormRow>
        <FormRow label={t("c.roles")} hint={t("c.roles_hint")}>
          <RoleChips roles={N_ROLES} selected={roles} onToggle={(r) => setValue("roles", toggleInList(roles, r), { shouldDirty: true })} />
        </FormRow>
        <FormRow label={t("c.segment")}>
          <select className={fInput} {...register("seg")}>
            {segments.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </FormRow>
        <FormRow label={t("c.deeplink")} className="!mb-0">
          <DeepLinkField
            value={link}
            onChange={(v) => setValue("link", v, { shouldDirty: true })}
            audienceRoles={roles}
            error={errors.link?.message}
          />
        </FormRow>
      </Card>

      <div className="space-y-4">
        <Card title={t("c.delivery")}>
          <FormRow label={t("c.when")} className="!mb-0">
            <Segmented
              options={[
                ["now", td("send_now")],
                ["schedule", td("schedule")],
              ]}
              value={when}
              onChange={(v) => setValue("when", v, { shouldDirty: true })}
            />
            {when === "schedule" && (
              <div className="mt-2.5">
                <input type="datetime-local" className={fInput} {...register("schedAt")} />
                {errors.schedAt && (
                  <p className="text-danger text-xs mt-1.5">{errors.schedAt.message}</p>
                )}
              </div>
            )}
          </FormRow>
          <div className="flex items-center gap-3 bg-background border border-border rounded-xl px-4 py-3.5 mt-3.5">
            <div className="w-[38px] h-[38px] rounded-[11px] bg-soft-pink flex items-center justify-center">
              <DashIcon name="users" className="w-[19px] h-[19px] text-primary" />
            </div>
            <div>
              <div className="text-[22px] font-extrabold text-text">{reach.toLocaleString()}</div>
              <div className="text-[11.5px] text-subtext">
                {chans.length > 1 ? t("c.recipients_plural", { n: chans.length }) : t("c.recipients", { n: chans.length })}
              </div>
            </div>
          </div>
          <div className="flex gap-2.5 mt-4">
            <Button type="button" variant="secondary" onClick={submit("draft")} className="flex-1">
              {td("save_draft")}
            </Button>
            <Button type="button" icon="send" onClick={submit(when === "schedule" ? "scheduled" : "sent")} className="flex-1">
              {when === "schedule" ? td("schedule") : td("send")}
            </Button>
          </div>
        </Card>
        <Card title={t("c.preview")}>
          <div className="rounded-[20px] px-4 pt-10 pb-4" style={{ background: "linear-gradient(160deg,#2a2540,#15131f)" }}>
            <div className="text-center text-white font-light text-[34px] mb-3.5 opacity-95">9:41</div>
            <div className="rounded-[15px] px-3.5 py-3 flex gap-3 items-start backdrop-blur" style={{ background: "rgba(255,255,255,0.16)" }}>
              <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center shrink-0" style={{ background: c.bg }}>
                <DashIcon name={c.icon} className="w-[18px] h-[18px]" style={{ color: c.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-[10px] mb-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>
                  <span>BLINK · {c.label.toUpperCase()}</span>
                  <span>now</span>
                </div>
                <div className="text-[13px] font-bold text-white" dir={dirFor(lang)}>
                  {title[lang] || t("c.preview_title")}
                </div>
                <div className="text-xs mt-0.5 leading-snug" style={{ color: "rgba(255,255,255,0.85)" }} dir={dirFor(lang)}>
                  {msg[lang] || t("c.preview_msg")}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </form>
  );
}
