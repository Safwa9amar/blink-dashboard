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
    <div className="flex items-start justify-between gap-4 mb-7">
      <div>
        <h1 className="text-2xl font-bold text-text tracking-tight">{title}</h1>
        {description && <p className="text-subtext text-sm mt-1">{description}</p>}
      </div>
      {trailing && <div className="flex gap-2.5 shrink-0">{trailing}</div>}
    </div>
  );
}
