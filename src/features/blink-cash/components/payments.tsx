"use client";

import { Button } from "@/components/ui";
import {
  confirmAgentPayment,
  confirmMerchantPayment,
  recordAgentPayment,
  recordMerchantPayment,
  rejectAgentPayment,
  rejectMerchantPayment,
  setAgentCreditLimit,
} from "@/app/d/blink-cash/ops-action";
import type { TFn } from "../types";
import { ActionDialog, useDialog } from "./ops-shared";

export interface PayMethod {
  id: string;
  label: string;
}

/** "Record payment": cash received outside the app, completed at once (spec §5). */
export function RecordPaymentButton({
  t,
  kind,
  partyId,
  partyName,
  methods,
  suggested,
}: {
  t: TFn;
  kind: "agent" | "merchant";
  /** Agent user id, or merchant store id. */
  partyId: string;
  partyName: string;
  methods: PayMethod[];
  suggested?: number;
}) {
  const d = useDialog();
  const list = methods.length ? methods : [{ id: "cash", label: t("pay.cash") }];
  return (
    <>
      <Button size="xs" variant="secondary" icon="dollar" onClick={d.show}>
        {t("pay.record")}
      </Button>
      <ActionDialog
        t={t}
        open={d.open}
        onClose={d.hide}
        title={t("pay.record")}
        description={t("pay.record_desc", { name: partyName })}
        confirmLabel={t("pay.record_confirm")}
        fields={[
          { key: "amount", label: t("col.amount"), kind: "number", required: true, hint: "DA", initial: suggested && suggested > 0 ? String(Math.round(suggested)) : "" },
          { key: "method", label: t("col.method"), kind: "select", options: list.map((m): [string, string] => [m.id, m.label]) },
          { key: "reference", label: t("tx.reference"), kind: "text", ltr: true, hint: t("wallet.optional") },
          { key: "note", label: t("pay.note"), kind: "textarea", hint: t("wallet.optional") },
        ]}
        onSubmit={(v) => {
          const input = { amount: Number(v.amount.replace(/\s/g, "").replace(",", ".")), method: v.method, reference: v.reference, note: v.note };
          return kind === "agent" ? recordAgentPayment(partyId, input) : recordMerchantPayment(partyId, input);
        }}
      />
    </>
  );
}

/** Confirm / Reject for a payment the app stored as pending. */
export function PendingPaymentActions({ t, kind, id }: { t: TFn; kind: "agent" | "merchant"; id: string }) {
  const rej = useDialog();
  const ok = useDialog();
  const confirm = kind === "agent" ? confirmAgentPayment : confirmMerchantPayment;
  const reject = kind === "agent" ? rejectAgentPayment : rejectMerchantPayment;
  return (
    <div className="flex gap-1.5">
      <Button size="xs" icon="check" onClick={ok.show}>
        {t("pay.confirm")}
      </Button>
      <Button size="xs" variant="danger" onClick={rej.show}>
        {t("pay.reject")}
      </Button>
      <ActionDialog
        t={t}
        open={ok.open}
        onClose={ok.hide}
        title={t("pay.confirm")}
        description={t("pay.confirm_desc")}
        confirmLabel={t("pay.confirm")}
        fields={[]}
        onSubmit={() => confirm(id)}
      />
      <ActionDialog
        t={t}
        open={rej.open}
        onClose={rej.hide}
        title={t("pay.reject")}
        description={t("pay.reject_desc")}
        confirmLabel={t("pay.reject")}
        danger
        fields={[{ key: "reason", label: t("tx.reason"), kind: "textarea", required: true, hint: t("tx.reason_hint") }]}
        onSubmit={(v) => reject(id, v.reason)}
      />
    </div>
  );
}

/** Edit an agent's cash limit; empty = fall back to the settings default. */
export function EditLimitButton({ t, agentId, name, current, fallback }: { t: TFn; agentId: string; name: string; current: number | null; fallback: number | null }) {
  const d = useDialog();
  return (
    <>
      <button type="button" onClick={d.show} className="text-xs text-primary hover:underline cursor-pointer" aria-label={t("agents.edit_limit")}>
        {t("agents.edit")}
      </button>
      <ActionDialog
        t={t}
        open={d.open}
        onClose={d.hide}
        title={t("agents.edit_limit")}
        description={t("agents.edit_limit_desc", { name, fallback: fallback === null ? "—" : String(fallback) })}
        confirmLabel={t("settings.save")}
        fields={[{ key: "limit", label: t("agents.col.limit"), kind: "number", initial: current === null ? "" : String(current), hint: t("agents.limit_blank") }]}
        onSubmit={(v) => {
          const raw = v.limit.replace(/\s/g, "").replace(",", ".");
          if (raw === "") return setAgentCreditLimit(agentId, null);
          const n = Number(raw);
          if (!Number.isFinite(n) || n < 0) return Promise.resolve({ ok: false as const, error: t("err.invalid") });
          return setAgentCreditLimit(agentId, n);
        }}
      />
    </>
  );
}
