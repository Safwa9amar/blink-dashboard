export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: {
  options: [T, string][];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={`inline-flex bg-background border border-border rounded-lg p-[3px] ${className}`}>
      {options.map(([v, l]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`px-3.5 py-[5px] rounded-md text-xs font-semibold transition-colors ${
            value === v ? "bg-primary text-white" : "text-subtext"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
