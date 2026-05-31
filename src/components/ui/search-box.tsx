import { DashIcon } from "./icons";

export function SearchBox({
  placeholder,
  value,
  onChange,
}: {
  placeholder?: string;
  /** Optional controlled value. Omit for a presentational (uncontrolled) box. */
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2.5 bg-card border border-border rounded-xl px-3.5 py-2.5 flex-1 max-w-xs">
      <DashIcon name="search" className="w-4 h-4 text-subtext shrink-0" />
      <input
        placeholder={placeholder || "Search"}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="bg-transparent border-none outline-none text-sm text-text w-full placeholder:text-subtext"
      />
    </div>
  );
}
