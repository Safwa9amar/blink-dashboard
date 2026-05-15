type StatVariant = "primary" | "success" | "info" | "warning" | "danger";

interface StatCardProps {
  label: string;
  value: string | number;
  variant?: StatVariant;
  icon?: React.ReactNode;
  change?: string;
}

const variantStyles: Record<StatVariant, { bg: string; text: string; iconBg: string }> = {
  primary: { bg: "bg-soft-pink border-soft-border", text: "text-primary", iconBg: "bg-primary/15" },
  success: { bg: "bg-success-light/50 border-success/20", text: "text-success", iconBg: "bg-success/15" },
  info: { bg: "bg-info-light/50 border-info/20", text: "text-info", iconBg: "bg-info/15" },
  warning: { bg: "bg-warning-light border-warning/20", text: "text-warning", iconBg: "bg-warning/15" },
  danger: { bg: "bg-danger-light/50 border-danger/20", text: "text-danger", iconBg: "bg-danger/15" },
};

export function StatCard({ label, value, variant = "primary", icon, change }: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className={`rounded-2xl border p-5 ${styles.bg}`}>
      <div className="flex items-center justify-between mb-3">
        <p className={`text-sm font-medium ${styles.text} opacity-80`}>{label}</p>
        {icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${styles.iconBg}`}>
            <span className={styles.text}>{icon}</span>
          </div>
        )}
      </div>
      <p className={`text-3xl font-bold ${styles.text}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {change && (
        <p className="text-xs text-subtext mt-1">{change}</p>
      )}
    </div>
  );
}
