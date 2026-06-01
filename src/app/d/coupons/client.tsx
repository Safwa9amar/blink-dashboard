"use client";

import { useRouter } from "next/navigation";
import { CouponsList, CreateCoupon } from "@/features/coupons";

export default function CouponsClient({ tab }: { tab: "list" | "create" }) {
  const router = useRouter();
  if (tab === "create") {
    return <CreateCoupon onCancel={() => router.push("/coupons")} />;
  }
  return <CouponsList onNew={() => router.push("/coupons/new")} />;
}
