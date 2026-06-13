import { DashIcon } from "./icons";

// A small spinning loader sized to a 16px icon, in the current text color.
export function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block rounded-full border-2 border-current border-t-transparent animate-spin ${className}`}
    />
  );
}

// Small inline "enhance with AI" affordance, absolutely positioned at the
// trailing edge of a text input / textarea / editor. The parent owns the
// relative wrapper and supplies vertical placement via `className`
// (e.g. "top-1/2 -translate-y-1/2" for an input, "bottom-2.5" for a textarea).
// Shows a spinner while `busy`.
export function EnhanceButton({
  busy,
  disabled,
  label,
  onClick,
  className = "",
}: {
  busy: boolean;
  disabled: boolean;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`absolute end-2 z-10 text-primary hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity ${className}`}
    >
      {busy ? <Spinner /> : <DashIcon name="sparkles" className="w-4 h-4" />}
    </button>
  );
}
