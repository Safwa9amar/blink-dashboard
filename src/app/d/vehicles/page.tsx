import { redirect } from "next/navigation";

// Vehicles were folded into Riders (each rider's vehicle shows in the rider list
// and detail). Keep this route as a redirect so old links / bookmarks still land.
export default function VehiclesPage() {
  redirect("/riders");
}
