// Maps a review decision from /merchants/verification onto the blink-server staff
// endpoint that applies it. Pure (no I/O) so the server action stays a thin
// wrapper. blink-server re-validates everything (requireStaff + Zod + the
// allowed status transitions); the checks here keep a malformed id out of the
// URL path and give the reviewer a readable error. Type-only imports from the
// feature keep this module free of runtime dependencies (the reject dialog
// imports NOTE_MAX from here).
import type {
  DocumentReviewTarget,
  DocumentVerdict,
  ReviewDecision,
  ReviewErrorCode,
  ReviewTarget,
  StoreDocKey,
} from "@/features/verification";

/** Same cap as blink-server's review notes. */
export const NOTE_MAX = 300;

const DECISIONS: readonly ReviewDecision[] = ["approve", "reject", "deactivate"];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: unknown): value is string => typeof value === "string" && UUID_RE.test(value);

/** A row timestamp as loaded (sent back verbatim, so only sanity-checked). */
const isTimestamp = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= 64 && !Number.isNaN(Date.parse(value));

/**
 * blink-server answers 409 `{ error, code: "owner_leaving" }` when the store's
 * owner has a pending / completed account deletion request. blinkApi only
 * surfaces the status and `error`, so the case is told apart by its message
 * ("The store owner asked to delete their Blink account, …"); anything else is
 * a plain conflict.
 */
export function isOwnerLeaving(res: { status: number; error: string }): boolean {
  return res.status === 409 && /owner_leaving|delete their blink account/i.test(res.error);
}

export interface ReviewRequest {
  path: string;
  body: Record<string, unknown>;
}

export function buildReviewRequest(
  target: ReviewTarget,
  decision: ReviewDecision,
  note?: string | null
): ReviewRequest | { code: ReviewErrorCode } {
  if (!target || typeof target !== "object") return { code: "invalid_target" };
  if (!DECISIONS.includes(decision)) return { code: "invalid_target" };
  const approve = decision === "approve";
  const text = typeof note === "string" ? note.trim() : "";
  if (!approve && !text) return { code: "note_required" };
  if (!approve && text.length > NOTE_MAX) return { code: "note_too_long" };

  switch (target.kind) {
    case "merchant_store": {
      // PATCH /merchant/admin/stores/{id}/status. store_status has no "rejected":
      // reject (from under_review) and deactivate (from active) both go inactive
      // with the note the merchant sees. Approve goes active — from under_review,
      // or re-approving a rejected store — and blink-server clears the note.
      if (!isUuid(target.storeId)) return { code: "invalid_target" };
      const expected = target.expectedUpdatedAt;
      return {
        path: `/merchant/admin/stores/${target.storeId}/status`,
        body: {
          status: approve ? "active" : "inactive",
          ...(approve ? {} : { note: text }),
          ...(isTimestamp(expected) ? { expected_updated_at: expected } : {}),
        },
      };
    }
    // Riders (rider_document) and agents (agent_document, agent_shop) add their
    // endpoints here with their tabs — see the plan's Task 7.
    default:
      return { code: "invalid_target" };
  }
}

// ─── One store document (PATCH /merchant/admin/stores/{id}/documents) ─────
/** The documents blink-server reviews (STORE_DOC_KEYS, repeated here to keep this module type-only). */
const DOCUMENT_KEYS: readonly StoreDocKey[] = ["commercial_register_front", "commercial_register_back", "nif", "nis"];

/** A scan URL or a NIF / NIS number — anything longer wasn't loaded from a store row. */
const VALUE_MAX = 4096;

/**
 * Staff's verdict on one document's current value. `expected_value` is the
 * value the reviewer saw: blink-server answers 409 (stale) when the merchant
 * changed it since, so a verdict never lands on a document nobody looked at.
 * A rejection needs a reason (shown to the merchant).
 */
export function buildDocumentReviewRequest(
  target: DocumentReviewTarget,
  verdict: DocumentVerdict,
  reason?: string | null
): ReviewRequest | { code: ReviewErrorCode } {
  if (!target || typeof target !== "object") return { code: "invalid_target" };
  if (!isUuid(target.storeId) || !DOCUMENT_KEYS.includes(target.document)) return { code: "invalid_target" };
  if (verdict !== "verified" && verdict !== "rejected") return { code: "invalid_target" };
  const expected = typeof target.expectedValue === "string" ? target.expectedValue.trim() : "";
  if (!expected || expected.length > VALUE_MAX) return { code: "invalid_target" };
  const text = typeof reason === "string" ? reason.trim() : "";
  const reject = verdict === "rejected";
  if (reject && !text) return { code: "note_required" };
  if (reject && text.length > NOTE_MAX) return { code: "note_too_long" };

  return {
    path: `/merchant/admin/stores/${target.storeId}/documents`,
    body: {
      document: target.document,
      status: verdict,
      ...(reject ? { reason: text } : {}),
      expected_value: expected,
    },
  };
}

/**
 * The refusals of a document verdict the reviewer can act on. blinkApi drops
 * blink-server's `code`, so a 400 is told apart by its message; every 409 of
 * this endpoint is `stale` (the document changed, or the store row moved on
 * while writing).
 */
export function documentErrorCode(res: { status: number; error: string }): ReviewErrorCode | null {
  if (res.status === 409) return "stale";
  if (res.status !== 400) return null;
  if (/document_missing|hasn't provided this document/i.test(res.error)) return "document_missing";
  if (/note_required|reason is required/i.test(res.error)) return "note_required";
  return null;
}
