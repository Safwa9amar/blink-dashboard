import type { Variant } from "@/components/ui";
import type { RiderVerification } from "./types";

export const VERIFICATION_VARIANT: Record<RiderVerification, Variant> = {
  not_submitted: "default",
  pending: "warning",
  approved: "success",
  rejected: "danger",
};
