import { DashIcon } from "@/components/ui";
import { EV_BG, EV_FG } from "../data";
import type { FeedItem } from "../types";


const fmtT = (s: number) => (s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`);

export function EventFeed({ feed }: { feed: FeedItem[] }) {
  return (
    <div className="flex flex-col">
      {feed.map((e) => (
        <div key={e.key} className="flex gap-3 py-3 border-t border-border first:border-t-0">
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
            style={{ background: EV_BG[e.v], color: EV_FG[e.v] }}
          >
            <DashIcon name={e.ic} className="w-[18px] h-[18px]" />
          </div>
          <div className="flex-1">
            <div className="text-[13.5px] text-text">
              {e.tt.map((p, i) => (i % 2 ? <b key={i} className="font-bold">{p}</b> : <span key={i}>{p}</span>))}
            </div>
            <div className="text-[11.5px] text-subtext mt-0.5">{e.mt}</div>
          </div>
          <span className="text-[11px] text-subtext whitespace-nowrap tabular-nums">{fmtT(e.t)}</span>
        </div>
      ))}
    </div>
  );
}
