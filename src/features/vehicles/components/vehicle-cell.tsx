import { DashIcon } from "@/components/ui";
import { TYPE_ICON, type VehicleType } from "../data";

// Identity cell for a vehicle: a typed glyph tile + brand/model and a sub line.
export function VehicleCell({
  title,
  sub,
  type,
}: {
  title: string;
  sub?: string;
  type: VehicleType;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-9 h-9 shrink-0 rounded-xl bg-soft-pink text-primary inline-flex items-center justify-center">
        <DashIcon name={TYPE_ICON[type]} className="w-[18px] h-[18px]" />
      </span>
      <div className="flex flex-col">
        <span className="font-semibold text-text">{title}</span>
        {sub && <span className="text-xs text-subtext">{sub}</span>}
      </div>
    </div>
  );
}
