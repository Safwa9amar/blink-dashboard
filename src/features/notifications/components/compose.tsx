"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import {
  Card,
  Button,
  Badge,
  FormRow,
  Segmented,
  RoleChips,
  LangTabs,
  DashIcon,
  Avatar,
  AIGenerateModal,
  EnhanceButton,
  fInput,
  dirFor,
  toggleInList,
  type Lang,
  type AIStreamChunk,
} from "@/components/ui";
import { CHANNELS, NTYPES, NTYPE_KEYS, N_ROLES, REACH_BASE, type TFn } from "../data";
import { normalizeNotifDraft, type NotifDraft } from "../ai";
import { useNotificationsStore } from "../store";
import type { ComposeDraft } from "../types";
import { sendCampaign, scheduleCampaign, searchUsers, type UserHit } from "@/app/d/notifications/action";
import { parseDraftJSON } from "@/lib/ai/parse";
import { useAISettingsStore, activeBaseUrl } from "@/features/settings";
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

// A notifications AI endpoint, on whichever surface we're rendered on (the bare
// /d/… dev URL already includes the prefix; the dashboard subdomain rewrites
// /notifications/* → /d/notifications/*).
function aiUrl(path: string): string {
  const p = typeof window !== "undefined" ? window.location.pathname : "";
  const onD = p === "/d" || p.startsWith("/d/");
  return onD ? `/d/notifications/${path}` : `/notifications/${path}`;
}

// Reads an NDJSON token stream ({type:"reasoning"|"content"|"done"|"error"}),
// forwarding reasoning/content via the callbacks. Returns the joined content.
async function readAIStream(
  res: Response,
  onContent: (text: string) => void,
  onReasoning?: (text: string) => void
): Promise<string> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  let streamError: string | null = null;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      const msg = JSON.parse(line) as { type: string; text?: string; message?: string };
      if (msg.type === "reasoning") onReasoning?.(msg.text ?? "");
      else if (msg.type === "content") {
        content += msg.text ?? "";
        onContent(msg.text ?? "");
      } else if (msg.type === "error") streamError = msg.message ?? "Generation failed";
    }
  }
  if (streamError) throw new Error(streamError);
  return content;
}

interface ComposeForm {
  chans: string[];
  ntype: string;
  title: { en: string; fr: string; ar: string };
  msg: { en: string; fr: string; ar: string };
  target: "roles" | "user";
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
      target: "roles",
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
  const target = watch("target");
  const roles = watch("roles");
  const seg = watch("seg");
  const when = watch("when");
  const link = watch("link");

  // "Specific user" targeting: a debounced search over the users table + the
  // currently picked recipient.
  const [picked, setPicked] = useState<UserHit | null>(null);
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<UserHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [userErr, setUserErr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Load matches while the dropdown is open — an empty query lists recent users
  // so it works as a browse-or-search combobox. Debounced.
  useEffect(() => {
    if (target !== "user" || picked || !open) return;
    setSearching(true);
    const h = setTimeout(async () => {
      const hits = await searchUsers(userQuery);
      setUserResults(hits);
      setSearching(false);
    }, 250);
    return () => clearTimeout(h);
  }, [userQuery, target, picked, open]);

  // Close the dropdown on an outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const [aiOpen, setAiOpen] = useState(false);

  // Streams a trilingual notification draft from the AI route, returning the
  // parsed result (the modal previews it; applyDraft commits it). Reports tokens
  // for the live view; throws on failure so the modal surfaces the message.
  async function aiGenerate(
    topic: string,
    report: (chunk: AIStreamChunk) => void,
    signal: AbortSignal
  ): Promise<NotifDraft> {
    const ai = useAISettingsStore.getState();
    const res = await fetch(aiUrl("ai-draft"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        topic,
        type: ntype,
        audience: roles,
        baseUrl: activeBaseUrl(ai),
        model: ai.model,
        temperature: ai.temperature,
        maxTokens: ai.maxTokens,
        ttl: ai.ttl,
      }),
    });
    if (!res.ok || !res.body) {
      const detail = await res.json().catch(() => null);
      throw new Error(detail?.error ?? `Generation failed (${res.status}).`);
    }

    const streamed = await readAIStream(
      res,
      (text) => report({ content: text }),
      (text) => report({ reasoning: text })
    );
    return normalizeNotifDraft(parseDraftJSON(streamed));
  }

  // Inline "enhance" buttons: rewrite the active language's title/message in
  // place, streaming the improved copy straight into the field. `enhancing`
  // tracks which field is busy (so only that button shows a spinner).
  const [enhancing, setEnhancing] = useState<null | "title" | "msg">(null);

  async function enhance(field: "title" | "msg") {
    if (enhancing) return;
    const current = (field === "title" ? title : msg)[lang]?.trim();
    if (!current) return;
    setEnhancing(field);
    const ai = useAISettingsStore.getState();
    try {
      const res = await fetch(aiUrl("ai-enhance"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: current,
          field: field === "title" ? "title" : "message",
          lang,
          type: ntype,
          audience: roles,
          baseUrl: activeBaseUrl(ai),
          model: ai.model,
          temperature: ai.temperature,
          maxTokens: ai.maxTokens,
          ttl: ai.ttl,
        }),
      });
      if (!res.ok || !res.body) {
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.error ?? `Enhancement failed (${res.status}).`);
      }
      // Clear the field, then stream the improved copy into it live.
      let out = "";
      setValue(`${field}.${lang}`, "", { shouldDirty: true });
      await readAIStream(res, (text) => {
        out += text;
        setValue(`${field}.${lang}`, out, { shouldDirty: true });
      });
      // Restore the original if the model returned nothing.
      if (!out.trim()) setValue(`${field}.${lang}`, current, { shouldDirty: true });
    } catch {
      setValue(`${field}.${lang}`, current, { shouldDirty: true });
    } finally {
      setEnhancing(null);
    }
  }

  // Commits a reviewed draft into the compose form (called from the modal's Apply).
  function applyDraft(draft: NotifDraft) {
    setValue("title", { en: draft.en.title, fr: draft.fr.title, ar: draft.ar.title }, { shouldDirty: true });
    setValue("msg", { en: draft.en.message, fr: draft.fr.message, ar: draft.ar.message }, { shouldDirty: true });
    if (draft.type && NTYPE_KEYS.includes(draft.type)) setValue("ntype", draft.type, { shouldDirty: true });
  }

  // Review preview shown in the AI modal — the trilingual title/message + type.
  function renderDraftPreview(draft: NotifDraft) {
    const langs: [Lang, string][] = [
      ["en", "EN"],
      ["fr", "FR"],
      ["ar", "AR"],
    ];
    return (
      <div className="space-y-2.5">
        {draft.type && NTYPES[draft.type] && (
          <Badge variant="info">{NTYPES[draft.type].label}</Badge>
        )}
        {langs.map(([l, lb]) => (
          <div key={l} className="border border-border rounded-xl p-3 bg-background" dir={dirFor(l)}>
            <div className="text-[10px] font-bold text-subtext mb-1">{lb}</div>
            <div className="text-sm font-semibold text-text">{draft[l].title || "—"}</div>
            <div className="text-xs text-subtext mt-0.5">{draft[l].message}</div>
          </div>
        ))}
      </div>
    );
  }

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
  // A single-user send always reaches exactly that one recipient.
  if (target === "user") reach = picked ? 1 : 0;

  // Single-user targeting only supports immediate delivery (the scheduled queue
  // resolves audience by role, not by user).
  const effWhen = target === "user" ? "now" : when;

  const c = NTYPES[ntype];

  const submit = (status: "draft" | "scheduled" | "sent") =>
    handleSubmit(async (data) => {
      const finalTitle = data.title.en || data.title.fr || data.title.ar;
      if (status !== "draft" && !finalTitle) {
        setError("title.en", { type: "required", message: t("c.title_required") });
        setLang("en");
        return;
      }
      if (status !== "draft" && data.target === "user" && !picked) {
        setUserErr(t("c.user_required"));
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
          userId: data.target === "user" ? picked?.id : undefined,
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
        audience:
          data.target === "user"
            ? picked?.name ?? "1 user"
            : data.roles.includes("All")
              ? "All"
              : data.roles[0],
        segment: data.target === "user" ? undefined : data.seg,
        body: data.msg.en || data.msg.fr || data.msg.ar || undefined,
        link: data.link,
        status,
        reach: realReach,
        date: status === "sent" ? td("send_now") : "—",
      });
      onCancel();
    });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
      <Card
        title={t("c.new")}
        description={t("c.new_desc")}
        action={
          <Button size="sm" variant="secondary" icon="sparkles" onClick={() => setAiOpen(true)}>
            {t("ai.title")}
          </Button>
        }
      >
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
          <div className="relative" dir={dirFor(lang)}>
            <input
              className={`${fInput} pe-10`}
              dir={dirFor(lang)}
              value={title[lang]}
              onChange={(e) => setValue(`title.${lang}`, e.target.value, { shouldDirty: true, shouldValidate: true })}
              placeholder={t("c.title_ph")}
            />
            <EnhanceButton
              busy={enhancing === "title"}
              disabled={!title[lang]?.trim() || enhancing !== null}
              label={t("c.enhance")}
              onClick={() => enhance("title")}
              className="top-1/2 -translate-y-1/2"
            />
          </div>
          {errors.title?.en && lang === "en" && (
            <p className="text-danger text-xs mt-1.5">{errors.title.en.message}</p>
          )}
        </FormRow>
        <FormRow label={t("c.message")}>
          <div className="relative" dir={dirFor(lang)}>
            <textarea
              className={`${fInput} min-h-[110px] resize-y pe-10`}
              dir={dirFor(lang)}
              value={msg[lang]}
              onChange={(e) => setValue(`msg.${lang}`, e.target.value, { shouldDirty: true })}
              placeholder={t("c.message_ph")}
            />
            <EnhanceButton
              busy={enhancing === "msg"}
              disabled={!msg[lang]?.trim() || enhancing !== null}
              label={t("c.enhance")}
              onClick={() => enhance("msg")}
              className="bottom-2.5"
            />
          </div>
        </FormRow>
        <FormRow label={t("c.target")} hint={t("c.target_hint")}>
          <Segmented
            options={[
              ["roles", t("c.target_roles_opt")],
              ["user", t("c.target_user_opt")],
            ]}
            value={target}
            onChange={(v) => setValue("target", v, { shouldDirty: true })}
          />
        </FormRow>
        {target === "roles" ? (
          <>
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
          </>
        ) : (
          <FormRow label={t("c.user")} hint={t("c.user_hint")}>
            {picked ? (
              <div className="flex items-center gap-3 border border-border rounded-xl px-3.5 py-2.5 bg-background">
                <Avatar name={picked.name} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-text truncate">{picked.name}</div>
                  <div className="text-xs text-subtext truncate">
                    {picked.email || picked.phone || picked.role}
                  </div>
                </div>
                <button
                  type="button"
                  className="text-xs font-semibold text-primary hover:underline shrink-0"
                  onClick={() => {
                    setPicked(null);
                    setUserQuery("");
                    setUserResults([]);
                  }}
                >
                  {t("c.user_change")}
                </button>
              </div>
            ) : (
              <div className="relative" ref={boxRef}>
                <div className="relative">
                  <input
                    className={`${fInput} pe-9`}
                    value={userQuery}
                    onFocus={() => setOpen(true)}
                    onChange={(e) => {
                      setUserQuery(e.target.value);
                      setUserErr(null);
                      setOpen(true);
                    }}
                    placeholder={t("c.user_search")}
                  />
                  <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-subtext"
                    aria-label={t("c.target_user_opt")}
                  >
                    <DashIcon name="chevron-up-down" className="w-4 h-4" />
                  </button>
                </div>
                {open && (
                  <div className="absolute z-20 inset-x-0 mt-1.5 border border-border rounded-xl overflow-hidden bg-card shadow-lg max-h-72 overflow-y-auto">
                    {searching ? (
                      <div className="px-3.5 py-3 text-xs text-subtext">{t("c.user_searching")}</div>
                    ) : userResults.length === 0 ? (
                      <div className="px-3.5 py-3 text-xs text-subtext">{t("c.user_none")}</div>
                    ) : (
                      <div className="divide-y divide-border">
                        {userResults.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setPicked(u);
                              setUserErr(null);
                              setOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-start hover:bg-card-hover transition-colors"
                          >
                            <Avatar name={u.name} />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-text truncate">{u.name}</div>
                              <div className="text-xs text-subtext truncate">
                                {u.email || u.phone || u.role}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {userErr && <p className="text-danger text-xs mt-1.5">{userErr}</p>}
          </FormRow>
        )}
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
            {target === "user" ? (
              <p className="text-xs text-subtext">{t("c.when_user")}</p>
            ) : (
              <>
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
              </>
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
            <Button type="button" icon="send" onClick={submit(effWhen === "schedule" ? "scheduled" : "sent")} className="flex-1">
              {effWhen === "schedule" ? td("schedule") : td("send")}
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

      <AIGenerateModal<NotifDraft>
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        title={t("ai.title")}
        description={t("ai.desc")}
        placeholder={t("ai.placeholder")}
        buttonLabel={t("ai.button")}
        applyLabel={t("ai.apply")}
        regenerateLabel={t("ai.regenerate")}
        stopLabel={t("ai.stop")}
        reasoningLabel={t("ai.thinking")}
        draftingLabel={t("ai.drafting")}
        onGenerate={aiGenerate}
        onApply={applyDraft}
        renderResult={renderDraftPreview}
      />
    </div>
  );
}
