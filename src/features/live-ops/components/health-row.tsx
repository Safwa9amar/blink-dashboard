import { Badge } from "@/components/ui";

export function HealthRow({
  label,
  variant,
  children,
}: {
  label: string;
  variant: "success" | "warning";
  children: string;
}) {
  return (
    <div className="flex justify-between items-center py-2.5 border-t border-border first:border-t-0 text-[13px]">
      <span className="text-subtext">{label}</span>
      <Badge variant={variant}>{children}</Badge>
    </div>
  );
}
