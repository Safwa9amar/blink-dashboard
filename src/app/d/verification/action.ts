"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { hasStaffRole } from "@/lib/auth/staff";
import { blinkApi } from "@/lib/blink-api";
import { blinkApiErrorKey, blinkApiErrorMessage } from "@/lib/blink-api-errors";
import type {
  DocumentReviewTarget,
  DocumentVerdict,
  ReviewDecision,
  ReviewOutcome,
  ReviewTarget,
} from "@/features/verification";
import {
  buildDocumentReviewRequest,
  buildReviewRequest,
  documentErrorCode,
  isOwnerLeaving,
  REVIEW_ROLES,
} from "./review-request";

// Approve / reject / deactivate a store, and verify / reject one of its
// documents, from the verification queue. The dashboard never writes a status
// (or review) column: each decision goes to blink-server's staff
// endpoint with the operator's access token (requireStaff there is the
// authority), then the page re-reads the queues. revalidatePath takes the
// rewritten route (/d/…) — the browser shows /verification.
const NS = "verification";
const PATH = "/d/verification";

export async function submitReview(
  target: ReviewTarget,
  decision: ReviewDecision,
  note?: string
): Promise<ReviewOutcome> {
  if (!(await hasStaffRole(...REVIEW_ROLES))) {
    return { ok: false, code: "forbidden", message: await blinkApiErrorMessage(NS, { status: 403, error: "" }) };
  }

  const request = buildReviewRequest(target, decision, note);
  if ("code" in request) {
    const t = await getTranslations(`${NS}.errors`);
    return { ok: false, code: request.code, message: t(request.code, { detail: "" }) };
  }

  const res = await blinkApi(request.path, { method: "PATCH", body: request.body, roles: REVIEW_ROLES });
  if (!res.ok) {
    // 409 = the item changed / was already decided since the reviewer loaded it;
    // 404 = it's gone. Either way the list on screen is stale: refresh it.
    if (res.status === 409 || res.status === 404) revalidatePath(PATH);
    // The owner is deleting their account: the refreshed card says so and hides Approve.
    if (isOwnerLeaving(res)) {
      const t = await getTranslations(`${NS}.errors`);
      return { ok: false, code: "owner_leaving", message: t("owner_leaving", { detail: "" }) };
    }
    return { ok: false, code: blinkApiErrorKey(res.status), message: await blinkApiErrorMessage(NS, res) };
  }

  revalidatePath(PATH);
  return { ok: true };
}

/**
 * Verify / reject one of a store's required documents (register scans, NIF,
 * NIS) — blink-server records the verdict against the value the reviewer saw
 * and notifies the merchant. A stale verdict (the document changed since the
 * page loaded) or a vanished document refreshes the list.
 */
export async function reviewStoreDocument(
  target: DocumentReviewTarget,
  verdict: DocumentVerdict,
  reason?: string
): Promise<ReviewOutcome> {
  if (!(await hasStaffRole(...REVIEW_ROLES))) {
    return { ok: false, code: "forbidden", message: await blinkApiErrorMessage(NS, { status: 403, error: "" }) };
  }

  const request = buildDocumentReviewRequest(target, verdict, reason);
  if ("code" in request) {
    const t = await getTranslations(`${NS}.errors`);
    return { ok: false, code: request.code, message: t(request.code, { detail: "" }) };
  }

  const res = await blinkApi(request.path, { method: "PATCH", body: request.body, roles: REVIEW_ROLES });
  if (!res.ok) {
    const code = documentErrorCode(res);
    // The document (or the whole store) changed or is gone: what's on screen is stale.
    if (res.status === 409 || res.status === 404 || code === "document_missing") revalidatePath(PATH);
    if (code) {
      const t = await getTranslations(`${NS}.errors`);
      return { ok: false, code, message: t(code, { detail: "" }) };
    }
    return { ok: false, code: blinkApiErrorKey(res.status), message: await blinkApiErrorMessage(NS, res) };
  }

  revalidatePath(PATH);
  return { ok: true };
}
