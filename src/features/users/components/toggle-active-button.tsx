"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toggleUserActive } from "@/app/d/users/action";

export function ToggleActiveButton({ userId, isActive }: { userId: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("users");

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(async () => { await toggleUserActive(userId, !isActive); })}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
        isActive ? "bg-success" : "bg-border"
      }`}
      title={isActive ? t("deactivate") : t("activate")}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
          isActive ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
