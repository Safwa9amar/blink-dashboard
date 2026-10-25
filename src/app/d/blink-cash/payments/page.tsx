import { redirect } from "next/navigation";

// The Payments tab was folded into the rest of Blink Cash: online deposits are ledger
// rows, card dues payments sit in the dues tabs, providers are in Settings and the
// payments that need a look are in Review.
export default function Page() {
  redirect("/blink-cash/review");
}
