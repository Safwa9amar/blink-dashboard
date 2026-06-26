"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Segmented } from "@/components/ui";
import { fetchInstanceHealth } from "@/app/d/blink-server/instance-action";
import { SERVER_INSTANCES, type ServerInstance } from "../instances";
import { useServerInstanceStore, useHydrateServerInstance } from "../instance-store";

type Health = { version: string | null; ok: boolean; error: string | null };

// Shared selector for the AI Log + Live Logs tabs: pick which backend instance
// (online / local) those views poll. A live /health readout shows the target's
// version so it's obvious which server is being monitored. The choice persists
// (localStorage) and is shared across both tabs via the Zustand store.
export function InstanceSwitcher() {
  const t = useTranslations("blink_server.instance");
  useHydrateServerInstance();
  const instance = useServerInstanceStore((s) => s.instance);
  const setInstance = useServerInstanceStore((s) => s.setInstance);
  // Tag the health with the instance it came from, so on a switch we show
  // "checking…" (derived) until the new instance's probe resolves — no
  // synchronous setState in the effect.
  const [health, setHealth] = useState<{ instance: ServerInstance; data: Health } | null>(null);

  useEffect(() => {
    let alive = true;
    void fetchInstanceHealth(instance).then((data) => {
      if (alive) setHealth({ instance, data });
    });
    return () => {
      alive = false;
    };
  }, [instance]);

  const current = health?.instance === instance ? health.data : null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="text-[12.5px] font-semibold text-text">{t("label")}</span>
      <Segmented
        options={SERVER_INSTANCES.map((k) => [k, t(k)] as [string, string])}
        value={instance}
        onChange={(v) => setInstance(v as ServerInstance)}
      />
      <span className="flex items-center gap-1.5 text-[12px] text-subtext">
        <span
          className={`h-2 w-2 rounded-full ${
            current == null ? "bg-subtext" : current.ok ? "bg-success" : "bg-danger"
          }`}
        />
        {current == null
          ? t("checking")
          : current.ok
            ? t("version", { v: current.version ?? "?" })
            : t("unreachable")}
      </span>
    </div>
  );
}
