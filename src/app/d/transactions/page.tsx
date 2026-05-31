import { redirect } from "next/navigation";

// Transactions were folded into the Blink Cash finance hub (its Ledger tab).
// Keep this route as a permanent redirect so old links / bookmarks still land.
export default function TransactionsPage() {
  redirect("/blink-cash");
}
