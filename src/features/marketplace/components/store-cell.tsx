import { Avatar } from "@/components/ui";

export function StoreCell({ name, sub }: { name: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar name={name} />
      <div className="flex flex-col">
        <span className="font-semibold text-text">{name}</span>
        {sub && <span className="text-xs text-subtext">{sub}</span>}
      </div>
    </div>
  );
}
