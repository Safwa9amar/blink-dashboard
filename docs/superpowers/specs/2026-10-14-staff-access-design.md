# Staff Access (ERP mock module 2 of 5)

Date: 2026-10-14. Replaces the mock `src/features/access` roster (`data.ts` STAFF/ACCESS_LOG + zustand `store.ts`) with real data and real account management.

## Why

- The Access page shows invented people. Real console accounts (`users.staff_role IS NOT NULL`) are invisible.
- A lost dashboard password could only be fixed by hand in SQL. A super_admin must be able to reset any staff password from the dashboard, and every staff member must be able to change their own.
- `createStaffMember` inserts `is_active`, a column `users` does not have, so "Create staff" is broken today.

## Decisions

- **No email delivery.** The project uses Supabase's default SMTP (team-only recipients, ~2 mails/hour), so invite links and "forgot password" emails are unreliable. New accounts and resets get a **generated temporary password shown once** to the super_admin (copy button), and the account is flagged to **change it at next sign-in**.
- **Forced change flag** lives in `auth.users.raw_app_meta_data.must_change_password` (app metadata: users can't edit it themselves). It is set and cleared only by server actions through the service-role admin API.
- **Suspension = Supabase auth ban** (`auth.admin.updateUserById(id, { ban_duration: "876000h" })`; reinstate with `ban_duration: "none"`). A banned user can't sign in or refresh. Their current access token can live up to 1 h; accepted.
- **Revoke access** sets `users.staff_role = NULL`. It never deletes the account (the person may also be an app user).
- **Audit trail**: new table `public.staff_access_events` (blink-server migration `20261014200000_staff_access_events.sql`, already written): `id, actor_id, target_id, action, from_role, to_role, note, created_at`. `action ∈ created | granted | role_changed | revoked | suspended | reinstated | password_reset | password_changed`. Service role only (RLS on, no policies). Every write action below inserts one row; a failed audit insert must not fail the action (log it to the server console).
- **Guards** (server-side, in every action): caller must be `super_admin` (via `getStaffActor("/access")`). A super_admin can't change their own role, revoke or suspend themselves, or reset their own password through the admin flow (they use "Change my password"). An action may never leave **zero active (non-banned) super_admins**.
- Pages also call `requirePathAccess("/access")` (the layout check alone doesn't re-run on client navigation).

## Status of a staff member (derived)

| Status | Rule |
|---|---|
| `suspended` | `banned_until` in the future |
| `must_change` | `app_metadata.must_change_password === true` (shown as "Temporary password") |
| `never_signed_in` | `last_sign_in_at` is null |
| `active` | otherwise |

Precedence top to bottom.

## Data (server, service-role `createAdminClient()`)

`src/app/d/access/data.ts`:

```ts
export interface StaffMemberRow {
  id: string;
  firstName: string; lastName: string; name: string; // name = first + last, or email local part
  email: string; phone: string | null;
  staffRole: StaffRole;
  status: "active" | "must_change" | "never_signed_in" | "suspended";
  lastSignInAt: string | null; createdAt: string;
}
export interface AccessEventRow {
  id: string; action: AccessEventAction;
  actorName: string | null; targetName: string | null; targetEmail: string | null;
  fromRole: StaffRole | null; toRole: StaffRole | null; note: string | null; createdAt: string;
}
export async function loadStaff(): Promise<StaffMemberRow[]>;           // users where staff_role not null + auth.admin.getUserById per id (≤ ~50 staff)
export async function loadAccessEvents(opts?: { limit?: number; action?: AccessEventAction; targetId?: string }): Promise<AccessEventRow[]>; // newest first, default 200; names joined from users
```

If `staff_access_events` doesn't exist yet (Postgres `42P01`), `loadAccessEvents` returns `[]` and the Activity page shows a "log not enabled yet" note instead of failing.

## Actions (`src/app/d/access/action.ts`, all `"use server"`)

All return `{ error: string | null, ... }` where `error` is an i18n key under `access.errors.*` or a raw DB message. Error keys: `not_authorized`, `invalid_role`, `invalid_input`, `email_exists`, `already_staff`, `not_found`, `self_action`, `last_super_admin`, `wrong_password`, `weak_password`, `same_password`, `not_signed_in`.

```ts
createStaffAccount(input: { firstName: string; lastName?: string; email: string; phone?: string; staffRole: StaffRole })
  → { error, tempPassword?: string }   // auth.admin.createUser({ email, password: temp, email_confirm: true, app_metadata: { must_change_password: true } }) then insert public.users { id, email, first_name, last_name, phone_number, staff_role }. If the email already belongs to an auth user → error "email_exists" (UI suggests "Grant access" instead). Roll back the auth user if the users insert fails.
grantStaffAccess(userId: string, staffRole: StaffRole) → { error }      // existing app user; error "already_staff" if staff_role already set
searchGrantCandidates(query: string) → CandidateHit[]                    // users with staff_role IS NULL, by name/email/phone (reuse the coupons search approach: per-word .or(), phone with leading 0 stripped), limit 8
changeStaffRole(userId: string, staffRole: StaffRole) → { error }
revokeStaffAccess(userId: string) → { error }
suspendStaff(userId: string, suspend: boolean) → { error }
resetStaffPassword(userId: string) → { error, tempPassword?: string }   // auth.admin.updateUserById(id, { password: temp, app_metadata: { ...existing, must_change_password: true } })
changeOwnPassword(input: { currentPassword?: string; newPassword: string }) → { error }
  // any signed-in staff. If the caller is NOT flagged must_change, verify currentPassword with a separate non-persisting anon client signInWithPassword(email, current) (error "wrong_password"). Then admin update { password, app_metadata.must_change_password: false } and log password_changed.
```

Temporary password: 14 chars from an unambiguous alphabet (no 0/O/1/l/I), at least one digit and one letter, `crypto.getRandomValues`/`randomInt` — pure helper `generateTempPassword()` in `src/features/access/password.ts` with `validateNewPassword(pw)` (min 10 chars, a letter and a digit, not equal to current). Unit-test both.

## Forced password change flow

- `src/lib/auth/staff.ts`: add `mustChangePassword(): Promise<boolean>` (reads `user.app_metadata.must_change_password` from `supabase.auth.getUser()`).
- The dashboard root layout (`src/app/d/layout.tsx`) redirects to `/login/password` when it's true.
- New page `src/app/login/password/page.tsx` (+ client form): served on the dashboard host like `/login` (already passed through by middleware). No session → redirect `/login`. Shows "Set a new password" (forced: new + confirm) or "Change password" (voluntary: current + new + confirm). On success → `/`.
- `src/app/login/page.tsx`: after a successful sign-in, if `data.user.app_metadata.must_change_password` → go to `/login/password` instead of `/`. Map Supabase's banned error ("User is banned") to a translated "This account is suspended. Contact a super admin."
- Staff menu (`src/components/shell/staff-menu.tsx`): add "Change password" → `/login/password`.

## UI

**Members tab (`/access`)**
- KPI row: total staff, super admins, signed in last 7 days, suspended.
- Toolbar: search (name/email/phone), role filter, status filter; buttons "Grant access" (existing user) and "Add staff" (new account).
- Table: name + email (+ phone), role badge, status badge, last sign-in (`formatDay` from `@/features/promotions`, plus relative "3 h ago" when within 7 days), created. The signed-in super_admin's own row shows "You".
- Row actions (Edit role button + "⋯" menu like the promotions list): Change role, Reset password, Suspend/Reinstate, Revoke access. Disabled with a tooltip when a guard forbids it (self, last super admin). Destructive ones use a confirm dialog (Modal, not `window.confirm`).
- **Temporary password dialog** (after create or reset): shows the email and password in a mono box with a Copy button, the note "Shown once. Share it privately; they must change it at first sign-in.", and "Done".
- Add staff dialog: first/last name, email, phone (optional), role select with the role description under it. react-hook-form + yup or the existing form pattern in this feature. Email exists → message with a "Grant access instead" link that opens the Grant dialog prefilled.
- Grant access dialog: candidate search (debounced, "Searching…", "No users match"), pick a user, choose role.

**Activity tab (`/access/activity`)**: real events table: when (date + time, Algiers), actor, action (translated, colored badge), target (name + email), role change "ops_admin → finance_admin", note. Filters: action, and a search on actor/target. Empty state.

**Roles tab (`/access/roles`)**: keep RolesReference + PermissionMatrix; add the live member count per role.

Delete the mock `data.ts` STAFF/ACCESS_LOG, `store.ts`, and components that only served the mock (keep `ROUTE_LABEL_KEY`/`ALL_SECTIONS`/role helpers the Roles tab needs).

i18n: every string in en/fr/ar (`src/features/access/locales`). RTL: logical properties, `dir="auto"` on names, `dir="ltr"` on emails/phones/passwords.

## Out of scope

Email invites, 2FA, per-user custom permissions, deleting accounts, session listing.

## Rollout

1. Apply blink-server migration `20261014200000_staff_access_events.sql` (needs owner approval).
2. Deploy the dashboard (push to main → Vercel).
3. Verify on the live dashboard as admin@blink.dz.
