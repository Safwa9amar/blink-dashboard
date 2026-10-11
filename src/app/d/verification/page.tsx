import { redirect } from "next/navigation";
import { canAccessPath } from "@/lib/auth/access";
import { requirePathAccess } from "@/lib/auth/staff";

// The old 3-tab review queue is split per partner type. Send the viewer to the
// first verification route their staff role can open (else the Overview).
const TARGETS = ["/riders/verification", "/agents/verification", "/merchants/verification"] as const;

export default async function VerificationRedirect() {
  const role = await requirePathAccess("/");
  redirect(TARGETS.find((href) => canAccessPath(role, href)) ?? "/");
}
