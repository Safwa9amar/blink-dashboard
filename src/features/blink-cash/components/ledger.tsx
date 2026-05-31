"use client";

import { useState } from "react";
import { Button, SearchBox, DataTable, FilterPills } from "@/components/ui";
import { BCStats } from "./bc-stats";
import { ledgerColumns } from "./ledger-columns";
import type { BlinkTransaction, TFn } from "../types";

export function Ledger({ t, txns, error }: { t: TFn; txns: BlinkTransaction[] | null; error?: string }) {
  const [f, setF] = useState<string>("all");
  const filters: [string, string][] = [
    ["all", t("f.all")],
    ["deposit", t("f.deposits")],
    ["withdrawal", t("f.withdrawals")],
  ];
  const rows = f === "all" ? (txns ?? []) : (txns ?? []).filter((r) => r.type === f);
  return (
    <>
      <BCStats t={t} />
      <div className="flex items-center gap-3 mb-[18px]">
        <SearchBox placeholder={t("ledger.search")} />
        <Button icon="download" className="ms-auto">
          {t("export")}
        </Button>
      </div>
      <FilterPills options={filters} value={f} onChange={setF} />
      <DataTable columns={ledgerColumns(t)} data={rows} error={error} empty={t("ledger.empty")} />
    </>
  );
}
