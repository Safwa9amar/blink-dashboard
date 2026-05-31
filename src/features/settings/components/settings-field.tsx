"use client";

// Reusable form field components for settings

import type { InputFieldProps, SelectFieldProps, ToggleFieldProps, SectionCardProps } from "../types";

export function InputField({ label, value, onChange, type = "text", placeholder }: InputFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--subtext)] mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all"
      />
    </div>
  );
}

export function SelectField({ label, value, onChange, options }: SelectFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--subtext)] mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 cursor-pointer transition-all"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export function ToggleField({ label, description, checked, onChange }: ToggleFieldProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-[var(--text)]">{label}</p>
        {description && <p className="text-xs text-[var(--subtext)] mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
          checked ? "bg-[var(--success)]" : "bg-[var(--border)]"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

export function SectionCard({ title, description, children, footer }: SectionCardProps) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-[var(--text)]">{title}</h3>
        <p className="text-sm text-[var(--subtext)] mt-1 mb-6">{description}</p>
        {children}
      </div>
      {footer && (
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end">
          {footer}
        </div>
      )}
    </div>
  );
}
