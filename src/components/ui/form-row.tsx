import type { ReactNode } from "react";

export function FormRow({
  label,
  hint,
  htmlFor,
  children,
  className = "",
}: {
  label?: string;
  hint?: ReactNode;
  /** The id of the field the label names. */
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-5 ${className}`}>
      {label && (
        <label htmlFor={htmlFor} className="block text-xs font-semibold text-text mb-2">
          {label}
          {hint && <span className="text-[11.5px] text-subtext font-normal ms-2">{hint}</span>}
        </label>
      )}
      {children}
    </div>
  );
}
