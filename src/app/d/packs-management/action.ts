"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import type { StaffRole } from "@/lib/auth/access";
import { hasStaffRole } from "@/lib/auth/staff";
import { blinkApi, type BlinkApiResult } from "@/lib/blink-api";
import { blinkApiErrorMessage } from "@/lib/blink-api-errors";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PACK_IMAGE_BUCKET,
  PACK_IMAGE_TYPES,
  hasDraftErrors,
  isUuid,
  packDraftBody,
  validatePackDraft,
  type PackDraft,
  type PackDraftErrors,
  type PackProductOption,
} from "@/features/packs-management";
import { getStoreProducts } from "./data";

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

// ─── Staff create / edit / delete ────────────────────────────────────
// Same roles, all through blink-server (it validates the items against the store,
// notifies the merchant and skips review for staff packs); the drafts are checked
// here first with the editor's own rules (validatePackDraft) so a bad payload never
// leaves the dashboard. Error copy lives under `packs.editor.errors.*`.
const EDITOR_NS = "packs.editor";

export interface PackWriteResult {
  /** Translated, for the operator. */
  error?: string;
  /**
   * `conflict` (409, changed since loaded) / `not_found` (404). Nothing is revalidated
   * then, so the caller decides: the editor keeps the draft and offers a reload / a way
   * back, the list's actions `router.refresh()` the stale list.
   */
  reason?: "conflict" | "not_found";
  /** Per-field validation keys under `packs.editor.validation.*`. */
  fieldErrors?: PackDraftErrors;
  /** The created pack's id. */
  id?: string;
}

/**
 * The list tabs, after a successful write only. In this Next version a revalidatePath
 * inside a server action also re-renders the page the action was called from, so on a
 * failed save it would remount the editor (keyed by the pack version) with the newer
 * pack and throw the operator's draft away — or hit notFound() — before the conflict
 * message could show. Failures leave the refresh to the caller (see PackWriteResult).
 */
function refreshLists() {
  revalidatePath("/d/packs-management");
  revalidatePath("/d/packs-management/all");
}

const asDraft = (input: unknown): Partial<PackDraft> =>
  input && typeof input === "object" && !Array.isArray(input) ? (input as Partial<PackDraft>) : {};

/** `expected_updated_at` only when it looks like the raw timestamp we loaded. */
const expectedStamp = (v: unknown): string | null =>
  typeof v === "string" && v.length > 0 && v.length <= 64 ? v : null;

async function forbidden(): Promise<string> {
  return blinkApiErrorMessage(EDITOR_NS, { status: 403, error: "" });
}

/** blink-server's error `code` (the body is `{ error, code? }`). */
function errorCode(res: { body?: unknown }): string | undefined {
  const code = res.body && typeof res.body === "object" ? (res.body as { code?: unknown }).code : undefined;
  return typeof code === "string" ? code : undefined;
}

async function writeError(
  res: Extract<BlinkApiResult<unknown>, { ok: false }>,
  notFoundKey: "not_found" | "store_not_found"
): Promise<PackWriteResult> {
  const t = await getTranslations(`${EDITOR_NS}.errors`);
  const code = errorCode(res);
  if (res.status === 400 && (code === "duplicate_items" || code === "invalid_items" || code === "empty")) {
    return { error: t(code) };
  }
  if (res.status === 404) return { error: t(notFoundKey), reason: "not_found" };
  if (res.status === 409) return { error: t("conflict"), reason: "conflict" };
  return { error: await blinkApiErrorMessage(EDITOR_NS, res) };
}

/** Creates a pack for `storeId` (POST /merchant/admin/stores/{storeId}/packs). */
export async function createPack(storeId: string, draft: PackDraft): Promise<PackWriteResult> {
  if (!(await hasStaffRole(...PACK_ROLES))) return { error: await forbidden() };
  const t = await getTranslations(`${EDITOR_NS}.errors`);
  if (!isUuid(storeId)) return { error: t("store_not_found"), reason: "not_found" };

  const input = asDraft(draft);
  const fieldErrors = validatePackDraft(input, "create");
  if (hasDraftErrors(fieldErrors)) return { error: t("validation"), fieldErrors };

  const res = await blinkApi<{ pack?: { id?: unknown } }>(
    `/merchant/admin/stores/${encodeURIComponent(storeId)}/packs`,
    { method: "POST", body: packDraftBody(input), roles: PACK_ROLES }
  );
  if (!res.ok) return writeError(res, "store_not_found");

  refreshLists();
  const id = res.data?.pack?.id;
  return typeof id === "string" ? { id } : {};
}

/**
 * Updates the fields in `patch` (PATCH /merchant/admin/packs/{packId}); the status
 * only changes when the patch carries one. `expectedUpdatedAt` is the pack's raw
 * `updated_at` as loaded — blink-server answers 409 if it changed since.
 */
export async function updatePack(
  packId: string,
  patch: Partial<PackDraft>,
  expectedUpdatedAt: string
): Promise<PackWriteResult> {
  if (!(await hasStaffRole(...PACK_ROLES))) return { error: await forbidden() };
  const t = await getTranslations(`${EDITOR_NS}.errors`);
  if (!isUuid(packId)) return { error: t("not_found"), reason: "not_found" };

  const input = asDraft(patch);
  const fieldErrors = validatePackDraft(input, "update");
  if (hasDraftErrors(fieldErrors)) return { error: t("validation"), fieldErrors };
  const body = packDraftBody(input);
  if (Object.keys(body).length === 0) return { error: t("empty") };

  const stamp = expectedStamp(expectedUpdatedAt);
  const res = await blinkApi(`/merchant/admin/packs/${encodeURIComponent(packId)}`, {
    method: "PATCH",
    body: { ...body, ...(stamp ? { expected_updated_at: stamp } : {}) },
    roles: PACK_ROLES,
  });
  if (!res.ok) return writeError(res, "not_found");

  refreshLists();
  return {};
}

/** Deletes a pack for good (DELETE /merchant/admin/packs/{packId}); orders keep their snapshot. */
export async function deletePack(packId: string, expectedUpdatedAt: string): Promise<PackWriteResult> {
  if (!(await hasStaffRole(...PACK_ROLES))) return { error: await forbidden() };
  const t = await getTranslations(`${EDITOR_NS}.errors`);
  if (!isUuid(packId)) return { error: t("not_found"), reason: "not_found" };

  const stamp = expectedStamp(expectedUpdatedAt);
  const query = stamp ? `?expected_updated_at=${encodeURIComponent(stamp)}` : "";
  const res = await blinkApi(`/merchant/admin/packs/${encodeURIComponent(packId)}${query}`, {
    method: "DELETE",
    roles: PACK_ROLES,
  });
  if (!res.ok) return writeError(res, "not_found");

  refreshLists();
  return {};
}

/** One store's products for the create flow's product picker (read only, service role). */
export async function loadStoreProducts(
  storeId: string
): Promise<{ products: PackProductOption[]; error?: string }> {
  if (!(await hasStaffRole(...PACK_ROLES))) return { products: [], error: await forbidden() };
  if (!isUuid(storeId)) {
    const t = await getTranslations(`${EDITOR_NS}.errors`);
    return { products: [], error: t("store_not_found") };
  }
  return getStoreProducts(storeId);
}

/**
 * A one-time signed upload URL for a pack photo in the public `merchant` bucket — the
 * one the merchant app's pack photos go to (blink-server POST /merchant/uploads) —
 * under `packs/{storeId}/`. The browser uploads the file straight to Storage
 * (uploadToSignedUrl), so the bytes never pass through this action.
 */
export async function createPackImageUploadUrl(
  storeId: string,
  contentType: string
): Promise<{ path?: string; token?: string; error?: string }> {
  if (!(await hasStaffRole(...PACK_ROLES))) return { error: await forbidden() };
  const t = await getTranslations(`${EDITOR_NS}.errors`);
  if (!isUuid(storeId)) return { error: t("store_not_found") };
  const ext = PACK_IMAGE_TYPES[contentType];
  if (!ext) return { error: t("image_type") };

  const path = `packs/${storeId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const supabase = await createAdminClient();
  const { data, error } = await supabase.storage.from(PACK_IMAGE_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { error: t("upload_failed", { detail: error?.message ?? "" }) };
  return { path: data.path, token: data.token };
}
