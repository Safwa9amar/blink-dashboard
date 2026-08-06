"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui";
import { EmailInbox, type TFn } from "@/features/email";

export default function EmailClient({ error }: { error: string | null }) {
  const t = useTranslations("email") as unknown as TFn;
  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      {error && (
        <div className="mb-4 rounded-xl border border-danger/30 bg-danger-light px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}
      <EmailInbox t={t} />
    </div>
  );
}
