import { Button } from "./button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      {icon && (
        <div className="w-[180px] h-[180px] rounded-full bg-soft-pink flex items-center justify-center mb-6">
          <div className="w-[100px] h-[100px] rounded-3xl bg-card flex items-center justify-center -rotate-[10deg] shadow-lg">
            <span className="text-primary text-4xl">{icon}</span>
          </div>
        </div>
      )}
      <h3 className="text-xl font-bold text-text mb-2">{title}</h3>
      {description && <p className="text-subtext text-sm mb-6 max-w-sm text-center">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
