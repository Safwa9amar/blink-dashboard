"use client";

import { Badge, Button, DashIcon } from "@/components/ui";
import { formatDateTime } from "../queue";
import type { AgentQueueItem } from "../partners";
import type { TFn } from "../types";

const VIEW_VARIANT = { pending: "warning", rejected: "danger" } as const;

export function AgentTable({
  t,
  locale,
  agents,
  onSelectAgent,
}: {
  t: TFn;
  locale: string;
  agents: AgentQueueItem[];
  onSelectAgent: (agent: AgentQueueItem) => void;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-start text-xs border-collapse">
          <thead>
            <tr className="bg-muted/60 border-b border-border/70 text-subtext uppercase font-bold text-[11px] tracking-wider text-start">
              <th scope="col" className="py-3 px-4 text-start font-bold">Agent / Applicant</th>
              <th scope="col" className="py-3 px-4 text-start font-bold hidden sm:table-cell">Phone</th>
              <th scope="col" className="py-3 px-4 text-start font-bold hidden md:table-cell">Fiscal (NIF / NIS)</th>
              <th scope="col" className="py-3 px-4 text-start font-bold">Status</th>
              <th scope="col" className="py-3 px-4 text-start font-bold hidden lg:table-cell">Shops</th>
              <th scope="col" className="py-3 px-4 text-start font-bold hidden xl:table-cell">Submitted</th>
              <th scope="col" className="py-3 px-4 text-end font-bold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {agents.map((a) => {
              const name = a.name || t("unnamed");

              return (
                <tr
                  key={a.id}
                  onClick={() => onSelectAgent(a)}
                  className="hover:bg-card-hover/80 cursor-pointer transition-colors group"
                >
                  <td className="py-3.5 px-4 min-w-[180px]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 border border-primary/20 text-xs">
                        {(name || "AG").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-sm text-text group-hover:text-primary transition-colors block truncate">
                          {name}
                        </span>
                        <span className="text-[11px] text-subtext truncate block mt-0.5">
                          {a.agentId || "—"}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 hidden sm:table-cell">
                    <span className="font-mono text-subtext text-[11px]" dir="ltr">
                      {a.phone || "—"}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 hidden md:table-cell">
                    <span className="text-subtext font-mono text-[11px]" dir="ltr">
                      {[a.nif && `NIF ${a.nif}`, a.nis && `NIS ${a.nis}`].filter(Boolean).join(" · ") || "—"}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge variant={VIEW_VARIANT[a.view]}>{t(`partners.agent.filter.${a.view}`)}</Badge>
                  </td>

                  <td className="py-3.5 px-4 hidden lg:table-cell">
                    <span className="text-text font-medium text-[11px]">
                      {a.shops.length} {a.shops.length === 1 ? "Shop" : "Shops"}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 hidden xl:table-cell text-subtext text-[11px] whitespace-nowrap">
                    {formatDateTime(a.submittedAt, locale)}
                  </td>

                  <td className="py-3.5 px-4 text-end">
                    <Button
                      size="xs"
                      variant="outline"
                      className="group-hover:border-primary group-hover:text-primary transition-colors inline-flex items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAgent(a);
                      }}
                    >
                      <span>Inspect</span>
                      <DashIcon name="chevron-right" className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
