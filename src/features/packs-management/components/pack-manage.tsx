"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, DashIcon, btnSecondary } from "@/components/ui";
import { deletePack, updatePack } from "@/app/d/packs-management/action";
import type { Pack } from "../types";
import { PackConfirm } from "./pack-confirm";

type Act = "activate" | "archive" | "delete";

/**
 * Staff management of one pack, next to the review decisions: edit it, activate a
 * switched-off / archived pack, archive or delete it (both behind a confirmation).
 * Every action sends the pack version on screen; a 409 means it changed meanwhile and
 * a 404 that it's gone — the error stays inline and the stale list is re-read
 * (router.refresh(): the action doesn't revalidate on a failure). `onConfirmChange`
 * lets the detail modal ignore its own Escape / backdrop while a confirmation is open
 * on top of it.
 */
export function PackManage({
  pack,
  onDone,
  onConfirmChange,
}: {
  pack: Pack;
  onDone: () => void;
  onConfirmChange: (open: boolean) => void;
}) {
  const t = useTranslations("packs.manage");
  const router = useRouter();
  const [confirm, setConfirm] = useState<Exclude<Act, "activate"> | null>(null);
  const [acting, setActing] = useState<Act | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const openConfirm = (kind: Exclude<Act, "activate">) => {
    setError(null);
    setConfirm(kind);
    onConfirmChange(true);
  };
  const closeConfirm = () => {
    setConfirm(null);
    onConfirmChange(false);
  };

  function run(kind: Act) {
    setError(null);
    setActing(kind);
    startTransition(async () => {
      const res =
        kind === "delete"
          ? await deletePack(pack.id, pack.updatedAt)
          : await updatePack(pack.id, { status: kind === "activate" ? "active" : "archived" }, pack.updatedAt);
      setActing(null);
      closeConfirm();
      if (res.error) {
        setError(res.reason === "conflict" ? t("conflict") : res.error);
        if (res.reason) router.refresh();
        return;
      }
      onDone();
    });
  }

  const canActivate = pack.status === "inactive" || pack.status === "archived";

  return (
    <div className="border-t border-border pt-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-subtext mb-2.5">{t("title")}</p>
      <div className="flex flex-wrap gap-2">
        <Link href={`/packs-management/${pack.id}`} className={btnSecondary}>
          <DashIcon name="pencil" className="w-4 h-4" />
          {t("edit")}
        </Link>
        {canActivate && (
          <Button
            variant="secondary"
            icon="check"
            loading={isPending && acting === "activate"}
            disabled={isPending}
            onClick={() => run("activate")}
          >
            {t("activate")}
          </Button>
        )}
        {pack.status !== "archived" && (
          <Button variant="secondary" icon="archive" disabled={isPending} onClick={() => openConfirm("archive")}>
            {t("archive")}
          </Button>
        )}
        <Button
          variant="ghost"
          icon="trash"
          className="text-danger hover:text-danger"
          disabled={isPending}
          onClick={() => openConfirm("delete")}
        >
          {t("delete")}
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger bg-danger-light rounded-xl p-3 mt-3">
          {error}
        </p>
      )}

      {confirm && (
        <PackConfirm
          title={t(`${confirm}_title`)}
          body={t(`${confirm}_body`, { name: pack.name })}
          confirmLabel={t(`${confirm}_confirm`)}
          danger={confirm === "delete"}
          loading={isPending}
          onConfirm={() => run(confirm)}
          onCancel={closeConfirm}
        />
      )}
    </div>
  );
}
