// Normalizers for the two blink-server staff reports behind the Overview chart/stats
// and the Agents tab. The server owns every money rule; these only coerce types
// (numerics may arrive as strings) and derive display fields. They throw on a payload
// that isn't the expected shape so the page shows "Report unavailable" instead of zeros.
import type {
  AgentDueRow,
  AgentDuesPayment,
  AgentDuesSummary,
  BlinkCashSummary,
  CashDaily,
  CashDays,
  Exposure,
} from "./types";

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const numOrNull = (v: unknown) => {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const str = (v: unknown) => (typeof v === "string" && v ? v : null);
const obj = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});

export const CASH_DAYS: readonly CashDays[] = [7, 30, 90];

/** `?days=` → a supported window (default 30). */
export function parseCashDays(v: string | string[] | undefined): CashDays {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return (CASH_DAYS as readonly number[]).includes(n) ? (n as CashDays) : 30;
}

export function summarizeBlinkCash(payload: unknown): BlinkCashSummary {
  const body = payload as Record<string, unknown> | null;
  if (!body || typeof body !== "object" || !Array.isArray(body.daily) || !body.circulation) {
    throw new Error("Unexpected response from /blink-cash/admin/summary");
  }
  const c = obj(body.circulation);
  const dep = obj(body.deposits);
  const wd = obj(body.withdrawals);
  const f = obj(body.fees);
  const p = obj(body.pending);
  const a = obj(body.agent_cash);
  const daily: CashDaily[] = (body.daily as Record<string, unknown>[]).map((d) => ({
    date: String(d.date),
    deposits: num(d.deposits),
    withdrawals: num(d.withdrawals),
    deposits_count: num(d.deposits_count),
    withdrawals_count: num(d.withdrawals_count),
  }));
  return {
    windowDays: num(body.window_days),
    generatedAt: str(body.generated_at),
    circulation: {
      total: num(c.total),
      available: num(c.available),
      pendingWithdrawals: num(c.pending_withdrawals),
      wallets: num(c.wallets),
    },
    deposits: { count: num(dep.count), amount: num(dep.amount) },
    withdrawals: { count: num(wd.count), amount: num(wd.amount) },
    fees: { total: num(f.total), platform: num(f.platform), tax: num(f.tax), agentsNet: num(f.agents_net) },
    pending: { count: num(p.count), amount: num(p.amount) },
    agentCash: {
      owedToBlink: num(a.owed_to_blink),
      credit: num(a.credit),
      agentsOwing: num(a.agents_owing),
      agents: num(a.agents),
    },
    daily,
  };
}

/** Whether the chart has anything to draw. */
export const hasCashFlow = (s: BlinkCashSummary) => s.daily.some((d) => d.deposits > 0 || d.withdrawals > 0);

/** Owed to Blink ≥ 50,000 DA is high exposure, ≥ 20,000 medium. */
export const EXPOSURE_HIGH = 50_000;
export const EXPOSURE_MEDIUM = 20_000;

export function exposureOf(owed: number): Exposure {
  if (owed >= EXPOSURE_HIGH) return "high";
  if (owed >= EXPOSURE_MEDIUM) return "medium";
  return owed > 0 ? "low" : "none";
}
const RANK: Record<Exposure, number> = { none: 0, low: 1, medium: 2, high: 3 };

export function summarizeAgentDues(payload: unknown): AgentDuesSummary {
  const body = payload as { agents?: unknown; payments?: unknown } | null;
  if (!body || !Array.isArray(body.agents) || !Array.isArray(body.payments)) {
    throw new Error("Unexpected response from /agents/admin/dues");
  }
  const agents: AgentDueRow[] = (body.agents as Record<string, unknown>[]).map((r) => {
    const shop = r.primary_shop ? obj(r.primary_shop) : null;
    const dep = obj(r.deposits);
    const wd = obj(r.withdrawals);
    // Dues can be negative (the agent is in credit); only a positive balance is owed.
    const owed = Math.max(0, num(r.total_dues));
    const exposure = exposureOf(owed);
    return {
      id: String(r.agent_id),
      name: str(r.name) ?? "—",
      phone: str(r.phone),
      shopName: shop ? str(shop.name) : null,
      shopAddress: shop ? str(shop.address) : null,
      lat: shop ? numOrNull(shop.lat) : null,
      lng: shop ? numOrNull(shop.lng) : null,
      shopsTotal: num(r.shops_total),
      shopsOpen: num(r.shops_open),
      depCount: num(dep.count),
      depAmount: num(dep.amount),
      wdCount: num(wd.count),
      wdAmount: num(wd.amount),
      ops30: num(r.operations_30d),
      feeNet: num(r.fee_income_net),
      owed,
      credit: Math.max(0, num(r.credit)),
      exposure,
      exposureRank: RANK[exposure],
      lastOperationAt: str(r.last_operation_at),
      lastPaymentAt: str(r.last_payment_at),
      rating: numOrNull(r.rating_avg),
      ratingsCount: num(r.ratings_count),
    };
  });
  const payments: AgentDuesPayment[] = (body.payments as Record<string, unknown>[])
    .map((p) => ({
      id: String(p.id),
      agentId: str(p.agent_id),
      agentName: str(p.agent_name),
      amount: num(p.amount),
      fees: num(p.fees),
      method: str(p.method) ?? "—",
      status: str(p.status) ?? "completed",
      createdAt: String(p.created_at),
    }))
    .sort((x, y) => Date.parse(y.createdAt) - Date.parse(x.createdAt));
  agents.sort((x, y) => y.owed - x.owed);
  return {
    agents,
    payments,
    totalOwed: agents.reduce((s, a) => s + a.owed, 0),
    totalCredit: agents.reduce((s, a) => s + a.credit, 0),
    agentsOwing: agents.filter((a) => a.owed > 0).length,
    operations30: agents.reduce((s, a) => s + a.ops30, 0),
  };
}
