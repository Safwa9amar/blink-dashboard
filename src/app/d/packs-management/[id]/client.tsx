"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { DashIcon, EmptyState } from "@/components/ui";
import { PackEditor, type Pack, type PackProductOption } from "@/features/packs-management";

export default function EditPackClient({
  pack,
  products,
  productsError,
  error,
}: {
  /** Null when the pack couldn't be loaded (`error`). */
  pack: Pack | null;
  products: PackProductOption[];
  productsError?: string;
  error?: string;
}) {
  const t = useTranslations("packs.editor");
  const router = useRouter();
  // Bumped by "Reload latest version" (after a 409) together with the refresh, so the
  // editor restarts from the pack as the server now returns it — even if its version
  // didn't move. Nothing else remounts it: a failed save keeps the operator's draft.
  const [reloads, setReloads] = useState(0);

  if (!pack) {
    return (
      <>
        <Link
          href="/packs-management/all"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-subtext hover:text-text mb-4 transition-colors"
        >
          <DashIcon name="undo" className="w-4 h-4 rtl:-scale-x-100" />
          {t("back")}
        </Link>
        <EmptyState
          icon={<DashIcon name="warn" className="w-10 h-10" />}
          title={t("edit_title")} description={t("load_failed", { detail: error ?? "" })} />
      </>
    );
  }
  // Keyed by version (+ explicit reloads): the editor restarts from the pack as it now is.
  return (
    <PackEditor
      key={`${pack.updatedAt}#${reloads}`}
      mode="edit"
      pack={pack}
      products={products}
      productsError={productsError}
      onReload={() => {
        setReloads((n) => n + 1);
        router.refresh();
      }}
    />
  );
}
