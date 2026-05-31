export function MetaCol({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center min-w-[54px]">
      <div className="font-bold text-sm text-text">{value}</div>
      <div className="text-[10px] text-subtext uppercase tracking-wide">{label}</div>
    </div>
  );
}
