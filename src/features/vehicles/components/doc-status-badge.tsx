import { Badge } from "@/components/ui";
import { DOC_STATUS, type DocStatus, type TFn } from "../data";

// A document review status as a coloured pill (approved / pending / needs update / not uploaded).
export function DocStatusBadge({ t, status }: { t: TFn; status: DocStatus }) {
  return <Badge variant={DOC_STATUS[status]}>{t("doc_status." + status)}</Badge>;
}
