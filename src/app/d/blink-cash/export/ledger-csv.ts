import type { CsvColumn } from "@/features/blink-cash/lib/csv";
import type { LedgerRow } from "@/features/blink-cash/types";

export const LEDGER_EXPORT_CAP = 10_000;

export const ledgerCsvColumns: CsvColumn<LedgerRow>[] = [
  { header: "id", value: (r) => r.id },
  { header: "created_at", value: (r) => r.created_at },
  { header: "type", value: (r) => r.type },
  { header: "status", value: (r) => r.status },
  { header: "method", value: (r) => r.method },
  { header: "user", value: (r) => r.userName },
  { header: "user_phone", value: (r) => r.userPhone },
  { header: "user_id", value: (r) => r.user_id },
  { header: "agent", value: (r) => r.agentName },
  { header: "amount", value: (r) => Number(r.amount) },
  { header: "fees", value: (r) => Number(r.fees) },
  { header: "total", value: (r) => Number(r.total) },
  { header: "bonus", value: (r) => (r.bonus_amount == null ? null : Number(r.bonus_amount)) },
  { header: "offer", value: (r) => r.offer_title },
  { header: "reference", value: (r) => r.reference },
  { header: "pending_id", value: (r) => r.pending_id },
  { header: "cancel_reason", value: (r) => r.cancel_reason },
  { header: "reversal_reason", value: (r) => r.reversal_reason },
  { header: "completed_at", value: (r) => r.completed_at },
];
