"use client";

import { useState } from "react";
import {
  Button,
  Badge,
  SearchBox,
  FilterPills,
  DataTable,
  DashIcon,
  type Column,
} from "@/components/ui";
import {
  VEHICLE_TYPE,
  VEHICLE_CATEGORY,
  VEHICLE_TYPE_KEYS,
  vehicleCompliance,
  type Vehicle,
  type VehicleType,
  type TFn,
} from "../data";
import { useVehiclesStore } from "../store";
import { VehicleCell } from "./vehicle-cell";
import { DocStatusBadge } from "./doc-status-badge";
import { VehicleForm } from "./vehicle-form";
import { VehicleDetail } from "./vehicle-detail";

export function FleetTable({ t }: { t: TFn }) {
  const vehicles = useVehiclesStore((s) => s.vehicles);
  const deleteVehicle = useVehiclesStore((s) => s.deleteVehicle);

  const [q, setQ] = useState("");
  const [tf, setTf] = useState<VehicleType | "all">("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [viewing, setViewing] = useState<Vehicle | null>(null);

  const newVehicle = () => {
    setEditing(null);
    setOpen(true);
  };
  const editVehicle = (v: Vehicle) => {
    setViewing(null);
    setEditing(v);
    setOpen(true);
  };

  const columns: Column<Vehicle>[] = [
    {
      key: "model",
      label: t("col.vehicle"),
      render: (r) => (
        <VehicleCell title={`${r.brand} ${r.model}`} sub={r.licensePlate || t("col.no_plate")} type={r.vehicleType} />
      ),
    },
    {
      key: "riderName",
      label: t("col.rider"),
      render: (r) => (
        <div className="flex flex-col">
          <span className="text-text">{r.riderName}</span>
          <span className="text-xs text-primary font-mono">{r.riderCode}</span>
        </div>
      ),
    },
    { key: "wilaya", label: t("col.wilaya") },
    {
      key: "vehicleType",
      label: t("col.type"),
      render: (r) => <Badge variant={VEHICLE_TYPE[r.vehicleType]}>{t("type." + r.vehicleType)}</Badge>,
    },
    {
      key: "category",
      label: t("col.category"),
      render: (r) => <Badge variant={VEHICLE_CATEGORY[r.category]}>{t("category." + r.category)}</Badge>,
    },
    {
      key: "compliance",
      label: t("col.compliance"),
      sortable: false,
      render: (r) => <DocStatusBadge t={t} status={vehicleCompliance(r)} />,
    },
    {
      key: "actions",
      label: t("col.actions"),
      sortable: false,
      render: (r) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewing(r)}
            aria-label={t("view")}
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-subtext hover:text-text hover:bg-card-hover transition-colors cursor-pointer"
          >
            <DashIcon name="search" className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editVehicle(r)}
            aria-label={t("edit")}
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-subtext hover:text-text hover:bg-card-hover transition-colors cursor-pointer"
          >
            <DashIcon name="pencil" className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm(t("confirm.delete"))) deleteVehicle(r.id);
            }}
            aria-label={t("delete")}
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-subtext hover:text-danger hover:bg-card-hover transition-colors cursor-pointer"
          >
            <DashIcon name="trash" className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const rows = vehicles
    .filter((v) => (tf === "all" ? true : v.vehicleType === tf))
    .filter((v) =>
      q
        ? `${v.brand} ${v.model} ${v.riderName} ${v.riderCode} ${v.licensePlate}`
            .toLowerCase()
            .includes(q.toLowerCase())
        : true
    );

  const filtered = tf !== "all" || q !== "";
  const filterOptions: [VehicleType | "all", string][] = [
    ["all", t("all")],
    ...VEHICLE_TYPE_KEYS.map((k) => [k, t("type." + k)] as [VehicleType, string]),
  ];

  return (
    <>
      <div className="flex items-center gap-3 mb-[18px]">
        <SearchBox placeholder={t("search")} value={q} onChange={setQ} />
        <Button icon="plus" className="ms-auto" onClick={newVehicle}>
          {t("new_vehicle")}
        </Button>
      </div>
      <FilterPills options={filterOptions} value={tf} onChange={setTf} />
      <DataTable columns={columns} data={rows} empty={t(filtered ? "empty.filtered" : "empty.all")} />
      <VehicleForm t={t} open={open} vehicle={editing} onClose={() => setOpen(false)} />
      <VehicleDetail t={t} vehicle={viewing} onClose={() => setViewing(null)} onEdit={editVehicle} />
    </>
  );
}
