import type { DeletedUserSnapshot, DeletionRequest, DeletionStatus } from "./types";

type UserEmbed = {
  first_name?: string | null;
  last_name?: string | null;
  phone_number?: string | null;
  email?: string | null;
};

// A to-one embed can come back from PostgREST as a one-element array.
function one(value: unknown): UserEmbed {
  const v = value as UserEmbed | UserEmbed[] | null | undefined;
  return (Array.isArray(v) ? v[0] : v) ?? {};
}

const fullName = (u: UserEmbed) => [u.first_name, u.last_name].filter(Boolean).join(" ") || null;

/** Maps a `DELETION_REQUEST_SELECT` row to the view row. */
export function toDeletionRequest(row: Record<string, unknown>): DeletionRequest {
  const user = one(row.user);
  const staff = one(row.staff);
  // The snapshot wins: after completion the live user row is blank.
  const snapshot = row.user_snapshot as DeletedUserSnapshot | null;
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    role: row.role as string,
    reason: row.reason as string | null,
    feedback: row.feedback as string | null,
    status: row.status as DeletionStatus,
    processed_at: row.processed_at as string | null,
    created_at: row.created_at as string,
    name: snapshot?.name ?? fullName(user),
    phone_number: snapshot?.phone_number ?? user.phone_number ?? null,
    email: snapshot?.email ?? user.email ?? null,
    processed_by_name: fullName(staff) ?? staff.email ?? null,
  };
}
