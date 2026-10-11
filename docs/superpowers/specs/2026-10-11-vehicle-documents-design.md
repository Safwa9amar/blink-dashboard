# Vehicle documents verification: design + plan

- **Date:** 2026-10-11
- **Repos:**
  - blink-server and blink (mobile): `feat/openapi` working trees. They hold the user's uncommitted work, so we **don't commit there**.
  - blink-dashboard: `feat/erp-shell`.
- **Decision:** option A.
  - New motorcycle riders need the vehicle documents approved before they can be approved.
  - Already-approved riders keep working until they upload.
  - A **rejected** vehicle document de-approves the rider: offline, jobs released, notification.
  - Bicycles need no vehicle documents.

## Approach: reuse the rider-document pipeline

Gray card and insurance become new keys in `rider_profiles.documents` (jsonb). They get the existing upload, storage, compare-and-swap review, notifications, signed previews and dashboard tiles for free. **No database migration.** The `vehicles.*_url/*_status` columns stay but become unused; dropping them is a separate, user-approved change.

New keys: `gray_card_front`, `gray_card_back`, `insurance` (single page).

`requiredDocumentKeys(vehicleType)`:

| Vehicle type | Required keys |
|---|---|
| bicycle | `id_front`, `id_back` |
| motorcycle / unknown | `id_front`, `id_back`, `license_front`, `license_back`, `gray_card_front`, `gray_card_back`, `insurance` |

`deriveVerificationStatus` is **unchanged**. Rules: any required doc rejected → rejected; all present and verified → approved; else previously approved stays approved (the grace period for existing riders); all present → pending; else not_submitted.

The required-actions checklist gets a `vehicle_documents` action (motorcycles; missing or rejected gray card or insurance). It is the existing in-app "banner" for approved riders who still need to upload. There are no periodic push reminders (YAGNI).

Out of scope:
- Insurance expiry.
- Deleting orphaned storage objects.
- Dropping `vehicles.driving_license_*`, `gray_card_*`, `insurance_*` (a destructive migration that needs explicit approval).

## Plan

### S: blink-server (phase 1, parallel with D)

- `RIDER_DOCUMENT_KEYS` and `RiderDocumentKeySchema` gain the 3 keys. The `riderUploadSchema` and `updateRiderDocumentsSchema` (PATCH `/riders/documents`) accept them. `isOwnDocumentPath` works for them.
- `requiredDocumentKeys` follows the table above. `documentsView` returns the new keys.
- `DOC_LABELS` (admin-review notices, en/fr/ar, `frFem` true for "carte grise" and "attestation d'assurance").
- `riderRequiredActions` gains the `vehicle_documents` action. Handle the single-key `insurance` (`documentPair` assumes pairs).
- `PATCH /admin/riders/{id}/documents` accepts the new keys (via the shared schema).
- `npm run openapi` regenerates `openapi.json`.
- Tests: add or extend unit tests for `requiredDocumentKeys`, `deriveVerificationStatus` (an approved rider missing vehicle docs stays approved; a rejected `insurance` leads to rejected) and `riderRequiredActions`, if the repo has a test runner. Run typecheck and lint.

### D: blink-dashboard (phase 1)

- `src/features/verification/partners.ts`: `RIDER_DOC_KEYS` gains the 3 keys. `required` comes from the vehicle type (bicycle → id only; otherwise all 7). Tiles are grouped Identity / Licence / Vehicle.
- `src/app/d/verification/partner-data.ts`: the `RIDER_DOCS` list gains the 3 keys (pending filter + signing).
- `rider-queue.tsx`: tiles wrap and get group headings. The en/fr/ar `partners.doc.*` labels are added.
- `src/features/riders` detail panel and `src/app/d/riders/page.tsx`: show the gray card and insurance status from `rider_profiles.documents`, not the `vehicles` columns.
- Fix: `src/app/d/deletion-requests/action.ts` writes `rider_profiles.license_front_url/license_back_url`, which were dropped in migration `20261010232028`. Remove that dead update. Clearing the vehicle doc columns can stay.
- Gates: `npm test`, tsc, eslint on changed files, `npm run build`.

### M: blink mobile (phase 2, after S has regenerated `openapi.json`)

- `npm run api:sync`.
- `components/rider/profile/VehicleDocumentsScene.tsx`: wire it to `useRiderDocuments()` / `useUploadRiderDocument()` (`hooks/use-rider-verification.ts`) for `gray_card_front`, `gray_card_back`, `insurance`. Show the server status and reject note, the same as `DocumentsScene`.
  - Remove the duplicate driving-licence row.
  - Remove the local-only doc state (`store/rider/vehicle-store.ts` doc fields) and the seeding from `vehicle.*_url/status` in `hooks/use-rider-vehicle.ts`.
- The required-actions screen renders `vehicle_documents` and links to My vehicle → documents.
- Profile completion counts the server's required documents (which now include the vehicle keys for motorcycles).
- i18n in en/ar/fr/ch. Gates: `npm run i18n:check`, `npx tsc --noEmit`, `npm run lint`, related jest tests.

### Release (user-approved only)

1. Deploy blink-server, so the mobile app's new keys are accepted.
2. Ship the mobile update.
3. Deploy the dashboard.

There's no database push.
