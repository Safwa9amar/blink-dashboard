"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Badge, Button, Modal, SearchBox, fInput } from "@/components/ui";
import { useDeepLinksStore, useHydrateDeepLinks } from "../store";
import {
  buildDeepLink,
  parseDeepLink,
  missingParams,
  matchesAudience,
  isExternalUrl,
  groupByRole,
  webUrlToDeepLink,
} from "../processing";
import type { DeepLinkRoute } from "../types";
import { ROLE_VARIANT } from "./deep-link-field";

// A standalone, one-shot picker for an in-app deep link (or external URL).
// Unlike DeepLinkField (a value/onChange input), this resolves a single choice:
// `onPick(href, label)` confirms (href "" removes a link); `onClose` cancels.
// Used to insert deep links into the rich-text editor body.
export function DeepLinkPickerModal({
  open,
  onClose,
  onPick,
  audienceRoles = ["All"],
  initialHref = "",
}: {
  open: boolean;
  onClose: () => void;
  onPick: (href: string, label?: string) => void;
  audienceRoles?: string[];
  initialHref?: string;
}) {
  const t = useTranslations("deep_links");
  useHydrateDeepLinks();
  const routes = useDeepLinksStore((s) => s.routes);

  // Seeded once per mount — the parent mounts this fresh each time it opens
  // (`{open && <DeepLinkPickerModal … />}`), so state always starts clean.
  const [value, setValue] = useState(initialHref);
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<DeepLinkRoute | null>(null);
  const [params, setParams] = useState<Record<string, string>>({});

  const parsed = useMemo(() => parseDeepLink(value, routes), [value, routes]);
  const missing = value ? missingParams(value) : [];
  const roleOk = matchesAudience(parsed.route, audienceRoles);
  const webConv = useMemo(
    () => (value && !parsed.valid ? webUrlToDeepLink(value, routes) : null),
    [value, parsed.valid, routes]
  );

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return routes.filter(
      (r) => !needle || r.label.toLowerCase().includes(needle) || r.deepLink.toLowerCase().includes(needle)
    );
  }, [routes, q]);
  const groups = useMemo(() => groupByRole(filtered), [filtered]);

  const choose = (r: DeepLinkRoute) => {
    if (r.requiresParams.length) {
      setPicked(r);
      setParams(Object.fromEntries(r.requiresParams.map((p) => [p, ""])));
    } else {
      onPick(r.deepLink, r.label);
    }
  };
  const insertParams = () => {
    if (!picked) return;
    onPick(buildDeepLink(picked.deepLink, params), picked.label);
  };
  const insertCurrent = () => {
    const href = value.trim();
    if (href) onPick(href, parsed.route?.label);
  };

  return (
    <Modal open={open} onClose={onClose} title={t("pick_destination")}>
      {!picked ? (
        <>
          <input
            className={fInput}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="blink://… or https://"
          />
          {value && (
            <div className="mt-1.5 space-y-1 text-xs">
              {parsed.valid && parsed.route ? (
                <div className="flex items-center gap-2">
                  <Badge variant={ROLE_VARIANT[parsed.route.role]}>{parsed.route.role}</Badge>
                  <span className="text-subtext">{parsed.route.label}</span>
                </div>
              ) : webConv ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={ROLE_VARIANT[webConv.route.role]}>{webConv.route.role}</Badge>
                  <span className="text-subtext">{webConv.route.label}</span>
                  <button
                    type="button"
                    onClick={() => setValue(webConv.deepLink)}
                    className="text-primary font-semibold hover:underline"
                  >
                    {t("convert_web_link")}
                  </button>
                </div>
              ) : isExternalUrl(value) ? (
                <span className="text-subtext">{t("external_link")}</span>
              ) : (
                <span className="text-warning">{t("unknown_link")}</span>
              )}
              {missing.length > 0 && (
                <p className="text-warning">{t("fill_params", { params: missing.join(", ") })}</p>
              )}
              {!roleOk && <p className="text-warning">{t("role_mismatch", { role: parsed.route?.role ?? "" })}</p>}
            </div>
          )}

          <div className="my-3">
            <SearchBox placeholder={t("search")} value={q} onChange={setQ} />
          </div>
          <div className="max-h-[42vh] overflow-y-auto -mx-1 px-1">
            {groups.length === 0 && (
              <div className="py-8 text-center text-subtext text-sm">{t("no_routes")}</div>
            )}
            {groups.map((g) => (
              <div key={g.role} className="mb-3">
                <div className="text-[10px] font-bold text-subtext uppercase tracking-wider px-1 pb-1.5 flex items-center gap-2">
                  <Badge variant={ROLE_VARIANT[g.role]}>{g.role}</Badge>
                  <span>{g.routes.length}</span>
                </div>
                {g.routes.map((r) => (
                  <button
                    key={r.deepLink}
                    type="button"
                    onClick={() => choose(r)}
                    className="w-full text-start flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-card-hover transition-colors cursor-pointer"
                  >
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium text-text truncate">{r.label}</span>
                      <span className="block text-[11px] text-subtext font-mono truncate">{r.deepLink}</span>
                    </span>
                    {r.requiresParams.length > 0 && (
                      <span className="text-[10px] text-primary shrink-0">
                        {r.requiresParams.map((p) => `:${p}`).join(" ")}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="flex gap-2.5 justify-end mt-4">
            {initialHref && (
              <Button type="button" variant="secondary" onClick={() => onPick("")} className="me-auto">
                {t("remove")}
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="button" onClick={insertCurrent} icon="plus" disabled={!value.trim() || missing.length > 0}>
              {t("insert")}
            </Button>
          </div>
        </>
      ) : (
        <div>
          <div className="mb-3">
            <div className="text-[13px] font-bold text-text">{picked.label}</div>
            <div className="text-[11px] text-subtext font-mono">{picked.deepLink}</div>
          </div>
          {picked.requiresParams.map((p) => (
            <div key={p} className="mb-3">
              <label className="block text-[12.5px] font-bold text-text mb-1.5">{p}</label>
              <input
                className={fInput}
                value={params[p] ?? ""}
                onChange={(e) => setParams((o) => ({ ...o, [p]: e.target.value }))}
                placeholder={`:${p}`}
              />
            </div>
          ))}
          <div className="rounded-lg bg-background border border-border px-3 py-2 text-[12px] font-mono text-subtext break-all mb-3">
            {buildDeepLink(picked.deepLink, params)}
          </div>
          <div className="flex gap-2.5 justify-end">
            <Button type="button" variant="secondary" onClick={() => setPicked(null)}>
              {t("back")}
            </Button>
            <Button
              type="button"
              onClick={insertParams}
              icon="plus"
              disabled={picked.requiresParams.some((p) => !params[p])}
            >
              {t("insert")}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
