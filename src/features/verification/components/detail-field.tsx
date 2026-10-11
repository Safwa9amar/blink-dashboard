import type { ReactNode } from "react";

/** A small label-over-value pair in an applicant's details grid. */
export function DetailField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <dt className="text-xs text-subtext mb-0.5">{label}</dt>
      <dd className="text-sm text-text break-words">{children}</dd>
    </div>
  );
}
