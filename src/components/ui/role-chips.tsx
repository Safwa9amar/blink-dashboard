export function RoleChips({
  roles,
  selected,
  onToggle,
}: {
  roles: string[];
  selected: string[];
  onToggle: (r: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {roles.map((r) => {
        const on = selected.includes(r);
        return (
          <button
            key={r}
            type="button"
            onClick={() => onToggle(r)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-[13px] font-semibold transition-colors ${
              on ? "bg-soft-pink border-soft-border text-primary" : "bg-background border-border text-subtext"
            }`}
          >
            {on && <span className="w-[7px] h-[7px] rounded-full bg-current" />}
            {r}
          </button>
        );
      })}
    </div>
  );
}
