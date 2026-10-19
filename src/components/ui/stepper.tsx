"use client";

import { useState } from "react";
import { DashIcon } from "./icons";
import { toAsciiDigits } from "./primitives";

/**
 * Whole-number input with − / + buttons, clamped to [min, max]. Typing is free (the
 * field may be briefly empty or out of range); the value commits when it is a valid
 * number in range, and snaps back into range on blur. Arabic-Indic digits typed in
 * the Arabic UI are read as 0-9.
 */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = 999,
  label,
  labels = { decrease: "Decrease", increase: "Increase" },
  disabled,
  invalid,
  className = "",
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Accessible name of the number field. */
  label?: string;
  /** Accessible names of the − / + buttons. */
  labels?: { decrease: string; increase: string };
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
}) {
  const [text, setText] = useState(String(value));
  // Re-sync the field when the value changes from outside (± buttons, reset).
  const [shown, setShown] = useState(value);
  if (shown !== value) {
    setShown(value);
    setText(String(value));
  }

  const clamp = (n: number) => Math.min(max, Math.max(min, Math.trunc(n)));
  const commit = (n: number) => {
    const next = clamp(n);
    setText(String(next));
    if (next !== value) onChange(next);
  };

  const btn =
    "w-8 h-full inline-flex items-center justify-center text-subtext hover:text-text hover:bg-card-hover transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div
      className={`inline-flex items-center h-8 rounded-lg border bg-background overflow-hidden ${
        invalid ? "border-danger" : "border-border"
      } ${disabled ? "opacity-60" : ""} ${className}`}
    >
      <button
        type="button"
        className={btn}
        aria-label={labels.decrease}
        disabled={disabled || !(value > min)}
        onClick={() => commit(Number.isFinite(value) ? value - 1 : min)}
      >
        <DashIcon name="minus" className="w-3.5 h-3.5" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        dir="ltr"
        aria-label={label}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        value={text}
        onChange={(e) => {
          const raw = toAsciiDigits(e.target.value).replace(/[^0-9]/g, "").slice(0, String(max).length + 1);
          setText(raw);
          if (raw === "") return;
          const n = Number(raw);
          if (n >= min && n <= max) {
            if (n !== value) onChange(n);
          } else if (n > max) commit(n);
        }}
        onBlur={() => (text === "" ? setText(String(value)) : commit(Number(text)))}
        className="w-11 h-full bg-transparent text-center text-[13px] text-text tabular-nums outline-none border-x border-border"
      />
      <button
        type="button"
        className={btn}
        aria-label={labels.increase}
        disabled={disabled || !(value < max)}
        onClick={() => commit(Number.isFinite(value) ? value + 1 : min)}
      >
        <DashIcon name="plus" className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
