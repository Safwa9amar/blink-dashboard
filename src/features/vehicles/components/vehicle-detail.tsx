"use client";

import { useEffect } from "react";
import { Badge, Button, DashIcon } from "@/components/ui";
import {
  VEHICLE_TYPE,
  VEHICLE_CATEGORY,
  DOC_KEYS,
  REQUIRED_DOCS,
  docStatusOf,
  vehicleCompliance,
  type Vehicle,
  type DocStatus,
  type TFn,
} from "../data";
import { useVehiclesStore } from "../store";
import { DocStatusBadge } from "./doc-status-badge";

// Right-side slide-over showing a vehicle's full profile: rider, specs and the
// three embedded documents, each with inline approve / needs-update / pending review.
export function VehicleDetail({
  t,
  vehicle,
  onClose,
  onEdit,
}: {
  t: TFn;
  vehicle: Vehicle | null;
  onClose: () => void;
  onEdit: (v: Vehicle) => void;
}) {
  const setDocStatus = useVehiclesStore((s) => s.setDocStatus);
  // Re-read the live record so review actions reflect immediately.
  const live = useVehiclesStore((s) =>
    vehicle ? (s.vehicles.find((v) => v.id === vehicle.id) ?? vehicle) : null
  );

  useEffect(() => {
    if (!vehicle) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [vehicle, onClose]);

  if (!live) return null;

  const required = REQUIRED_DOCS[live.vehicleType];
  const compliance = vehicleCompliance(live);

  const specRow = (label: string, value: string) => (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-subtext">{label}</span>
      <span className="text-sm font-medium text-text">{value || "—"}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <aside className="absolute end-0 top-0 h-full w-full max-w-md bg-card border-s border-border shadow-2xl flex flex-col">
        {/* header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 shrink-0 rounded-xl bg-soft-pink text-primary inline-flex items-center justify-center">
              <DashIcon name="bike" className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-text">
                {live.brand} {live.model}
              </h3>
              <div className="text-xs text-subtext">
                {live.riderName} · {live.riderCode}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("form.cancel")}
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-subtext hover:text-text hover:bg-card-hover transition-colors cursor-pointer"
          >
            <DashIcon name="x" className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* status pills */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={VEHICLE_TYPE[live.vehicleType]}>{t("type." + live.vehicleType)}</Badge>
            <Badge variant={VEHICLE_CATEGORY[live.category]}>{t("category." + live.category)}</Badge>
            <DocStatusBadge t={t} status={compliance} />
          </div>

          {/* specs */}
          <section>
            <h4 className="text-[11px] font-bold text-subtext uppercase tracking-wider mb-2">
              {t("detail.specs")}
            </h4>
            <div className="rounded-xl border border-border bg-background px-3.5">
              {specRow(t("form.brand"), live.brand)}
              {specRow(t("form.model"), live.model)}
              {specRow(t("form.plate"), live.licensePlate)}
              {specRow(t("form.year"), live.year)}
              {specRow(t("form.color"), live.color)}
              {specRow(t("form.wilaya"), live.wilaya)}
            </div>
          </section>

          {/* documents */}
          <section>
            <h4 className="text-[11px] font-bold text-subtext uppercase tracking-wider mb-2">
              {t("detail.documents")}
            </h4>
            {required.length === 0 ? (
              <p className="text-sm text-subtext rounded-xl border border-border bg-background p-3.5">
                {t("detail.no_docs")}
              </p>
            ) : (
              <div className="space-y-2.5">
                {DOC_KEYS.filter((k) => required.includes(k)).map((key) => (
                  <DocReviewBlock
                    key={key}
                    t={t}
                    label={t("doc." + key)}
                    status={docStatusOf(live, key)}
                    onSet={(status) => setDocStatus(live.id, key, status)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* footer */}
        <div className="p-5 border-t border-border flex gap-2.5">
          <Button variant="secondary" className="flex-1" onClick={() => onEdit(live)} icon="pencil">
            {t("detail.edit")}
          </Button>
          <Button className="flex-1" onClick={onClose}>
            {t("detail.done")}
          </Button>
        </div>
      </aside>
    </div>
  );
}

// One document row with its current status and the three review actions.
function DocReviewBlock({
  t,
  label,
  status,
  onSet,
}: {
  t: TFn;
  label: string;
  status: DocStatus;
  onSet: (status: DocStatus) => void;
}) {
  const actions: { to: DocStatus; label: string; cls: string }[] = [
    { to: "approved", label: t("review.approve"), cls: "text-success hover:bg-success-light" },
    { to: "needs_update", label: t("review.needs_update"), cls: "text-danger hover:bg-danger-light" },
    { to: "pending", label: t("review.pending"), cls: "text-warning hover:bg-warning-light" },
  ];
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-text">{label}</span>
        <DocStatusBadge t={t} status={status} />
      </div>
      <div className="flex gap-1.5">
        {actions.map((a) => (
          <button
            key={a.to}
            type="button"
            disabled={status === a.to}
            onClick={() => onSet(a.to)}
            className={`flex-1 text-xs font-semibold rounded-lg border border-border px-2 py-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${a.cls}`}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
