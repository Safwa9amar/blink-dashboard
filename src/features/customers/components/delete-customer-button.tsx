"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { deleteCustomer } from "@/app/d/customers/action";

export function DeleteCustomerButton({ customerId }: { customerId: string }) {
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("customers");

  function handleDelete() {
    startTransition(async () => {
      await deleteCustomer(customerId);
      setConfirm(false);
    });
  }

  return (
    <>
      <button
        onClick={() => setConfirm(true)}
        className="p-1.5 rounded-lg hover:bg-[var(--danger-light)] text-[var(--subtext)] hover:text-[var(--danger)] transition-colors cursor-pointer"
        title={t("delete")}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
      </button>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirm(false)} />
          <div className="relative bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-bold text-[var(--text)] mb-2">{t("delete_customer")}</h2>
            <p className="text-sm text-[var(--subtext)] mb-6">{t("delete_confirm")}</p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => setConfirm(false)}>
                {t("cancel")}
              </Button>
              <Button variant="danger" size="sm" loading={isPending} onClick={handleDelete}>
                {isPending ? t("deleting") : t("delete")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
