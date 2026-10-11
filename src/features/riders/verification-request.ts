// "Request new verification": staff ask a rider to re-submit chosen documents. Pure
// helpers (no I/O) shared by the dialog and the server action; blink-server
// re-validates everything (requireStaff + Zod + which documents the vehicle needs).
import {
  RIDER_DOC_KEYS,
  RIDER_NOTE_MAX,
  isRiderDocRequired,
  type RiderDocKey,
  type RiderDocSlot,
} from "@/features/verification/partners";
import { isUuid } from "./detail";

export type VerificationRequestError = "invalid_target" | "no_documents" | "note_required" | "note_too_long";

export interface VerificationRequest {
  path: string;
  body: { documents: RiderDocKey[]; note: string };
}

/** The documents this rider's vehicle type requires, in display order. */
export function requiredDocKeys(vehicleType: string | null): RiderDocKey[] {
  return RIDER_DOC_KEYS.filter((key) => isRiderDocRequired(vehicleType, key));
}

/** The dialog opens with every required document ticked. */
export function defaultSelection(vehicleType: string | null): RiderDocKey[] {
  return requiredDocKeys(vehicleType);
}

/** Required document slots only (the dialog never offers a document the vehicle doesn't need). */
export function requiredSlots(docs: readonly RiderDocSlot[]): RiderDocSlot[] {
  return docs.filter((d) => d.required);
}

/** POST /riders/admin/riders/{id}/verification-request, or the first reason it can't be sent. */
export function buildVerificationRequest(
  riderId: unknown,
  documents: unknown,
  note: unknown,
  vehicleType: string | null | undefined = undefined
): VerificationRequest | { code: VerificationRequestError } {
  if (!isUuid(riderId)) return { code: "invalid_target" };
  if (!Array.isArray(documents)) return { code: "invalid_target" };
  const keys = documents as unknown[];
  if (keys.some((k) => !RIDER_DOC_KEYS.includes(k as RiderDocKey))) return { code: "invalid_target" };
  const unique = RIDER_DOC_KEYS.filter((k) => keys.includes(k));
  if (unique.length === 0) return { code: "no_documents" };
  // When the vehicle type is known, a document it doesn't need can't be requested.
  if (vehicleType !== undefined && unique.some((k) => !isRiderDocRequired(vehicleType, k))) {
    return { code: "invalid_target" };
  }
  const text = typeof note === "string" ? note.trim() : "";
  if (!text) return { code: "note_required" };
  if (text.length > RIDER_NOTE_MAX) return { code: "note_too_long" };
  return { path: `/riders/admin/riders/${riderId}/verification-request`, body: { documents: unique, note: text } };
}
