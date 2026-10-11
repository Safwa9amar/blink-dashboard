"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import type { StaffRole } from "@/lib/auth/access";
import { hasStaffRole } from "@/lib/auth/staff";
import { blinkApi } from "@/lib/blink-api";
import { blinkApiErrorMessage } from "@/lib/blink-api-errors";

// Pack decisions go through blink-server (PATCH /merchant/admin/packs/{id}/status):
// `active` approves a pack in review (the server stamps reviewed_at), `inactive`
// rejects it or takes a live pack down, with a note the merchant sees. Same roles
// that see /packs-management.
const PACK_ROLES: readonly StaffRole[] = ["super_admin", "commerce_admin"];
const NS = "packs";

export async function setPackStatus(
  packId: string,
  status: "active" | "inactive",
  {
    note,
    expectedUpdatedAt,
  }: {
    /** Required to reject / deactivate (shown to the merchant); never sent with an approval. */
    note?: string;
    /** The pack row's `updated_at` as loaded — blink-server answers 409 if it changed since. */
    expectedUpdatedAt?: string | null;
  } = {}
): Promise<{ error?: string }> {
  if (!(await hasStaffRole(...PACK_ROLES))) {
    return { error: await blinkApiErrorMessage(NS, { status: 403, error: "" }) };
  }
  if (status !== "active" && status !== "inactive") {
    return { error: await blinkApiErrorMessage(NS, { status: 400, error: "Unknown status" }) };
  }

  const trimmed = typeof note === "string" ? note.trim().slice(0, 300) : "";
  if (status === "inactive" && !trimmed) {
    const t = await getTranslations(`${NS}.decision`);
    return { error: t("note_required") };
  }

  const res = await blinkApi(`/merchant/admin/packs/${encodeURIComponent(packId)}/status`, {
    method: "PATCH",
    body: {
      status,
      ...(status === "inactive" ? { note: trimmed } : {}),
      ...(typeof expectedUpdatedAt === "string" && expectedUpdatedAt && expectedUpdatedAt.length <= 64
        ? { expected_updated_at: expectedUpdatedAt }
        : {}),
    },
    roles: PACK_ROLES,
  });
  if (!res.ok) {
    // 409 = the pack changed / was already decided since the admin loaded it (or is
    // archived / paused); 404 = it's gone. Either way the list is stale: refresh it.
    if (res.status === 409 || res.status === 404) revalidatePath("/d/packs-management", "layout");
    return { error: await blinkApiErrorMessage(NS, res) };
  }

  revalidatePath("/d/packs-management", "layout");
  return {};
}
