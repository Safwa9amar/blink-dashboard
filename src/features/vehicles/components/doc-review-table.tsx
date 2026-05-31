"use client";

import { useState } from "react";
import { Button, SearchBox, FilterPills, DataTable, type Column } from "@/components/ui";
import {
  buildDocRows,
  DOC_STATUS_KEYS,
  type DocRow,
  type DocStatus,
  type TFn,
} from "../data";
import { useVehiclesStore } from "../store";
import { VehicleCell } from "./vehicle-cell";
import { DocStatusBadge } from "./doc-status-badge";

// Compliance / review queue: every required document slot across the fleet, flattened
// into rows, with inline approve / needs-update / pending review actions.
export function DocReviewTable({ t }: { t: TFn }) {
  const vehicles = useVehiclesStore((s) => s.vehicles);
  const setDocStatus = useVehiclesStore((s) => s.setDocStatus);

  const [q, setQ] = useState("");
  const [sf, setSf] = useState<DocStatus | "all">("all");

  const all = buildDocRows(vehicles);

  const columns: Column<DocRow>[] = [
    {
      key: "vehicle",
      label: t("col.vehicle"),
      sortable: false,
      render: (r) => (
        <VehicleCell title={`${r.vehicle.brand} ${r.vehicle.model}`} sub={r.vehicle.riderName} type={r.vehicle.vehicleType} />
      ),
    },
    {
      key: "key",
      label: t("col.document"),
      render: (r) => <span className="text-text">{t("doc." + r.key)}</span>,
    },
    { key: "wilaya", label: t("col.wilaya"), sortable: false, render: (r) => r.vehicle.wilaya },
    {
      key: "status",
      label: t("col.status"),
      render: (r) => <DocStatusBadge t={t} status={r.status} />,
    },
    {
      key: "actions",
      label: t("col.review"),
      sortable: false,
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="xs"
            variant="secondary"
            disabled={r.status === "approved"}
            onClick={() => setDocStatus(r.vehicleId, r.key, "approved")}
          >
            {t("review.approve")}
          </Button>
          <Button
            size="xs"
            variant="secondary"
            disabled={r.status === "needs_update"}
            onClick={() => setDocStatus(r.vehicleId, r.key, "needs_update")}
          >
            {t("review.needs_update")}
          </Button>
        </div>
      ),
    },
  ];

  const rows = all
    .filter((r) => (sf === "all" ? true : r.status === sf))
    .filter((r) =>
      q
        ? `${r.vehicle.brand} ${r.vehicle.model} ${r.vehicle.riderName} ${r.vehicle.riderCode}`
            .toLowerCase()
            .includes(q.toLowerCase())
        : true
    );

  const filtered = sf !== "all" || q !== "";
  const filterOptions: [DocStatus | "all", string][] = [
    ["all", t("all")],
    ...DOC_STATUS_KEYS.map((k) => [k, t("doc_status." + k)] as [DocStatus, string]),
  ];

  return (
    <>
      <div className="flex items-center gap-3 mb-[18px]">
        <SearchBox placeholder={t("search")} value={q} onChange={setQ} />
      </div>
      <FilterPills options={filterOptions} value={sf} onChange={setSf} />
      <DataTable
        columns={columns}
        data={rows}
        keyField="id"
        empty={t(filtered ? "empty.docs_filtered" : "empty.docs")}
      />
    </>
  );
}
