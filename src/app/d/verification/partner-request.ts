// Maps a rider / agent review decision from the riders / agents verification queues onto the blink-server
// staff endpoint that applies it. Pure (no I/O). blink-server re-validates
// everything (requireStaff + Zod); the checks here keep a malformed id out of
// the URL path and give the reviewer a readable error.
import type {
  AgentDocTarget,
  PartnerVerdict,
  ReviewErrorCode,
  RiderDocTarget,
  ShopDecision,
} from "@/features/verification";
import { AGENT_DOC_KEYS, AGENT_REASON_MAX, RIDER_DOC_KEYS, RIDER_NOTE_MAX } from "@/features/verification";
import { isUuid, type ReviewRequest } from "./review-request";

const VERDICTS: readonly PartnerVerdict[] = ["verified", "rejected"];

/** blink-server caps the stored path at 300 characters (reviewRiderDocumentSchema). */
const PATH_MAX = 300;

type Invalid = { code: ReviewErrorCode };

/**
 * PATCH /riders/admin/riders/{id}/documents. `path` is the document path the
 * reviewer saw: blink-server answers 409 `stale_review` if the rider replaced
 * the document since. A rejection needs a note (shown to the rider, 200 max).
 */
export function buildRiderDocumentRequest(
  target: RiderDocTarget,
  verdict: PartnerVerdict,
  note?: string | null
): ReviewRequest | Invalid {
  if (!target || typeof target !== "object") return { code: "invalid_target" };
  if (!isUuid(target.riderId) || !RIDER_DOC_KEYS.includes(target.document)) return { code: "invalid_target" };
  if (!VERDICTS.includes(verdict)) return { code: "invalid_target" };
  const path = typeof target.path === "string" ? target.path.trim() : "";
  if (!path || path.length > PATH_MAX) return { code: "invalid_target" };
  const reject = verdict === "rejected";
  const text = typeof note === "string" ? note.trim() : "";
  if (reject && !text) return { code: "note_required" };
  if (reject && text.length > RIDER_NOTE_MAX) return { code: "note_too_long" };
  return {
    path: `/riders/admin/riders/${target.riderId}/documents`,
    // The path is sent exactly as stored (trim only guards the empty check).
    body: { document: target.document, status: verdict, path: target.path, ...(reject ? { note: text } : {}) },
  };
}

/** PATCH /agents/admin/agents/{id}/documents — verify / reject a commercial register scan. */
export function buildAgentDocumentRequest(
  target: AgentDocTarget,
  verdict: PartnerVerdict,
  reason?: string | null
): ReviewRequest | Invalid {
  if (!target || typeof target !== "object") return { code: "invalid_target" };
  if (!isUuid(target.agentId) || !AGENT_DOC_KEYS.includes(target.document)) return { code: "invalid_target" };
  if (!VERDICTS.includes(verdict)) return { code: "invalid_target" };
  const reject = verdict === "rejected";
  const text = typeof reason === "string" ? reason.trim() : "";
  if (reject && !text) return { code: "note_required" };
  if (reject && text.length > AGENT_REASON_MAX) return { code: "note_too_long" };
  return {
    path: `/agents/admin/agents/${target.agentId}/documents`,
    body: { document: target.document, status: verdict, ...(reject ? { reason: text } : {}) },
  };
}

/** PATCH /agents/admin/shops/{id}/review — blink-server takes no note for a shop. */
export function buildAgentShopRequest(shopId: string, decision: ShopDecision): ReviewRequest | Invalid {
  if (!isUuid(shopId)) return { code: "invalid_target" };
  if (decision !== "approve" && decision !== "reject") return { code: "invalid_target" };
  return {
    path: `/agents/admin/shops/${shopId}/review`,
    body: { review_status: decision === "approve" ? "active" : "rejected" },
  };
}

/**
 * The refusals of a rider document verdict the reviewer can act on. blinkApi
 * drops blink-server's `code`, so they're told apart by message: 409
 * `stale_review` ("The rider replaced this document…") and 409
 * `documents_conflict` ("Documents changed concurrently…") both mean the
 * document on screen is out of date.
 */
export function partnerErrorCode(res: { status: number; error: string }): ReviewErrorCode | null {
  if (res.status === 409) return "stale";
  if (res.status === 400 && /not uploaded/i.test(res.error)) return "document_missing";
  return null;
}
