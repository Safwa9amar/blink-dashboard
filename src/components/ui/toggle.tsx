export function Toggle({
  on,
  onClick,
  label,
  disabled,
}: {
  on: boolean;
  onClick: () => void;
  /** Accessible name when no visible <label> points at the switch. */
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`w-11 h-[26px] rounded-full relative transition-colors shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        on ? "bg-primary" : "bg-border"
      }`}
    >
      <span
        className={`absolute top-[3px] start-[3px] w-5 h-5 rounded-full bg-white transition-transform ${
          on ? "translate-x-[18px] rtl:-translate-x-[18px]" : ""
        }`}
      />
    </button>
  );
}
