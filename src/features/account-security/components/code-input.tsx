"use client";

import { normalizeCode } from "../helpers";

const INPUT =
  "w-full px-4 py-3 bg-background border border-border rounded-xl text-text text-center text-xl tracking-[0.4em] placeholder-subtext/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all";

export function CodeInput({
  id,
  label,
  value,
  onChange,
  autoFocus,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-subtext mb-1.5">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        dir="ltr"
        maxLength={6}
        placeholder="000000"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(normalizeCode(e.target.value))}
        className={INPUT}
      />
    </div>
  );
}
