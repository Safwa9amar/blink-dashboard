import { redirect } from "next/navigation";

// Vehicle documents are reviewed with the rider documents.
export default function VehicleDocumentsPage() {
  redirect("/riders/verification");
}
