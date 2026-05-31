export function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1 py-3.5 border-t border-border first:border-t-0">
      <span className="text-[12.5px] text-subtext">{label}</span>
      <span className="text-2xl font-extrabold text-text">{value}</span>
    </div>
  );
}
