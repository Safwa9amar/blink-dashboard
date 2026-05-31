// Mock data for the Verification (KYC) queue — from the Blink Design System handoff (extras2.jsx).
import type { Variant } from "@/components/ui";

import type { KycRow } from "./types";
export type { KycRow } from "./types";

export const KYC: KycRow[] = [
  { who: "Riad Mansouri", role: "rider", doc: "Driving licence + ID", sub: "12m ago", status: "pending" },
  { who: "ModaDZ", role: "merchant", doc: "RC (Front) · NIF · NIS", sub: "38m ago", status: "pending" },
  { who: "Sofiane Brahimi", role: "rider", doc: "Vehicle registration", sub: "1h ago", status: "in_progress" },
  { who: "Kiosque Nour", role: "agent", doc: "RC (Back)", sub: "2h ago", status: "rejected", reason: "Image too blurry" },
  { who: "Beauty Box", role: "merchant", doc: "RIB · bank details", sub: "3h ago", status: "missing_info", reason: "Missing RIB" },
  { who: "Amine Belkacem", role: "rider", doc: "Identity verification", sub: "5h ago", status: "approved" },
];

export const KYC_STATUS: Record<string, Variant> = {
  pending: "warning",
  in_progress: "info",
  rejected: "danger",
  missing_info: "danger",
  approved: "success",
};

export const kycLbl = (s: string) => s.replace(/_/g, " ");
