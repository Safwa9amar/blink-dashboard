import type { ReactNode } from "react";

export function FormRow({
  label,
  hint,
  children,
  className = "",
}: {
  label?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-5 ${className}`}>
      {label && (
        <label className="block text-[12.5px] font-bold text-text mb-2">
          {label}
          {hint && <span className="text-[11.5px] text-subtext font-normal ms-2">{hint}</span>}
        </label>
      )}
      {children}
    </div>
  );
}
