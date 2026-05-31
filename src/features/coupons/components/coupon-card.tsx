import { DashIcon } from "@/components/ui";
import type { Coupon } from "../data";

export function CouponCard({ c }: { c: Coupon }) {
  return (
    <div className="relative flex bg-card border border-border rounded-2xl overflow-hidden">
      {/* punch holes between stub and body */}
      <span className="absolute w-4 h-4 rounded-full bg-background -top-2 start-[88px]" />
      <span className="absolute w-4 h-4 rounded-full bg-background -bottom-2 start-[88px]" />

      <div
        className={`w-24 shrink-0 flex flex-col items-center justify-center px-2 py-3.5 text-center border-e-2 border-dashed border-border ${
          c.locked ? "bg-muted text-subtext" : "bg-soft-pink text-primary"
        }`}
      >
        <span className="text-xl font-extrabold leading-none">{c.disc}</span>
        <span className="text-[10px] font-bold uppercase tracking-wide mt-1">{c.unit}</span>
      </div>

      <div className="flex-1 px-4 py-3.5">
        {c.locked && (
          <span className="absolute top-2.5 end-2.5 inline-flex items-center gap-1.5 bg-background border border-border text-subtext text-[10px] font-bold px-2 py-[3px] rounded-full">
            <DashIcon name="lock" className="w-[11px] h-[11px]" />
            {c.points} pts
          </span>
        )}
        <div className="font-bold text-[14.5px] text-text">{c.title}</div>
        <div className="text-[11.5px] text-subtext mt-1.5 leading-relaxed">
          {c.min ? `Min order ${c.min.toLocaleString()} DA` : "No minimum"}
          {c.max ? ` · Max ${c.max} DA` : ""}
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="font-mono text-xs font-bold text-text bg-muted border border-dashed border-border rounded-md px-2.5 py-1 tracking-wider">
            {c.code}
          </span>
          <span className="text-[11px] font-bold text-warning">{c.days}d left</span>
        </div>
      </div>
    </div>
  );
}
