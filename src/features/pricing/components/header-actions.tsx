"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, btnSecondary } from "@/components/ui";
import type { Fee } from "../types";
import { OverrideWizard } from "./override-wizard";

// Page-header actions: Simulate an order (everyone) · + New override (editors only).
export function PricingHeaderActions({ fees, canEdit }: { fees: Fee[]; canEdit: boolean }) {
  const t = useTranslations("pricing");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Link href="/pricing/simulator" className={btnSecondary}>
        {t("header.simulate")}
      </Link>
      {canEdit && (
        <>
          <Button icon="plus" onClick={() => setOpen(true)}>
            {t("header.new_override")}
          </Button>
          <OverrideWizard open={open} onClose={() => setOpen(false)} fees={fees} onSaved={() => router.refresh()} />
        </>
      )}
    </>
  );
}
