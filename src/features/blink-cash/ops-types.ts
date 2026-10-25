// View models for the Blink Cash operations pages (wallets, review, offers, audit…).
import type { StatementRow } from "./lib/statement";

export interface WalletRow {
  id: string;
  userId: string;
  name: string | null;
  phone: string | null;
  role: string;
  balance: number;
  held: number;
  status: "active" | "frozen";
  updatedAt: string | null;
}

export interface WalletDetail {
  wallet: WalletRow & { frozenReason: string | null; frozenAt: string | null; backfilledAt: string | null };
  entries: (StatementRow & { actorName: string | null })[];
  entriesTotal: number;
}

export interface PendingPayment {
  id: string;
  kind: "agent" | "merchant";
  /** Agent user id / merchant store id — the target of the server paths. */
  partyId: string | null;
  partyName: string | null;
  storeName: string | null;
  amount: number;
  fees: number;
  method: string;
  reference: string | null;
  note: string | null;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  actorId: string | null;
  actorName: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  amount: number | null;
  reason: string | null;
  details: unknown;
  createdAt: string;
}

export interface OpsCounts {
  pendingOps: number | null;
  review: number | null;
  frozen: number | null;
  /** Pending dues payments with a manual method (staff confirm them). */
  pendingAgentPayments: number | null;
  pendingMerchantPayments: number | null;
  /** Online payments with an amount mismatch, not paid out: they need a staff look. */
  gatewayIssues: number | null;
}
