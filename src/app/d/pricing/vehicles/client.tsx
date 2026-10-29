"use client";

import { VehiclesView, type VehicleClass } from "@/features/pricing";

export default function PricingVehiclesClient(props: { classes: VehicleClass[]; canEdit: boolean; error?: string }) {
  return <VehiclesView {...props} />;
}
