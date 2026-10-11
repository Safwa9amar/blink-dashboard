import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** `action` and `actions` are interchangeable; `actions` is the dashboard alias. */
  action?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, action, actions }: PageHeaderProps) {
  const trailing = action ?? actions;
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl font-semibold text-text tracking-tight">{title}</h1>
        {description && <p className="text-subtext text-[13px] mt-1">{description}</p>}
      </div>
      {trailing && <div className="flex gap-2.5 shrink-0">{trailing}</div>}
    </div>
  );
}
