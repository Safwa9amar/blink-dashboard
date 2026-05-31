import { Toggle, DashIcon } from "@/components/ui";

export function ToggleRow({
  icon,
  title,
  desc,
  on,
  onClick,
  last,
}: {
  icon: string;
  title: string;
  desc: string;
  on: boolean;
  onClick: () => void;
  last?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between p-3.5 bg-background border border-border rounded-xl ${last ? "" : "mb-3"}`}>
      <div>
        <b className="flex items-center gap-1.5 text-[13.5px] font-bold text-text">
          <DashIcon name={icon} className="w-[15px] h-[15px] text-primary" />
          {title}
        </b>
        <span className="block text-[11.5px] text-subtext mt-0.5">{desc}</span>
      </div>
      <Toggle on={on} onClick={onClick} />
    </div>
  );
}
