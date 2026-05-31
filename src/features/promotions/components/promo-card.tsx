"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui";
import { P_COVERS, P_STATUS, type Promo } from "../data";

export function PromoCard({ p }: { p: Promo }) {
  const t = useTranslations("promotions");
  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card">
      <div
        className="relative h-[140px] bg-cover bg-center bg-muted"
        style={{ backgroundImage: `url(${P_COVERS[p.cover]})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent from-35% to-black/60" />
        <span className="absolute top-2.5 start-2.5 z-[1] bg-white/90 text-primary text-[9px] font-extrabold px-2.5 py-[3px] rounded-full uppercase tracking-wide">
          {p.cat}
        </span>
        <span className="absolute top-2.5 end-2.5 z-[1] bg-black/50 text-white text-[9px] font-bold px-2.5 py-[3px] rounded-full uppercase tracking-wide backdrop-blur-sm">
          {p.type === "copy" ? t("card.copy_code") : t("card.activate")}
        </span>
        <div className="absolute start-3.5 end-3.5 bottom-3 z-[1]">
          <h4 className="text-white font-extrabold text-lg leading-tight">{p.title}</h4>
        </div>
      </div>
      <div className="flex items-center justify-between px-3.5 py-3">
        <span className="text-xs text-subtext flex-1">{p.sub}</span>
        {p.code && (
          <span className="font-mono text-[11px] font-bold text-text bg-muted border border-dashed border-border rounded-md px-2 py-[3px]">
            {p.code}
          </span>
        )}
      </div>
      <div className="flex border-t border-border">
        <PStat value={p.reach ? `${(p.reach / 1000).toFixed(0)}k` : "—"} label={t("card.reach")} />
        <PStat value={p.redeemed ? p.redeemed.toLocaleString() : "—"} label={t("card.used")} border />
        <PStat value={p.ctr} label={t("card.ctr")} border />
        <div className="flex-1 text-center py-2.5 px-1 border-s border-border flex items-center justify-center">
          <Badge variant={P_STATUS[p.status]}>{p.status}</Badge>
        </div>
      </div>
    </div>
  );
}

function PStat({ value, label, border }: { value: string; label: string; border?: boolean }) {
  return (
    <div className={`flex-1 text-center py-2.5 px-1 ${border ? "border-s border-border" : ""}`}>
      <div className="font-bold text-sm text-text">{value}</div>
      <div className="text-[9.5px] text-subtext uppercase tracking-wide">{label}</div>
    </div>
  );
}
