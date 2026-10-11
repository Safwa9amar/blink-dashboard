"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card } from "@/components/ui";
import type { Pipeline } from "../types";

const STAGES = ["searching", "heading_to_store", "preparation", "pickup", "on_the_way"] as const;

export function PipelineCard({ pipeline }: { pipeline: Pipeline }) {
  const t = useTranslations("overview");
  const locale = useLocale();
  const max = Math.max(1, ...STAGES.map((s) => pipeline[s]));
  return (
    <Card title={t("pipeline.title")} description={t("pipeline.description")}>
      <ul className="space-y-3">
        {STAGES.map((s) => (
          <li key={s}>
            <div className="flex items-center justify-between text-[13px] mb-1">
              <span className="text-text">{t(`pipeline.${s}`)}</span>
              <span className="font-semibold tabular-nums text-text">{pipeline[s].toLocaleString(locale)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(pipeline[s] / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[13px]">
        <span className="text-subtext">{t("pipeline.delivered_today")}</span>
        <span className="font-semibold tabular-nums text-success">{pipeline.deliveredToday.toLocaleString(locale)}</span>
      </p>
    </Card>
  );
}
