"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button, Modal, fInput } from "@/components/ui";
import {
  WILAYAS,
  VEHICLE_TYPE_KEYS,
  VEHICLE_CATEGORY_KEYS,
  DOC_STATUS_KEYS,
  type NewVehicleInput,
  type Vehicle,
  type VehicleType,
  type TFn,
} from "../data";
import { useVehiclesStore } from "../store";

const EMPTY: NewVehicleInput = {
  userId: "",
  riderCode: "",
  riderName: "",
  wilaya: "Alger",
  vehicleType: "motorcycle",
  brand: "",
  model: "",
  licensePlate: "",
  year: "",
  color: "",
  category: "standard",
  grayCardStatus: "not_uploaded",
  insuranceStatus: "not_uploaded",
  drivingLicenseStatus: "not_uploaded",
};

export function VehicleForm({
  t,
  open,
  vehicle,
  onClose,
}: {
  t: TFn;
  open: boolean;
  vehicle: Vehicle | null;
  onClose: () => void;
}) {
  const addVehicle = useVehiclesStore((s) => s.addVehicle);
  const updateVehicle = useVehiclesStore((s) => s.updateVehicle);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<NewVehicleInput>({ defaultValues: EMPTY });

  useEffect(() => {
    if (vehicle) {
      const { id: _id, createdAt: _createdAt, ...rest } = vehicle;
      void _id;
      void _createdAt;
      reset(rest);
    } else {
      reset(EMPTY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle?.id, open]);

  const onSubmit = handleSubmit((data) => {
    if (vehicle) updateVehicle(vehicle.id, data);
    else addVehicle(data);
    onClose();
  });

  const type = watch("vehicleType") as VehicleType;
  const isBicycle = type === "bicycle";
  const labelClass = "block text-[12.5px] font-bold text-text mb-1.5";

  return (
    <Modal open={open} onClose={onClose} title={vehicle ? t("form.edit") : t("form.new")}>
      <form onSubmit={onSubmit}>
        {/* rider */}
        <div className="grid grid-cols-2 gap-3">
          <div className="mb-4">
            <label className={labelClass}>{t("form.rider_name")}</label>
            <input
              className={fInput}
              placeholder={t("ph.rider_name")}
              {...register("riderName", { required: t("required") })}
            />
            {errors.riderName && <p className="text-danger text-xs mt-1.5">{errors.riderName.message}</p>}
          </div>
          <div className="mb-4">
            <label className={labelClass}>{t("form.rider_code")}</label>
            <input className={fInput} placeholder={t("ph.rider_code")} {...register("riderCode")} />
          </div>
        </div>

        {/* type + category + wilaya */}
        <div className="grid grid-cols-3 gap-3">
          <div className="mb-4">
            <label className={labelClass}>{t("form.type")}</label>
            <select className={fInput} {...register("vehicleType")}>
              {VEHICLE_TYPE_KEYS.map((k) => (
                <option key={k} value={k}>
                  {t("type." + k)}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className={labelClass}>{t("form.category")}</label>
            <select className={fInput} {...register("category")}>
              {VEHICLE_CATEGORY_KEYS.map((k) => (
                <option key={k} value={k}>
                  {t("category." + k)}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className={labelClass}>{t("form.wilaya")}</label>
            <select className={fInput} {...register("wilaya")}>
              {WILAYAS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* brand + model */}
        <div className="grid grid-cols-2 gap-3">
          <div className="mb-4">
            <label className={labelClass}>{t("form.brand")}</label>
            <input
              className={fInput}
              placeholder={t("ph.brand")}
              {...register("brand", { required: t("required") })}
            />
            {errors.brand && <p className="text-danger text-xs mt-1.5">{errors.brand.message}</p>}
          </div>
          <div className="mb-4">
            <label className={labelClass}>{t("form.model")}</label>
            <input
              className={fInput}
              placeholder={t("ph.model")}
              {...register("model", { required: t("required") })}
            />
            {errors.model && <p className="text-danger text-xs mt-1.5">{errors.model.message}</p>}
          </div>
        </div>

        {/* plate + year + color */}
        <div className="grid grid-cols-3 gap-3">
          <div className="mb-4">
            <label className={labelClass}>{t("form.plate")}</label>
            <input
              className={fInput}
              placeholder={isBicycle ? t("ph.plate_na") : t("ph.plate")}
              disabled={isBicycle}
              {...register("licensePlate")}
            />
          </div>
          <div className="mb-4">
            <label className={labelClass}>{t("form.year")}</label>
            <input className={fInput} placeholder="2023" {...register("year")} />
          </div>
          <div className="mb-4">
            <label className={labelClass}>{t("form.color")}</label>
            <input className={fInput} placeholder={t("ph.color")} {...register("color")} />
          </div>
        </div>

        {/* documents — only for motorized vehicles */}
        {!isBicycle && (
          <div className="mb-4 rounded-xl border border-border bg-background p-3">
            <div className="text-[12.5px] font-bold text-text mb-2.5">{t("form.documents")}</div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11.5px] text-subtext mb-1.5">{t("doc.grayCard")}</label>
                <select className={fInput} {...register("grayCardStatus")}>
                  {DOC_STATUS_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {t("doc_status." + k)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11.5px] text-subtext mb-1.5">{t("doc.insurance")}</label>
                <select className={fInput} {...register("insuranceStatus")}>
                  {DOC_STATUS_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {t("doc_status." + k)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11.5px] text-subtext mb-1.5">{t("doc.drivingLicense")}</label>
                <select className={fInput} {...register("drivingLicenseStatus")}>
                  {DOC_STATUS_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {t("doc_status." + k)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2.5 justify-end mt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("form.cancel")}
          </Button>
          <Button type="submit">{t("form.save")}</Button>
        </div>
      </form>
    </Modal>
  );
}
