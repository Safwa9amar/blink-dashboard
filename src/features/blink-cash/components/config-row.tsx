export function ConfigRow({ k, v, first }: { k: string; v: React.ReactNode; first?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-2.5 text-[13px] ${first ? "" : "border-t border-border"}`}>
      <span className="text-subtext">{k}</span>
      <span className="font-bold text-text">{v}</span>
    </div>
  );
}
