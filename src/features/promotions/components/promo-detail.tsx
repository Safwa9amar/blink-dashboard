"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Button, Card, StatCard, StatGrid } from "@/components/ui";
import { promotionAvailability } from "../availability";
import { fmtNum, pct, progress } from "../format";
import type { PromotionCouponRow, PromotionDay, PromotionRow, PromotionStats } from "../types";
import { AVAIL_VARIANT } from "../variants";
import { DailyChart } from "./daily-chart";

// Edit page: this promotion's stats (promotion_stats row), 30-day chart (promotion_daily)
// and the latest coupons issued from it.
export function PromoDetail({
  row,
  stats,
  daily,
  coupons,
  now,
}: {
  row: PromotionRow;
  stats: PromotionStats;
  daily: PromotionDay[];
  coupons: PromotionCouponRow[];
  now: Date;
}) {
  const t = useTranslations("promotions");
  const tc = useTranslations("common");
  const locale = useLocale();
  const avail = promotionAvailability(row, stats, now);
  const da = (n: number) => `${fmtNum(n, locale)} ${tc("da")}`;
  const issuedP = progress(stats.issued, row.max_coupons);
  const budgetP = progress(stats.discount_given, row.discount_budget);

  return (
    <div className="space-y-5 mt-5">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold text-text">{t("detail.stats")}</h3>
        <Badge variant={AVAIL_VARIANT[avail]}>{t(`avail.${avail}` as never)}</Badge>
      </div>
      <StatGrid cols={5}>
        <StatCard label={t("cols.views")} value={stats.views} variant="info" icon="eye" change={t("detail.reach", { n: fmtNum(stats.reach, locale) })} />
        <StatCard label={t("cols.ctr")} value={pct(stats.taps, stats.views)} variant="primary" icon="activity" change={t("detail.taps", { n: fmtNum(stats.taps, locale) })} />
        <StatCard
          label={t("cols.issued")}
          value={row.max_coupons != null ? `${fmtNum(stats.issued, locale)} / ${fmtNum(row.max_coupons, locale)}` : stats.issued}
          variant="success"
          icon="ticket"
          change={issuedP != null ? `${Math.round(issuedP)}%` : undefined}
        />
        <StatCard label={t("cols.used")} value={stats.used} variant="warning" icon="trending" change={t("detail.conversion", { n: pct(stats.used, stats.issued) })} />
        <StatCard
          label={t("cols.discount_given")}
          value={da(stats.discount_given)}
          variant="default"
          icon="dollar"
          change={row.discount_budget != null ? `${budgetP != null ? Math.round(budgetP) : 0}% ${t("detail.of_budget", { n: da(row.discount_budget) })}` : t("detail.revenue", { n: da(stats.revenue) })}
        />
      </StatGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title={t("detail.traffic30")}>
          <DailyChart days={daily} series="traffic" names={[t("cols.views"), t("detail.tap_name")]} />
        </Card>
        <Card title={t("detail.coupons30")}>
          <DailyChart days={daily} series="coupons" names={[t("cols.issued"), t("cols.used")]} />
        </Card>
      </div>

      <Card
        title={t("detail.latest")}
        action={
          <Link href={`/coupons?promotion=${row.id}`}>
            <Button size="xs" variant="secondary" type="button">
              {t("detail.view_all")}
            </Button>
          </Link>
        }
      >
        {coupons.length === 0 ? (
          <p className="text-sm text-subtext">{t("detail.no_coupons")}</p>
        ) : (
          <ul className="divide-y divide-border">
            {coupons.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="font-mono text-xs font-bold">{c.code}</span>
                <span className="flex-1 truncate">{c.user_name}</span>
                <span className="text-xs text-subtext">{new Date(c.created_at).toLocaleDateString(locale)}</span>
                <Badge variant={c.revoked_at ? "danger" : c.used_at ? "success" : "default"}>
                  {c.revoked_at ? t("detail.st_revoked") : c.used_at ? t("detail.st_used") : t("detail.st_open")}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
