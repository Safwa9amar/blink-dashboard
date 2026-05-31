import { DashIcon } from "./icons";

export function FilterPills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: [T, string, string?][];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-[18px]">
      {options.map(([v, label, icon]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold transition-colors ${
            value === v ? "bg-primary text-white" : "bg-muted text-subtext"
          }`}
        >
          {icon && <DashIcon name={icon} className="w-[13px] h-[13px]" />}
          {label}
        </button>
      ))}
    </div>
  );
}
