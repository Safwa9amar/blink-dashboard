"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button, Modal } from "@/components/ui";
import { createStaffAccount } from "@/app/d/access/action";
import type { StaffRole } from "../data";
import { ErrorBox, FIELD, LABEL, RoleSelect, useErrorText } from "./shared";

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  staffRole: StaffRole;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AddStaffDialog({
  onClose,
  onCreated,
  onGrantInstead,
}: {
  onClose: () => void;
  onCreated: (r: { email: string; name: string; password: string }) => void;
  onGrantInstead: (email: string) => void;
}) {
  const t = useTranslations("access");
  const errorText = useErrorText();
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailExists, setEmailExists] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { firstName: "", lastName: "", email: "", phone: "", staffRole: "ops_admin" },
  });
  const role = useWatch({ control, name: "staffRole" });

  async function submit(v: FormValues) {
    setServerError(null);
    setEmailExists(false);
    const res = await createStaffAccount({
      firstName: v.firstName.trim(),
      lastName: v.lastName.trim() || undefined,
      email: v.email.trim(),
      phone: v.phone.trim() || undefined,
      staffRole: v.staffRole,
    });
    if (res.error || !res.tempPassword) {
      setEmailExists(res.error === "email_exists");
      setServerError(errorText(res.error ?? "generic"));
      return;
    }
    onCreated({
      email: v.email.trim(),
      name: [v.firstName.trim(), v.lastName.trim()].filter(Boolean).join(" "),
      password: res.tempPassword,
    });
  }

  const fieldError = (m?: string) => (m ? <p className="text-xs text-danger mt-1">{m}</p> : null);

  return (
    <Modal open onClose={onClose} title={t("add.title")}>
      <form onSubmit={handleSubmit(submit)} noValidate>
        <p className="text-sm text-subtext mb-4">{t("add.desc")}</p>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="as-first" className={LABEL}>
                {t("add.first_name")}
              </label>
              <input
                id="as-first"
                dir="auto"
                className={FIELD}
                aria-invalid={!!errors.firstName}
                {...register("firstName", { validate: (v) => v.trim().length > 0 || t("add.required") })}
              />
              {fieldError(errors.firstName?.message)}
            </div>
            <div>
              <label htmlFor="as-last" className={LABEL}>
                {t("add.last_name")}
              </label>
              <input id="as-last" dir="auto" className={FIELD} {...register("lastName")} />
            </div>
          </div>
          <div>
            <label htmlFor="as-email" className={LABEL}>
              {t("add.email")}
            </label>
            <input
              id="as-email"
              type="email"
              dir="ltr"
              autoComplete="off"
              className={FIELD}
              aria-invalid={!!errors.email}
              {...register("email", {
                validate: (v) => (v.trim() ? EMAIL_RE.test(v.trim()) || t("add.invalid_email") : t("add.required")),
              })}
            />
            {fieldError(errors.email?.message)}
          </div>
          <div>
            <label htmlFor="as-phone" className={LABEL}>
              {t("add.phone")}
            </label>
            <input id="as-phone" type="tel" dir="ltr" placeholder="+213 …" className={FIELD} {...register("phone")} />
          </div>
          <div>
            <label htmlFor="as-role" className={LABEL}>
              {t("add.role")}
            </label>
            <RoleSelect id="as-role" value={role} onChange={(r) => setValue("staffRole", r)} />
          </div>
        </div>

        {serverError && (
          <ErrorBox>
            {serverError}
            {emailExists && (
              <button
                type="button"
                onClick={() => onGrantInstead(getValues("email").trim())}
                className="block mt-1.5 font-semibold underline cursor-pointer"
              >
                {t("add.grant_instead")}
              </button>
            )}
          </ErrorBox>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          <Button type="submit" size="sm" loading={isSubmitting}>
            {isSubmitting ? t("add.saving") : t("add.submit")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
