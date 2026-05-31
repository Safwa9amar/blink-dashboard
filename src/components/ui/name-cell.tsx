import { Avatar } from "./avatar";

export function NameCell({ name }: { name: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <Avatar name={name} />
      <span className="font-semibold text-text">{name}</span>
    </span>
  );
}
