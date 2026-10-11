"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { rolesWithAccess } from "@/lib/auth/access";
import { hasStaffRole } from "@/lib/auth/staff";
import { blinkApi } from "@/lib/blink-api";
import { blinkApiErrorKey, blinkApiErrorMessage } from "@/lib/blink-api-errors";
import type {
  AgentDocTarget,
  PartnerVerdict,
  ReviewErrorCode,
  ReviewOutcome,
  RiderDocTarget,
  ShopDecision,
} from "@/features/verification";
import {
  buildAgentDocumentRequest,
  buildAgentShopRequest,
  buildRiderDocumentRequest,
  partnerErrorCode,
} from "./partner-request";
import type { ReviewRequest } from "./review-request";

// Verify / reject a rider's or agent's documents, and approve / reject an agent
// shop, from the riders / agents verification queues. Like action.ts, nothing here writes a
// status column: each decision goes to blink-server's staff endpoint with the
// operator's access token (requireStaff there is the authority), then the page
// re-reads the queues. revalidatePath takes the rewritten route (/d/…).
// Rider review belongs to the Riders section and agent / shop review to Agents:
// whoever can open that section may decide (re-checked here on every call).
const NS = "verification";

const SECTIONS = {
  rider: { section: "/riders", path: "/d/riders/verification" },
  agent: { section: "/agents", path: "/d/agents/verification" },
} as const;

async function send(
  request: ReviewRequest | { code: ReviewErrorCode },
  kind: keyof typeof SECTIONS,
  alsoRevalidate?: string
): Promise<ReviewOutcome> {
  const { section, path: PATH } = SECTIONS[kind];
  const REVIEW_ROLES = rolesWithAccess(section);
  if (!(await hasStaffRole(...REVIEW_ROLES))) {
    return { ok: false, code: "forbidden", message: await blinkApiErrorMessage(NS, { status: 403, error: "" }) };
  }
  if ("code" in request) {
    const t = await getTranslations(`${NS}.partners.errors`);
    return { ok: false, code: request.code, message: t(request.code, { max: "" }) };
  }

  const res = await blinkApi(request.path, { method: "PATCH", body: request.body, roles: REVIEW_ROLES });
  if (res.ok) {
    revalidatePath(PATH);
    if (alsoRevalidate) revalidatePath(alsoRevalidate);
    return { ok: true };
  }

  const code = partnerErrorCode(res);
  // The document changed (or the partner is gone): what's on screen is stale.
  if (code || res.status === 404) {
    revalidatePath(PATH);
    if (alsoRevalidate) revalidatePath(alsoRevalidate);
  }
  if (code || res.status === 404) {
    const key = code ?? "not_found";
    const t = await getTranslations(`${NS}.partners.errors`);
    return { ok: false, code: key, message: t(key, { max: "" }) };
  }
  return { ok: false, code: blinkApiErrorKey(res.status), message: await blinkApiErrorMessage(NS, res) };
}

/** Verify / reject one rider document, on the stored path the reviewer saw (409 = the rider replaced it since). */
export async function reviewRiderDocument(
  target: RiderDocTarget,
  verdict: PartnerVerdict,
  note?: string
): Promise<ReviewOutcome> {
  // The rider's own page (/riders/<id>, rewritten to /d/riders/<id>) shows the same documents.
  const detail = /^[0-9a-f-]{36}$/i.test(target.riderId) ? `/d/riders/${target.riderId}` : undefined;
  return send(buildRiderDocumentRequest(target, verdict, note), "rider", detail);
}

/** Verify / reject an agent's commercial register scan. */
export async function reviewAgentDocument(
  target: AgentDocTarget,
  verdict: PartnerVerdict,
  reason?: string
): Promise<ReviewOutcome> {
  return send(buildAgentDocumentRequest(target, verdict, reason), "agent");
}

/** Approve (active) or reject one agent shop. */
export async function reviewAgentShop(shopId: string, decision: ShopDecision): Promise<ReviewOutcome> {
  return send(buildAgentShopRequest(shopId, decision), "agent");
}
