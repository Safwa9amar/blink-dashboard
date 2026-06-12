"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui";
import type { Agent } from "../types";

export function AgentDetailButton({ agent }: { agent: Agent }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("agents");

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 rounded-lg hover:bg-[var(--card-hover)] text-[var(--subtext)] hover:text-[var(--text)] transition-colors cursor-pointer"
        title={t("view")}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {open && <AgentDetailModal agent={agent} onClose={() => setOpen(false)} />}
    </>
  );
}

function AgentDetailModal({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const t = useTranslations("agents");
  const name = [agent.first_name, agent.last_name].filter(Boolean).join(" ") || "—";

  const rows: { label: string; value: string }[] = [
    { label: t("agent_id"), value: agent.agent_id || "—" },
    { label: t("phone"), value: agent.phone_number || "—" },
    { label: t("email"), value: agent.email || "—" },
    { label: t("gender"), value: agent.gender || "—" },
    { label: t("wilaya"), value: agent.wilaya || "—" },
    { label: t("joined"), value: new Date(agent.created_at).toLocaleDateString() },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <Avatar name={name} />
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-[var(--text)] truncate">{name}</h2>
            {agent.agent_id && (
              <p className="font-mono text-sm text-primary">{agent.agent_id}</p>
            )}
          </div>
        </div>

        <dl className="space-y-3">
          {rows.map((r) => (
            <div key={r.label} className="flex items-start justify-between gap-4">
              <dt className="text-sm text-[var(--subtext)] shrink-0">{r.label}</dt>
              <dd className="text-sm font-medium text-[var(--text)] text-end break-all">{r.value}</dd>
            </div>
          ))}
        </dl>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--subtext)] hover:text-[var(--text)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
