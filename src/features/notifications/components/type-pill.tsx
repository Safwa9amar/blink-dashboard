import { Badge, DashIcon } from "@/components/ui";
import { NTYPES, NTYPE_BADGE } from "../data";

export function TypePill({ type }: { type: string }) {
  const c = NTYPES[type] || NTYPES.order;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="w-[26px] h-[26px] rounded-lg flex items-center justify-center" style={{ background: c.bg, color: c.color }}>
        <DashIcon name={c.icon} className="w-3.5 h-3.5" />
      </span>
      <Badge variant={NTYPE_BADGE[type]}>{c.label}</Badge>
    </span>
  );
}
