// Overview "Needs attention" list. Pure.

export interface AttentionInput {
  reviewCount: number;
  pendingAgentPayments: number;
  pendingMerchantPayments: number;
  agentsNearLimit: number;
  driftCount: number | null;
  frozenWallets: number;
}
export interface AttentionItem {
  key: "review" | "agent_payments" | "merchant_payments" | "agents_limit" | "drift" | "frozen";
  count: number;
  href: string;
  tone: "danger" | "warning" | "info";
}

/** Only non-zero items, most urgent first. */
export function attentionItems(i: AttentionInput): AttentionItem[] {
  const all: AttentionItem[] = [
    { key: "drift", count: i.driftCount ?? 0, href: "/blink-cash/reconciliation", tone: "danger" },
    { key: "review", count: i.reviewCount, href: "/blink-cash/review", tone: "warning" },
    { key: "agent_payments", count: i.pendingAgentPayments, href: "/blink-cash/review", tone: "warning" },
    { key: "merchant_payments", count: i.pendingMerchantPayments, href: "/blink-cash/review", tone: "warning" },
    { key: "agents_limit", count: i.agentsNearLimit, href: "/blink-cash/agents", tone: "warning" },
    { key: "frozen", count: i.frozenWallets, href: "/blink-cash/wallets?status=frozen", tone: "info" },
  ];
  return all.filter((a) => a.count > 0);
}
