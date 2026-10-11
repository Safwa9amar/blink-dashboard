"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { rolesWithAccess } from "@/lib/auth/access";
import { hasStaffRole } from "@/lib/auth/staff";
import { blinkApi } from "@/lib/blink-api";
import { blinkApiErrorKey } from "@/lib/blink-api-errors";
import { buildVerificationRequest } from "@/features/riders/verification-request";

// "Request new verification": the rider must re-submit the chosen documents and
// goes offline until staff approve them. Nothing is written here: blink-server's
// staff endpoint (requireStaff) applies it, then the rider pages are re-read.
// blinkApi drops the server's `code`, so refusals are told apart by HTTP status
// (400 not_required, 404 unknown rider, 409 documents_conflict).
const SECTION = "/riders";
const NS = "riders.request.errors";

export type VerificationRequestOutcome =
  | { ok: true; status: string }
  | { ok: false; code: string; message: string };

interface ServerReply {
  verification_status?: string;
}

export async function requestRiderVerification(
  riderId: string,
  documents: string[],
  note: string
): Promise<VerificationRequestOutcome> {
  const t = await getTranslations(NS);
  const fail = (code: string, detail = ""): VerificationRequestOutcome => ({
    ok: false,
    code,
    message: t(code as never, { detail, max: "200" } as never),
  });

  const roles = rolesWithAccess(SECTION);
  if (!(await hasStaffRole(...roles))) return fail("forbidden");

  const request = buildVerificationRequest(riderId, documents, note);
  if ("code" in request) return fail(request.code);

  const res = await blinkApi<ServerReply>(request.path, { method: "POST", body: request.body, roles });
  const refresh = () => {
    revalidatePath(`/d/riders/${riderId}`);
    revalidatePath("/d/riders/verification");
    revalidatePath("/d/riders");
  };
  if (res.ok) {
    refresh();
    return { ok: true, status: res.data?.verification_status ?? "pending" };
  }
  if (res.status === 400) return fail("not_required");
  if (res.status === 404 || res.status === 409) {
    refresh(); // the rider or their documents changed: what's on screen is stale
    return fail(res.status === 404 ? "not_found" : "documents_conflict");
  }
  return fail(blinkApiErrorKey(res.status), res.error);
}
