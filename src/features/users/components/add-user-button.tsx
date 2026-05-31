"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { createUser } from "@/app/d/users/action";
import { roles } from "./user-form";

export function AddUserButton() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("users");

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        {t("add_user")}
      </Button>

      {open && <AddUserModal onClose={() => setOpen(false)} />}
    </>
  );
}

function AddUserModal({ onClose }: { onClose: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("customer");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("users");

  function handleCreate() {
    if (!phone.trim()) {
      setError("Phone number is required");
      return;
    }
    startTransition(async () => {
      const result = await createUser({
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        email: email || undefined,
        phone_number: phone,
        role,
      });
      if (result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-bold text-[var(--text)] mb-1">{t("add_user")}</h2>
        <p className="text-sm text-[var(--subtext)] mb-5">{t("add_user_desc")}</p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--subtext)] mb-1">{t("first_name")}</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--subtext)] mb-1">{t("last_name")}</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--subtext)] mb-1">{t("phone_number")} *</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+213..."
              className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--subtext)] mb-1">{t("email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--subtext)] mb-1">{t("role")}</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 cursor-pointer"
            >
              {roles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="px-3 py-2 bg-[var(--danger-light)] border border-[var(--danger)]/20 rounded-xl">
              <p className="text-[var(--danger)] text-sm">{error}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button variant="primary" size="sm" loading={isPending} onClick={handleCreate}>
            {isPending ? t("creating") : t("create")}
          </Button>
        </div>
      </div>
    </div>
  );
}
