import { cache } from "react";
import { getTranslations } from "next-intl/server";
import { requirePathAccess } from "@/lib/auth/staff";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import {
  buildStoreQueue,
  storesWithDocumentsToVerify,
  type StoreCounts,
  type StoreQueueLoad,
  type VerificationQueues,
} from "@/features/verification";

// Server-only reads for /merchants/verification through the service-role client:
// `stores` only exposes active rows under RLS, so the cookie client would miss
// every store waiting on review. Every load gates on the section first, so a
// staff role without /merchants never gets applicant rows in its payload.
// Nothing is written here — see action.ts.
const SECTION = "/merchants";

/** Rows loaded per store filter; the exact totals come back alongside (`counts`). */
const QUEUE_LIMIT = 100;

/** Live stores read per request when looking for documents to verify (document columns only). */
const SCAN_PAGE = 1000;
/** Safety cap on that scan; past it the count says how many live stores it covers. */
const SCAN_MAX = 20_000;

type Admin = Awaited<ReturnType<typeof createAdminClient>>;

// The owner's account deletion requests ride along (user_id fkey — processed_by
// also points at users): an owner leaving Blink can't have a store approved.
const USER_COLS =
  "first_name, last_name, phone_number, account_deletion_requests!account_deletion_requests_user_id_fkey(status, created_at)";
const STORE_SELECT = [
  "id, owner_id, name, status, review_note, logo, image, gallery",
  "location, city, wilaya, latitude, longitude, category_slugs, description",
  "phone, whatsapp, email, hours, documents, document_review, created_at, updated_at",
  `users!stores_owner_id_fkey(${USER_COLS})`,
  "store_products(count)",
].join(", ");

const NO_COUNTS: StoreCounts = {
  pending: 0,
  documents: 0,
  rejected: 0,
  live: 0,
  resubmitted: 0,
  documentsChecked: 0,
  documentsComplete: true,
};

interface DocumentScan {
  /** Live stores with a document to verify, oldest store first. */
  ids: string[];
  /** Live stores checked. */
  checked: number;
  /** Every live store was checked (the scan didn't stop at SCAN_MAX). */
  complete: boolean;
  error: string | null;
}

/**
 * Which live stores have a document waiting on staff. "Pending" is derived (a
 * document's current value vs the value its verdict was given on, see
 * effectiveDocStatus), so PostgREST can't filter or count it: every live
 * store's document columns are read, page by page, oldest first, and checked
 * here. Only the ids leave the server.
 */
async function scanLiveDocuments(db: Admin): Promise<DocumentScan> {
  const ids = new Set<string>();
  let total: number | null = null;
  let checked = 0;
  while (checked < SCAN_MAX) {
    const { data, error, count } = await db
      .from("stores")
      .select("id, documents, document_review", checked === 0 ? { count: "exact" } : undefined)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(checked, checked + SCAN_PAGE - 1);
    if (error) return { ids: [], checked: 0, complete: false, error: error.message };
    if (checked === 0) total = count ?? null;
    const rows: unknown[] = data ?? [];
    for (const id of storesWithDocumentsToVerify(rows)) ids.add(id);
    // Pages advance by what came back, so a lower PostgREST max-rows still covers everything.
    checked += rows.length;
    if (rows.length === 0 || (total !== null && checked >= total)) {
      return { ids: [...ids], checked, complete: true, error: null };
    }
  }
  return { ids: [...ids], checked, complete: false, error: null };
}

async function loadStores(db: Admin): Promise<StoreQueueLoad> {
  const list = () => db.from("stores").select(STORE_SELECT, { count: "exact" });
  const [pending, rejected, live, resubmitted, scan] = await Promise.all([
    // Waiting on staff, oldest submission first.
    list().eq("status", "under_review").order("created_at", { ascending: true }).limit(QUEUE_LIMIT),
    // Rejected / deactivated with a note (a note-less inactive store was hidden
    // for another reason and isn't reviewable), latest first.
    list()
      .eq("status", "inactive")
      .not("review_note", "is", null)
      .order("updated_at", { ascending: false })
      .limit(QUEUE_LIMIT),
    list().eq("status", "active").order("updated_at", { ascending: false }).limit(QUEUE_LIMIT),
    db
      .from("stores")
      .select("id", { count: "exact", head: true })
      .eq("status", "under_review")
      .not("review_note", "is", null),
    scanLiveDocuments(db),
  ]);

  const failed =
    pending.error?.message ??
    rejected.error?.message ??
    live.error?.message ??
    resubmitted.error?.message ??
    scan.error;
  if (failed) return { items: [], error: failed, counts: NO_COUNTS };

  // Documents to verify: the QUEUE_LIMIT oldest stores the scan found. Rows the
  // live list already holds are reused; the others are read here.
  // STORE_SELECT is built at runtime, so supabase-js can't type the rows: buildStoreQueue reads them defensively.
  const liveRows = (live.data ?? []) as unknown as { id: string }[];
  const rowsById = new Map<string, unknown>(liveRows.map((row) => [row.id, row]));
  const documentIds = scan.ids.slice(0, QUEUE_LIMIT);
  const toRead = documentIds.filter((id) => !rowsById.has(id));
  if (toRead.length > 0) {
    const extra = await db.from("stores").select(STORE_SELECT).in("id", toRead);
    if (extra.error) return { items: [], error: extra.error.message, counts: NO_COUNTS };
    for (const row of (extra.data ?? []) as unknown as { id: string }[]) rowsById.set(row.id, row);
  }
  const documentRows = documentIds.map((id) => rowsById.get(id)).filter((row) => row !== undefined);

  return {
    items: buildStoreQueue({
      pending: pending.data ?? [],
      documents: documentRows,
      rejected: rejected.data ?? [],
      live: liveRows,
    }),
    error: null,
    counts: {
      pending: pending.count ?? 0,
      documents: scan.ids.length,
      rejected: rejected.count ?? 0,
      live: live.count ?? 0,
      resubmitted: resubmitted.count ?? 0,
      documentsChecked: scan.checked,
      documentsComplete: scan.complete,
    },
  };
}

// Riders and agents have their own loaders (partner-data.ts) behind their own sections.
export const getVerificationQueues = cache(async (): Promise<VerificationQueues> => {
  await requirePathAccess(SECTION);
  // Without the service key createAdminClient falls back to the RLS client,
  // which only sees active stores: every review queue would look empty.
  if (!hasServiceRole()) {
    const t = await getTranslations("verification");
    return { stores: { items: [], error: t("service_role_missing"), counts: NO_COUNTS } };
  }
  const db = await createAdminClient();
  const [stores] = await Promise.all([loadStores(db)]);
  return { stores };
});
