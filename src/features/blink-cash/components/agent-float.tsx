import { Button, Badge, StatGrid, StatCard, SearchBox, Card, DashIcon } from "@/components/ui";
import { AGENT_FLOAT } from "../data";
import type { TFn } from "../types";

export function AgentFloat({ t }: { t: TFn }) {
  return (
    <>
      <StatGrid cols={4}>
        <StatCard label={t("float.held")} value="640K DA" variant="primary" icon="store" change={t("float.held_chg")} />
        <StatCard label={t("float.dep")} value="1.4M DA" variant="success" icon="wallet" change={t("float.today")} />
        <StatCard label={t("float.wd")} value="980K DA" variant="info" icon="bank" change={t("float.today")} />
        <StatCard label={t("float.near_cap")} value="2" variant="warning" icon="fire" change={t("float.near_cap_chg")} />
      </StatGrid>
      <div className="flex items-center gap-3 mb-[18px]">
        <SearchBox placeholder={t("float.search")} />
        <Button icon="download" className="ms-auto">
          {t("export")}
        </Button>
      </div>
      <Card>
        {AGENT_FLOAT.map((a, i) => {
          const pct = Math.round((a.float / a.cap) * 100);
          return (
            <div key={a.who} className={`flex items-center gap-4 py-3.5 ${i ? "border-t border-border" : ""}`}>
              <div className="w-10 h-10 rounded-[11px] bg-soft-pink flex items-center justify-center shrink-0">
                <DashIcon name="store" className="w-[19px] h-[19px] text-primary" />
              </div>
              <div className="max-w-[200px]">
                <div className="text-[14.5px] font-bold text-text">{a.who}</div>
                <div className="text-xs text-subtext mt-0.5">
                  {a.area} · {t("txns", { n: a.txns })}
                </div>
              </div>
              <div className="flex-1 max-w-[260px]">
                <div className="flex justify-between text-[11.5px] mb-1.5">
                  <span className="text-subtext">{t("float.label")}</span>
                  <span className="font-mono font-semibold text-text">
                    {(a.float / 1000).toFixed(0)}k / {(a.cap / 1000).toFixed(0)}k DA
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${pct}%`, background: pct > 90 ? "var(--warning)" : "var(--success)" }}
                  />
                </div>
              </div>
              <Badge variant={pct > 90 ? "warning" : "success"}>{pct}%</Badge>
            </div>
          );
        })}
      </Card>
    </>
  );
}
