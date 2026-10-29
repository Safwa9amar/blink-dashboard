"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Button, Card, EmptyState, FormRow, Modal, Toggle, fInput } from "@/components/ui";
import { archiveVehicleClass, createVehicleClass, updateVehicleClass } from "@/app/d/pricing/action";
import { BASE_VEHICLES, CLASS_SERVICES, type BaseVehicle, type ClassService, type VehicleClass } from "../types";
import { COMFORT_CODE, classNameOrNull, isAppPendingClass, isClassCode, liveClasses, nextClassOrder } from "../vehicle-classes";

interface ClassForm {
  code: string;
  en: string;
  fr: string;
  ar: string;
  base_vehicle: BaseVehicle;
  services: ClassService[];
  exclusive: boolean;
  enabled: boolean;
  sort_order: string;
  note: string;
}

/** Vehicle classes: names, base vehicle, services, exclusive, enabled, order, archive. Edit controls need `canEdit`. */
export function VehiclesView({ classes, canEdit, error }: { classes: VehicleClass[]; canEdit: boolean; error?: string }) {
  const t = useTranslations("pricing");
  const locale = useLocale();
  const router = useRouter();
  const [editing, setEditing] = useState<VehicleClass | "new" | null>(null);
  const [archiving, setArchiving] = useState<VehicleClass | null>(null);
  const [archiveError, setArchiveError] = useState<{ text: string; riders?: number; overrides?: number; orders?: number } | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const list = liveClasses(classes);
  const archived = classes.filter((c) => c.archived_at);
  const comfortOff = classes.some(isAppPendingClass);

  const toggleEnabled = (c: VehicleClass) => {
    setRowError(null);
    start(async () => {
      const res = await updateVehicleClass(c.code, { enabled: !c.enabled, expected_updated_at: c.updated_at });
      if (!res.ok) return setRowError(res.error);
      router.refresh();
    });
  };

  if (error) return <p className="text-sm text-danger">{error}</p>;

  return (
    <div className="space-y-4">
      <div className={`rounded-xl border px-4 py-3 ${comfortOff ? "border-warning/40 bg-warning-light" : "border-border bg-card"}`}>
        <p className={`text-[13px] font-bold ${comfortOff ? "text-warning" : "text-text"}`}>{t("vehicles.comfort_note_title")}</p>
        <p className="text-[12.5px] text-subtext mt-0.5">{t("vehicles.comfort_note")}</p>
      </div>

      <Card
        title={t("vehicles.title")}
        description={t("vehicles.desc")}
        action={
          canEdit ? (
            <Button size="xs" icon="plus" onClick={() => setEditing("new")}>
              {t("vehicles.add")}
            </Button>
          ) : undefined
        }
      >
        {rowError && <p className="text-sm text-danger mb-3">{rowError}</p>}
        {!list.length ? (
          <EmptyState title={t("vehicles.empty")} />
        ) : (
          <ul className="divide-y divide-border">
            {list.map((c) => (
              <li key={c.code} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1 basis-56">
                  <p className="text-[13px] font-semibold text-text truncate">{classNameOrNull(classes, c.code, locale) ?? c.code}</p>
                  <p className="text-[11.5px] text-subtext">
                    <code>{c.code}</code> · {t("vehicles.order_n", { n: c.sort_order })}
                  </p>
                  <p className="text-[11.5px] text-subtext">
                    {c.names.en} · {c.names.fr} · <span dir="rtl">{c.names.ar}</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={c.base_vehicle === "motorcycle" ? "info" : "default"}>{t(`vehicle.${c.base_vehicle}`)}</Badge>
                  {c.services.map((s) => (
                    <Badge key={s} variant="primary">
                      {t(`vehicles.services.${s}`)}
                    </Badge>
                  ))}
                  {c.exclusive && <Badge variant="warning">{t("vehicles.exclusive")}</Badge>}
                  {isAppPendingClass(c) && <Badge variant="warning">{t("vehicles.badge_off")}</Badge>}
                </div>
                <span className="text-[12px] text-subtext tabular-nums shrink-0">{t("vehicles.riders", { count: c.rider_count ?? 0 })}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {canEdit ? (
                    <Toggle on={c.enabled} onClick={() => toggleEnabled(c)} label={t("vehicles.enabled")} disabled={pending} />
                  ) : (
                    <Badge variant={c.enabled ? "success" : "default"}>{c.enabled ? t("vehicles.on") : t("vehicles.off")}</Badge>
                  )}
                  {canEdit && (
                    <>
                      <Button variant="secondary" size="xs" icon="pencil" onClick={() => setEditing(c)} aria-label={t("actions.edit")} />
                      <Button
                        variant="ghost"
                        size="xs"
                        className="hover:!text-danger"
                        onClick={() => {
                          setArchiveError(null);
                          setArchiving(c);
                        }}
                      >
                        {t("actions.archive")}
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {archived.length > 0 && (
          <details className="mt-4 text-[12.5px] text-subtext">
            <summary className="cursor-pointer font-semibold">{t("vehicles.archived", { count: archived.length })}</summary>
            <ul className="mt-2 space-y-1">
              {archived.map((c) => (
                <li key={c.code}>
                  {classNameOrNull(classes, c.code, locale) ?? c.code} · <code>{c.code}</code>
                </li>
              ))}
            </ul>
          </details>
        )}
      </Card>

      {canEdit && (
        <>
          <Modal
            open={!!editing}
            onClose={() => setEditing(null)}
            title={editing === "new" ? t("vehicles.new_title") : t("vehicles.edit_title")}
            widthClassName="max-w-lg"
          >
            {editing && (
              <ClassFormBody
                key={editing === "new" ? "new" : editing.code}
                cls={editing === "new" ? null : editing}
                nextOrder={nextClassOrder(classes)}
                onClose={() => setEditing(null)}
                onSaved={() => {
                  setEditing(null);
                  router.refresh();
                }}
              />
            )}
          </Modal>
          <Modal open={!!archiving} onClose={() => setArchiving(null)} title={t("vehicles.archive_title")}>
            <p className="text-sm text-subtext mb-4">
              {t("vehicles.archive_body", { name: archiving ? (classNameOrNull(classes, archiving.code, locale) ?? archiving.code) : "" })}
            </p>
            {archiveError && (
              <div className="text-sm text-danger mb-3 space-y-1">
                <p>{archiveError.text}</p>
                {(archiveError.riders !== undefined || archiveError.overrides !== undefined || archiveError.orders !== undefined) && (
                  <p className="text-[12.5px]">
                    {t("vehicles.in_use_detail", {
                      riders: archiveError.riders ?? 0,
                      overrides: archiveError.overrides ?? 0,
                      orders: archiveError.orders ?? 0,
                    })}
                  </p>
                )}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setArchiving(null)} disabled={pending}>
                {t("actions.cancel")}
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={pending}
                onClick={() =>
                  start(async () => {
                    const res = await archiveVehicleClass(archiving!.code);
                    if (!res.ok) return setArchiveError({ text: res.error, ...(res.code === "class_in_use" ? res.usage : {}) });
                    setArchiving(null);
                    router.refresh();
                  })
                }
              >
                {t("actions.archive")}
              </Button>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
}

function ClassFormBody({
  cls,
  nextOrder,
  onClose,
  onSaved,
}: {
  cls: VehicleClass | null;
  nextOrder: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("pricing");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ClassForm>({
    defaultValues: {
      code: cls?.code ?? "",
      en: cls?.names.en ?? "",
      fr: cls?.names.fr ?? "",
      ar: cls?.names.ar ?? "",
      base_vehicle: cls?.base_vehicle ?? "motorcycle",
      services: cls?.services ?? ["ride"],
      exclusive: cls?.exclusive ?? false,
      // A new class starts off: staff turn it on once the app can show it.
      enabled: cls?.enabled ?? false,
      sort_order: String(cls?.sort_order ?? nextOrder),
      note: cls?.note ?? "",
    },
  });
  const code = useWatch({ control, name: "code" });
  const enabled = useWatch({ control, name: "enabled" });
  const comfortCode = (cls?.code ?? code.trim()) === COMFORT_CODE;

  const submit = handleSubmit((f) => {
    const names = { en: f.en.trim(), fr: f.fr.trim(), ar: f.ar.trim() };
    const sort_order = Math.round(Number(f.sort_order));
    const note = f.note.trim() || null;
    const services = CLASS_SERVICES.filter((s) => f.services.includes(s));
    setMessage(null);
    start(async () => {
      const body = { names, base_vehicle: f.base_vehicle, services, exclusive: f.exclusive, enabled: f.enabled, sort_order, note };
      const res = cls
        ? await updateVehicleClass(cls.code, { ...body, expected_updated_at: cls.updated_at })
        : await createVehicleClass({ code: f.code.trim(), ...body });
      if (!res.ok) return setMessage(res.error);
      onSaved();
    });
  });

  const req = { required: t("errors.required"), validate: (v: string) => v.trim().length > 0 || t("errors.required") };
  return (
    <form onSubmit={submit} className="space-y-3 max-h-[75vh] overflow-y-auto pe-1">
      {!cls && (
        <FormRow label={t("vehicles.code")}>
          <input
            className={fInput}
            placeholder="motorcycle_comfort"
            dir="ltr"
            {...register("code", { validate: (v) => isClassCode(v.trim()) || t("vehicles.code_invalid") })}
          />
          <span className="block text-[11.5px] text-subtext mt-1">{t("vehicles.code_hint")}</span>
          {errors.code && <span className="block text-[11.5px] text-danger mt-1">{errors.code.message}</span>}
        </FormRow>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FormRow label={t("tiers_card.name_en")}>
          <input className={fInput} dir="ltr" {...register("en", req)} />
          {errors.en && <span className="block text-[11.5px] text-danger mt-1">{errors.en.message}</span>}
        </FormRow>
        <FormRow label={t("tiers_card.name_fr")}>
          <input className={fInput} dir="ltr" {...register("fr", req)} />
          {errors.fr && <span className="block text-[11.5px] text-danger mt-1">{errors.fr.message}</span>}
        </FormRow>
        <FormRow label={t("tiers_card.name_ar")}>
          <input className={fInput} dir="rtl" {...register("ar", req)} />
          {errors.ar && <span className="block text-[11.5px] text-danger mt-1">{errors.ar.message}</span>}
        </FormRow>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormRow label={t("vehicles.base_vehicle")}>
          <select className={fInput} {...register("base_vehicle")}>
            {BASE_VEHICLES.map((v) => (
              <option key={v} value={v}>
                {t(`vehicle.${v}`)}
              </option>
            ))}
          </select>
        </FormRow>
        <FormRow label={t("vehicles.order")}>
          <input type="number" step={1} className={fInput} {...register("sort_order", { validate: (v) => Number.isInteger(Number(v)) || t("errors.integer") })} />
          {errors.sort_order && <span className="block text-[11.5px] text-danger mt-1">{errors.sort_order.message}</span>}
        </FormRow>
      </div>
      <fieldset>
        <legend className="text-[12px] text-subtext mb-1.5">{t("vehicles.services_label")}</legend>
        <div className="flex flex-wrap gap-2">
          {CLASS_SERVICES.map((s) => (
            <label key={s} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-[13px] cursor-pointer">
              <input
                type="checkbox"
                value={s}
                className="accent-primary"
                {...register("services", { validate: (v) => (v?.length ?? 0) > 0 || t("vehicles.services_required") })}
              />
              {t(`vehicles.services.${s}`)}
            </label>
          ))}
        </div>
        {errors.services && <span className="block text-[11.5px] text-danger mt-1">{errors.services.message as string}</span>}
      </fieldset>
      <div className="flex items-start justify-between gap-3 rounded-xl border border-border px-3 py-2.5">
        <div>
          <p className="text-[13px] text-text">{t("vehicles.exclusive")}</p>
          <p className="text-[11.5px] text-subtext">{t("vehicles.exclusive_hint")}</p>
        </div>
        <Controller control={control} name="exclusive" render={({ field }) => <Toggle on={field.value} onClick={() => field.onChange(!field.value)} label={t("vehicles.exclusive")} />} />
      </div>
      <div className="flex items-start justify-between gap-3 rounded-xl border border-border px-3 py-2.5">
        <div>
          <p className="text-[13px] text-text">{t("vehicles.enabled")}</p>
          <p className="text-[11.5px] text-subtext">{t("vehicles.enabled_hint")}</p>
        </div>
        <Controller control={control} name="enabled" render={({ field }) => <Toggle on={field.value} onClick={() => field.onChange(!field.value)} label={t("vehicles.enabled")} />} />
      </div>
      {comfortCode && enabled && <p className="text-[12.5px] text-warning">{t("vehicles.comfort_enable_warning")}</p>}
      <FormRow label={t("modal.note")}>
        <textarea className={`${fInput} min-h-[56px]`} maxLength={300} {...register("note")} />
      </FormRow>
      {message && <p className="text-sm text-danger">{message}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={pending}>
          {t("actions.cancel")}
        </Button>
        <Button type="submit" size="sm" loading={pending}>
          {cls ? t("actions.save") : t("actions.create")}
        </Button>
      </div>
    </form>
  );
}
