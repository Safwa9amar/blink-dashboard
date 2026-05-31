import type { ReactNode } from "react";

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function CardHeader({ title, description, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-base font-bold text-text">{title}</h3>
        {description && <p className="text-[13px] text-subtext mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  );
}

interface CardProps {
  children?: ReactNode;
  className?: string;
  padding?: boolean;
  /** When provided, an inline CardHeader is rendered above the body. */
  title?: string;
  description?: string;
  action?: ReactNode;
  bodyClassName?: string;
}

export function Card({
  children,
  className = "",
  padding = true,
  title,
  description,
  action,
  bodyClassName = "",
}: CardProps) {
  const hasHeader = title || description || action;
  return (
    <div className={`bg-card border border-border rounded-2xl ${padding ? "p-[22px]" : ""} ${className}`}>
      {hasHeader && <CardHeader title={title ?? ""} description={description} action={action} />}
      {hasHeader ? <div className={bodyClassName}>{children}</div> : children}
    </div>
  );
}
