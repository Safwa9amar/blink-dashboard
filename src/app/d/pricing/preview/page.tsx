import { redirect } from "next/navigation";

// The old Preview tab is now the Simulator; keep its query string.
export default async function PricingPreviewRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (Array.isArray(v)) v.forEach((x) => qs.append(k, x));
    else if (v !== undefined) qs.set(k, v);
  }
  redirect(`/pricing/simulator${qs.size ? `?${qs}` : ""}`);
}
