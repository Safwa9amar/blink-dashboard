"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import type { StaffRole } from "@/lib/auth/access";
import { hasStaffRole } from "@/lib/auth/staff";
import { blinkApi } from "@/lib/blink-api";
import { blinkApiErrorMessage } from "@/lib/blink-api-errors";

// Catalog review decisions go through blink-server (PATCH /merchant/admin/products/{id}/review),
// never straight to the DB: the server copies an accepted suggested_price into price
// and notifies the merchant of every decision. Same roles that see /merchant-pricing.
const CATALOG_ROLES: readonly StaffRole[] = ["super_admin", "commerce_admin"];
const NS = "merchant_pricing";

export type CatalogDecision = "approve_price" | "reject_price" | "approve_product" | "reject_product";

/** What the admin saw when deciding — blink-server answers 409 if the row changed since. */
export interface CatalogDecisionInput {
  /** Required to reject (shown to the merchant); never sent with an approval. */
  note?: string;
  /** Price decisions: the suggested price on screen. */
  expectedSuggestedPrice?: number | null;
  /** Product decisions: the product row's `updated_at` as loaded (raw, untouched). */
  expectedUpdatedAt?: string | null;
}

const fail = async (status: number, error = "") => ({ error: await blinkApiErrorMessage(NS, { status, error }) });

export async function reviewCatalogProduct(
  productId: string,
  decision: CatalogDecision,
  { note, expectedSuggestedPrice, expectedUpdatedAt }: CatalogDecisionInput = {}
): Promise<{ error?: string }> {
  if (!(await hasStaffRole(...CATALOG_ROLES))) return fail(403);

  const trimmed = typeof note === "string" ? note.trim().slice(0, 300) : "";

  // Built with a switch (no lookup on a client-supplied key).
  const body: Record<string, string | number> = {};
  switch (decision) {
    case "approve_price":
      body.suggestion_status = "accepted";
      break;
    case "reject_price":
      body.suggestion_status = "rejected";
      body.note = trimmed;
      break;
    case "approve_product":
      body.review_status = "approved";
      break;
    case "reject_product":
      body.review_status = "rejected";
      body.note = trimmed;
      break;
    default:
      return fail(400, "Unknown decision");
  }
  // Preconditions: what the admin saw. Price decisions carry the suggested price,
  // product decisions the row version (raw `updated_at`).
  if (decision === "approve_price" || decision === "reject_price") {
    if (typeof expectedSuggestedPrice === "number" && Number.isFinite(expectedSuggestedPrice)) {
      body.expected_suggested_price = expectedSuggestedPrice;
    }
  } else if (typeof expectedUpdatedAt === "string" && expectedUpdatedAt && expectedUpdatedAt.length <= 64) {
    body.expected_updated_at = expectedUpdatedAt;
  }
  if ((decision === "reject_price" || decision === "reject_product") && !trimmed) {
    const t = await getTranslations(`${NS}.review`);
    return { error: t("note_required") };
  }

  const res = await blinkApi(`/merchant/admin/products/${encodeURIComponent(productId)}/review`, {
    method: "PATCH",
    body,
    roles: CATALOG_ROLES,
  });
  if (!res.ok) {
    // 409 = the product changed / was already decided since the admin loaded it;
    // 404 = it's gone. Either way the queue on screen is stale: refresh it.
    if (res.status === 409 || res.status === 404) revalidatePath("/d/merchant-pricing", "layout");
    return { error: await blinkApiErrorMessage(NS, res) };
  }

  revalidatePath("/d/merchant-pricing", "layout");
  return {};
}
