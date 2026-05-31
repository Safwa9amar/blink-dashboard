import { ButtonHTMLAttributes, forwardRef, isValidElement, type ReactNode } from "react";
import { DashIcon } from "./icons";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost";
type ButtonSize = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** A ReactNode rendered as-is, or a DashIcon name (string). */
  icon?: ReactNode | string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary hover:bg-primary-hover text-white",
  secondary: "bg-card hover:bg-card-hover text-text border border-border",
  outline: "bg-transparent border-[1.5px] border-primary text-primary hover:bg-primary/10",
  danger: "bg-danger hover:bg-red-600 text-white",
  ghost: "bg-transparent hover:bg-card text-subtext hover:text-text",
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: "h-7 px-3 text-xs rounded-lg gap-1",
  sm: "h-9 px-4 text-sm rounded-xl gap-1.5 font-semibold",
  md: "h-12 px-5 text-[15px] rounded-3xl gap-2 font-bold",
  lg: "h-14 px-6 text-[17px] rounded-[28px] gap-2.5 font-extrabold",
};

function renderIcon(icon: ReactNode | string) {
  if (icon == null || icon === false) return null;
  if (typeof icon === "string") return <DashIcon name={icon} className="w-4 h-4" />;
  if (isValidElement(icon)) return icon;
  return null;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, icon, children, className = "", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          renderIcon(icon)
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
