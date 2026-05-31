import { DashIcon } from "./icons";

export interface SubTab {
  id: string;
  label: string;
  icon: string;
  count?: string;
}

export function SubTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: SubTab[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1 mb-[22px] border-b border-border overflow-x-auto">
      {tabs.map((t) => {
        const on = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`inline-flex items-center gap-2 px-4 py-[11px] text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors ${
              on ? "text-primary border-primary" : "text-subtext border-transparent hover:text-text"
            }`}
          >
            <DashIcon name={t.icon} className="w-4 h-4" />
            {t.label}
            {t.count && (
              <span
                className={`text-[11px] font-bold rounded-full px-2 py-px ${
                  on ? "bg-soft-pink text-primary" : "bg-muted text-subtext"
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
