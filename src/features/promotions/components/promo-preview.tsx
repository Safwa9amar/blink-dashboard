"use client";

import { useLocale, useTranslations } from "next-intl";
import { fmtNum } from "../format";
import type { PromotionFormValues } from "../form";

// Phone-frame preview of how the promotion renders in the customer app: the Promos tab
// card (kind = promo) or the Top Deals card (kind = deal). Driven by live form values.
export function PromoPreview({ v, storeName }: { v: PromotionFormValues; storeName?: string }) {
  const t = useTranslations("promotions");
  const tc = useTranslations("common");
  const locale = useLocale();

  const value =
    v.discount_type === "percent"
      ? `${fmtNum(Number(v.discount_value) || 0, locale)}%`
      : v.discount_type === "fixed"
        ? `${fmtNum(Number(v.discount_value) || 0, locale)} ${tc("da")}`
        : t("discount_types.free_delivery");

  return (
    <div className="mx-auto w-[280px] rounded-[32px] border-[6px] border-border bg-background p-3 shadow-lg">
      <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-border" />
      {v.kind === "promo" ? (
        <div className="rounded-2xl overflow-hidden border border-border bg-card">
          <div
            className="relative h-[130px] bg-cover bg-center bg-muted"
            style={v.image_url ? { backgroundImage: `url(${v.image_url})` } : undefined}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent from-35% to-black/60" />
            <span className="absolute top-2.5 start-2.5 z-[1] bg-white/90 text-primary text-[9px] font-extrabold px-2.5 py-[3px] rounded-full uppercase tracking-wide">
              {t(`categories.${v.category}` as never)}
            </span>
            <span className="absolute top-2.5 end-2.5 z-[1] bg-black/50 text-white text-[9px] font-bold px-2.5 py-[3px] rounded-full uppercase tracking-wide">
              {t(`action_types.${v.action}` as never)}
            </span>
            <div className="absolute start-3 end-3 bottom-2.5 z-[1]">
              <h4 className="text-white font-extrabold text-base leading-tight">{v.title || t("preview.title_ph")}</h4>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 px-3 py-2.5">
            <span className="text-xs text-subtext flex-1">{v.subtitle || t("preview.subtitle_ph")}</span>
            {v.action === "copy" && v.code && (
              <span className="font-mono text-[11px] font-bold text-text bg-muted border border-dashed border-border rounded-md px-2 py-[3px]">
                {v.code.toUpperCase()}
              </span>
            )}
          </div>
          <div className="border-t border-border px-3 py-2 text-[11px] text-subtext">
            {value}
            {Number(v.min_order) > 0 && ` · ${t("preview.min", { n: fmtNum(Number(v.min_order), locale), da: tc("da") })}`}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden border border-border bg-card">
          <div
            className="relative h-[120px] bg-cover bg-center bg-muted"
            style={v.image_url ? { backgroundImage: `url(${v.image_url})` } : undefined}
          >
            {v.badge_text && (
              <span
                className="absolute top-2.5 start-2.5 text-white text-[10px] font-extrabold px-2.5 py-[3px] rounded-full uppercase tracking-wide"
                style={{ background: /^#[0-9a-fA-F]{6}$/.test(v.badge_color) ? v.badge_color : "var(--primary)" }}
              >
                {v.badge_text}
              </span>
            )}
            {v.value_text && (
              <span className="absolute bottom-2.5 end-2.5 bg-white/90 text-text text-sm font-extrabold px-2.5 py-1 rounded-lg">
                {v.value_text}
              </span>
            )}
          </div>
          <div className="px-3 py-2.5">
            <h4 className="font-bold text-sm text-text leading-tight">{v.title || t("preview.title_ph")}</h4>
            <p className="text-xs text-subtext mt-0.5">{storeName || v.subtitle || t("preview.subtitle_ph")}</p>
            {v.info_text && <p className="text-[11px] text-subtext mt-1.5">{v.info_text}</p>}
            <p className="text-[11px] font-semibold text-primary mt-1.5">{value}</p>
          </div>
        </div>
      )}
    </div>
  );
}
