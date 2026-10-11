import { Badge } from "@/components/ui";
import { STATUS_VARIANT } from "../queue";
import type { ReviewDocState, TFn } from "../types";

// A review state as a coloured pill — shared by document slots and applications.
// `ns` picks the wording: `status.*` (applications) or `doc_status.*` (a store's
// required documents: "Missing", "Pending verification"…).
export function StatusBadge({
  t,
  status,
  ns = "status",
}: {
  t: TFn;
  status: ReviewDocState;
  ns?: "status" | "doc_status";
}) {
  return <Badge variant={STATUS_VARIANT[status]}>{t(`${ns}.${status}`)}</Badge>;
}
