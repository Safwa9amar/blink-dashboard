"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { updateAgent } from "@/app/d/agents/action";
import type { Agent } from "../types";

export function EditAgentButton({ agent }: { agent: Agent }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("agents");

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 rounded-lg hover:bg-[var(--card-hover)] text-[var(--subtext)] hover:text-[var(--text)] transition-colors cursor-pointer"
        title={t("edit_agent")}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
      </button>

      {open && <EditAgentModal agent={agent} onClose={() => setOpen(false)} />}
    </>
  );
}

function EditAgentModal({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const [firstName, setFirstName] = useState(agent.first_name ?? "");
  const [lastName, setLastName] = useState(agent.last_name ?? "");
  const [email, setEmail] = useState(agent.email ?? "");
  const [wilaya, setWilaya] = useState(agent.wilaya ?? "");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("agents");

  function handleSave() {
    startTransition(async () => {
      const result = await updateAgent(agent.id, {
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        email: email || undefined,
        wilaya: wilaya || undefined,
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
        <h2 className="text-lg font-bold text-[var(--text)] mb-5">{t("edit_agent")}</h2>

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
            <label className="block text-sm font-medium text-[var(--subtext)] mb-1">{t("email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--subtext)] mb-1">{t("wilaya")}</label>
            <input
              value={wilaya}
              onChange={(e) => setWilaya(e.target.value)}
              className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
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
          <Button variant="primary" size="sm" loading={isPending} onClick={handleSave}>
            {isPending ? t("saving") : t("save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
