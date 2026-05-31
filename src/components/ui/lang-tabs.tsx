import { LANGS, type Lang } from "./primitives";

export function LangTabs({
  active,
  onChange,
  filled,
}: {
  active: Lang;
  onChange: (l: Lang) => void;
  filled?: Record<Lang, boolean>;
}) {
  return (
    <div className="inline-flex gap-1 bg-background border border-border rounded-[10px] p-[3px] mb-2.5">
      {LANGS.map(([id, lbl]) => {
        const on = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`inline-flex items-center gap-1.5 px-[13px] py-[7px] rounded-[7px] text-xs font-bold transition-colors ${
              on ? "bg-primary text-white" : "text-subtext"
            }`}
          >
            {id.toUpperCase()}
            <span className={`font-medium text-[11px] ${on ? "opacity-90" : "opacity-75"}`}>{lbl}</span>
            {filled && filled[id] && (
              <span className={`w-[5px] h-[5px] rounded-full ${on ? "bg-white" : "bg-success"}`} />
            )}
          </button>
        );
      })}
    </div>
  );
}
