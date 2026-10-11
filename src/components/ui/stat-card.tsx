import { isValidElement, type ReactNode } from "react";
import { DashIcon } from "./icons";
import type { Variant } from "./primitives";

interface StatCardProps {
  label: string;
  value: string | number;
  variant?: Variant;
  /** A ReactNode rendered as-is, or a DashIcon name (string). */
  icon?: ReactNode | string;
  change?: string;
}

const variantStyles: Record<Variant, { bg: string; text: string; iconBg: string }> = {
  primary: { bg: "bg-card border-border", text: "text-primary", iconBg: "bg-soft-pink" },
  success: { bg: "bg-card border-border", text: "text-success", iconBg: "bg-success-light" },
  info: { bg: "bg-card border-border", text: "text-info", iconBg: "bg-info-light" },
  warning: { bg: "bg-card border-border", text: "text-warning", iconBg: "bg-warning-light" },
  danger: { bg: "bg-card border-border", text: "text-danger", iconBg: "bg-danger-light" },
  default: { bg: "bg-card border-border", text: "text-text", iconBg: "bg-muted" },
};

function renderIcon(icon: ReactNode | string) {
  if (icon == null || icon === false) return null;
  if (typeof icon === "string") return <DashIcon name={icon} className="w-4 h-4" />;
  if (isValidElement(icon)) return icon;
  return null;
}

export function StatCard({ label, value, variant = "primary", icon, change }: StatCardProps) {
  const styles = variantStyles[variant];
  const iconNode = renderIcon(icon);

  return (
    <div className={`rounded-xl border p-4 ${styles.bg}`}>
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-xs font-medium text-subtext">{label}</p>
        {iconNode && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${styles.iconBg} ${styles.text}`}>
            {iconNode}
          </div>
        )}
      </div>
      <p className={`text-2xl font-bold leading-none tabular-nums text-text`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {change && <p className={`text-xs font-medium mt-2 tabular-nums ${styles.text}`}>{change}</p>}
    </div>
  );
}
