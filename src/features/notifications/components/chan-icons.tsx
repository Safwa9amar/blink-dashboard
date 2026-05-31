import { DashIcon } from "@/components/ui";
import { CHANNELS } from "../data";

export function ChanIcons({ chans }: { chans: string[] }) {
  return (
    <span className="inline-flex gap-1.5">
      {chans.map((c) => {
        const m = CHANNELS.find((x) => x[0] === c)!;
        return (
          <span key={c} title={m[1]} className="text-subtext">
            <DashIcon name={m[2]} className="w-4 h-4" />
          </span>
        );
      })}
    </span>
  );
}
