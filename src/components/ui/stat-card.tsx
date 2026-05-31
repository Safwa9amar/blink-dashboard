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
  primary: { bg: "bg-soft-pink border-soft-border", text: "text-primary", iconBg: "bg-primary/15" },
  success: { bg: "bg-success-light/60 border-success/20", text: "text-success", iconBg: "bg-success/15" },
  info: { bg: "bg-info-light/60 border-info/20", text: "text-info", iconBg: "bg-info/15" },
  warning: { bg: "bg-warning-light border-warning/20", text: "text-warning", iconBg: "bg-warning/15" },
  danger: { bg: "bg-danger-light/60 border-danger/20", text: "text-danger", iconBg: "bg-danger/15" },
  default: { bg: "bg-card border-border", text: "text-text", iconBg: "bg-muted" },
};

function renderIcon(icon: ReactNode | string) {
  if (icon == null || icon === false) return null;
  if (typeof icon === "string") return <DashIcon name={icon} className="w-5 h-5" />;
  if (isValidElement(icon)) return icon;
  return null;
}

export function StatCard({ label, value, variant = "primary", icon, change }: StatCardProps) {
  const styles = variantStyles[variant];
  const iconNode = renderIcon(icon);

  return (
    <div className={`rounded-2xl border p-5 ${styles.bg}`}>
      <div className="flex items-center justify-between mb-3">
        <p className={`text-sm font-medium ${styles.text} opacity-85`}>{label}</p>
        {iconNode && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${styles.iconBg} ${styles.text}`}>
            {iconNode}
          </div>
        )}
      </div>
      <p className={`text-3xl font-bold leading-none ${styles.text}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {change && <p className="text-xs text-subtext mt-1.5">{change}</p>}
    </div>
  );
}
