// blink_cash_settings (spec §3): row normaliser, form <-> payload mapping and
// validation. Pure. The server re-validates; this only avoids obvious round-trips.

export const ACCOUNT_TYPES = ["ccp", "baridimob", "rip", "bank"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export interface ElectronicAccount {
  label: string;
  type: AccountType;
  number: string;
  holder: string;
}
export interface DuesMethod {
  id: string;
  label: string;
}

export interface BlinkCashSettings {
  deposit_fee_rate: number;
  withdrawal_fee_rate: number;
  min_amount: number;
  max_amount: number;
  daily_deposit_limit: number;
  daily_withdrawal_limit: number;
  monthly_deposit_limit: number;
  monthly_withdrawal_limit: number;
  pending_expiry_minutes: number;
  agent_credit_limit: number;
  electronic_enabled: boolean;
  electronic_accounts: ElectronicAccount[];
  require_pin_for_withdrawal: boolean;
  quick_amounts: number[];
  dues_payment_methods: DuesMethod[];
  adjust_limit_finance_admin: number;
  updated_by?: string | null;
  updated_at?: string | null;
}

/** Spec §3 defaults — used for display while the row can't be read. */
export const SETTINGS_DEFAULTS: BlinkCashSettings = {
  deposit_fee_rate: 0.02,
  withdrawal_fee_rate: 0.02,
  min_amount: 1000,
  max_amount: 100000,
  daily_deposit_limit: 200000,
  daily_withdrawal_limit: 100000,
  monthly_deposit_limit: 1000000,
  monthly_withdrawal_limit: 500000,
  pending_expiry_minutes: 15,
  agent_credit_limit: 200000,
  electronic_enabled: false,
  electronic_accounts: [],
  require_pin_for_withdrawal: false,
  quick_amounts: [1000, 2000, 5000, 10000],
  dues_payment_methods: [],
  adjust_limit_finance_admin: 50000,
};

const num = (v: unknown, d: number) => {
  const n = Number(v);
  return v !== null && v !== "" && Number.isFinite(n) ? n : d;
};
const arr = <T>(v: unknown, f: (x: Record<string, unknown>) => T | null): T[] =>
  Array.isArray(v) ? v.map((x) => (x && typeof x === "object" ? f(x as Record<string, unknown>) : null)).filter((x): x is T => x !== null) : [];

export function normalizeSettings(row: Record<string, unknown> | null | undefined): BlinkCashSettings {
  const r = row ?? {};
  const d = SETTINGS_DEFAULTS;
  return {
    deposit_fee_rate: num(r.deposit_fee_rate, d.deposit_fee_rate),
    withdrawal_fee_rate: num(r.withdrawal_fee_rate, d.withdrawal_fee_rate),
    min_amount: num(r.min_amount, d.min_amount),
    max_amount: num(r.max_amount, d.max_amount),
    daily_deposit_limit: num(r.daily_deposit_limit, d.daily_deposit_limit),
    daily_withdrawal_limit: num(r.daily_withdrawal_limit, d.daily_withdrawal_limit),
    monthly_deposit_limit: num(r.monthly_deposit_limit, d.monthly_deposit_limit),
    monthly_withdrawal_limit: num(r.monthly_withdrawal_limit, d.monthly_withdrawal_limit),
    pending_expiry_minutes: num(r.pending_expiry_minutes, d.pending_expiry_minutes),
    agent_credit_limit: num(r.agent_credit_limit, d.agent_credit_limit),
    electronic_enabled: r.electronic_enabled === true,
    electronic_accounts: arr(r.electronic_accounts, (a) => ({
      label: String(a.label ?? ""),
      type: (ACCOUNT_TYPES as readonly string[]).includes(String(a.type)) ? (a.type as AccountType) : "ccp",
      number: String(a.number ?? ""),
      holder: String(a.holder ?? ""),
    })),
    require_pin_for_withdrawal: r.require_pin_for_withdrawal === true,
    quick_amounts: Array.isArray(r.quick_amounts) ? r.quick_amounts.map(Number).filter((n) => Number.isFinite(n)) : d.quick_amounts,
    dues_payment_methods: arr(r.dues_payment_methods, (m) => ({ id: String(m.id ?? ""), label: String(m.label ?? "") })),
    adjust_limit_finance_admin: num(r.adjust_limit_finance_admin, d.adjust_limit_finance_admin),
    updated_by: typeof r.updated_by === "string" ? r.updated_by : null,
    updated_at: typeof r.updated_at === "string" ? r.updated_at : null,
  };
}

/** "2%" / "0.2%" — a fee rate as a percentage label (no float noise). */
export const ratePct = (rate: number) => `${Math.round(rate * 10000) / 100}%`;

// ── form ────────────────────────────────────────────────────────────────────
export interface SettingsForm {
  deposit_fee_pct: string;
  withdrawal_fee_pct: string;
  min_amount: string;
  max_amount: string;
  daily_deposit_limit: string;
  daily_withdrawal_limit: string;
  monthly_deposit_limit: string;
  monthly_withdrawal_limit: string;
  pending_expiry_minutes: string;
  agent_credit_limit: string;
  electronic_enabled: boolean;
  electronic_accounts: ElectronicAccount[];
  require_pin_for_withdrawal: boolean;
  quick_amounts: string;
  dues_payment_methods: DuesMethod[];
  adjust_limit_finance_admin: string;
}

export function toSettingsForm(s: BlinkCashSettings): SettingsForm {
  return {
    deposit_fee_pct: String(Math.round(s.deposit_fee_rate * 10000) / 100),
    withdrawal_fee_pct: String(Math.round(s.withdrawal_fee_rate * 10000) / 100),
    min_amount: String(s.min_amount),
    max_amount: String(s.max_amount),
    daily_deposit_limit: String(s.daily_deposit_limit),
    daily_withdrawal_limit: String(s.daily_withdrawal_limit),
    monthly_deposit_limit: String(s.monthly_deposit_limit),
    monthly_withdrawal_limit: String(s.monthly_withdrawal_limit),
    pending_expiry_minutes: String(s.pending_expiry_minutes),
    agent_credit_limit: String(s.agent_credit_limit),
    electronic_enabled: s.electronic_enabled,
    electronic_accounts: s.electronic_accounts.map((a) => ({ ...a })),
    require_pin_for_withdrawal: s.require_pin_for_withdrawal,
    quick_amounts: s.quick_amounts.join(", "),
    dues_payment_methods: s.dues_payment_methods.map((m) => ({ ...m })),
    adjust_limit_finance_admin: String(s.adjust_limit_finance_admin),
  };
}

export type SettingsPayload = Omit<BlinkCashSettings, "updated_by" | "updated_at">;
export type SettingsErrors = Partial<Record<keyof SettingsForm, string>>;

const parseNum = (s: string) => (s.trim() === "" ? NaN : Number(s.replace(/\s/g, "").replace(",", ".")));

export function validateSettings(f: SettingsForm): { ok: true; payload: SettingsPayload } | { ok: false; errors: SettingsErrors } {
  const errors: SettingsErrors = {};
  const pct = (k: "deposit_fee_pct" | "withdrawal_fee_pct") => {
    const n = parseNum(f[k]);
    if (!(n >= 0 && n <= 50)) errors[k] = "err_pct";
    return Math.round((n / 100) * 1e6) / 1e6;
  };
  const money = (k: keyof SettingsForm, allowZero = true) => {
    const n = parseNum(String(f[k]));
    if (!Number.isFinite(n) || n < 0 || (!allowZero && n === 0)) errors[k] = "err_amount";
    return n;
  };
  const deposit_fee_rate = pct("deposit_fee_pct");
  const withdrawal_fee_rate = pct("withdrawal_fee_pct");
  const min_amount = money("min_amount", false);
  const max_amount = money("max_amount", false);
  if (!errors.min_amount && !errors.max_amount && max_amount < min_amount) errors.max_amount = "err_max_lt_min";
  const daily_deposit_limit = money("daily_deposit_limit");
  const daily_withdrawal_limit = money("daily_withdrawal_limit");
  const monthly_deposit_limit = money("monthly_deposit_limit");
  const monthly_withdrawal_limit = money("monthly_withdrawal_limit");
  if (!errors.daily_deposit_limit && !errors.monthly_deposit_limit && monthly_deposit_limit < daily_deposit_limit)
    errors.monthly_deposit_limit = "err_month_lt_day";
  if (!errors.daily_withdrawal_limit && !errors.monthly_withdrawal_limit && monthly_withdrawal_limit < daily_withdrawal_limit)
    errors.monthly_withdrawal_limit = "err_month_lt_day";
  const pending_expiry_minutes = parseNum(f.pending_expiry_minutes);
  if (!Number.isInteger(pending_expiry_minutes) || pending_expiry_minutes < 1 || pending_expiry_minutes > 1440)
    errors.pending_expiry_minutes = "err_expiry";
  const agent_credit_limit = money("agent_credit_limit");
  const adjust_limit_finance_admin = money("adjust_limit_finance_admin");

  const quick_amounts = f.quick_amounts
    .split(/[,;\s]+/)
    .filter(Boolean)
    .map(Number);
  if (!quick_amounts.length || quick_amounts.some((n) => !Number.isInteger(n) || n <= 0)) errors.quick_amounts = "err_quick";

  let accountsBad = f.electronic_accounts.some(
    (a) => !a.label.trim() || !a.number.trim() || !a.holder.trim() || !(ACCOUNT_TYPES as readonly string[]).includes(a.type)
  );
  if (f.electronic_enabled && f.electronic_accounts.length === 0) accountsBad = true;
  if (accountsBad) errors.electronic_accounts = "err_accounts";

  const ids = f.dues_payment_methods.map((m) => m.id.trim());
  if (
    f.dues_payment_methods.some((m) => !m.id.trim() || !m.label.trim() || !/^[a-z0-9_-]+$/i.test(m.id.trim())) ||
    new Set(ids).size !== ids.length
  )
    errors.dues_payment_methods = "err_methods";

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    payload: {
      deposit_fee_rate,
      withdrawal_fee_rate,
      min_amount,
      max_amount,
      daily_deposit_limit,
      daily_withdrawal_limit,
      monthly_deposit_limit,
      monthly_withdrawal_limit,
      pending_expiry_minutes,
      agent_credit_limit,
      electronic_enabled: f.electronic_enabled,
      electronic_accounts: f.electronic_accounts.map((a) => ({
        label: a.label.trim(),
        type: a.type,
        number: a.number.trim(),
        holder: a.holder.trim(),
      })),
      require_pin_for_withdrawal: f.require_pin_for_withdrawal,
      quick_amounts,
      dues_payment_methods: f.dues_payment_methods.map((m) => ({ id: m.id.trim(), label: m.label.trim() })),
      adjust_limit_finance_admin,
    },
  };
}
