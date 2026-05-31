export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex gap-3.5 items-center">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5 text-xs text-subtext">
          <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}
