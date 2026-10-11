// Domain types for the deletion-requests feature.
//
// One row of `account_deletion_requests` (blink-server Drizzle schema
// `account-deletion-requests.ts`) joined to its `users` row and to the staff member
// who processed it. Kept in sync by hand. Completing a request wipes the user's
// name/phone/email, so completed rows read them from `user_snapshot` instead.
export type DeletionStatus = "pending" | "completed" | "cancelled";

/** Reason codes the app sends; anything else is shown as-is. */
export const DELETION_REASONS = [
  "no_longer_use",
  "privacy_concerns",
  "technical_issues",
  "too_many_notifications",
  "other",
] as const;

/** `user_snapshot` — who the account belonged to, captured before the wipe. */
export interface DeletedUserSnapshot {
  name: string | null;
  phone_number: string | null;
  email: string | null;
}

export interface DeletionRequest {
  id: string;
  user_id: string;
  role: string;
  reason: string | null;
  feedback: string | null;
  status: DeletionStatus;
  processed_at: string | null;
  created_at: string;
  name: string | null;
  phone_number: string | null;
  email: string | null;
  /** Staff member who completed or cancelled the request. */
  processed_by_name: string | null;
}

/** PostgREST select for a request + its user + the staff member who processed it. */
// One literal (not concatenated) so supabase-js can type the select.
export const DELETION_REQUEST_SELECT =
  "id, user_id, role, reason, feedback, status, processed_at, processed_by, user_snapshot, created_at, user:users!account_deletion_requests_user_id_fkey(first_name, last_name, phone_number, email), staff:users!account_deletion_requests_processed_by_fkey(first_name, last_name, email)";
