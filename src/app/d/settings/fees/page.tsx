import { redirect } from "next/navigation";

// The mock Fees & Commission tab moved to the real pricing module.
export default function SettingsFeesPage() {
  redirect("/pricing");
}
