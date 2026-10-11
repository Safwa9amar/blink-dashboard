import { redirect } from "next/navigation";

// Agent shops were folded into Agents (the shop shows in the agent list and detail).
// Keep this route as a redirect so old links / bookmarks still land.
export default function AgentShopsPage() {
  redirect("/agents");
}
