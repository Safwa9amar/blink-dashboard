import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { pageMeta } from "@/lib/dash-metadata";
import { WalletDetailView } from "@/features/blink-cash";
import { LoadError, MigrationNotice } from "@/features/blink-cash/components/ops-shared";
import { UUID_RE, type SearchParams } from "@/features/blink-cash/lib/filters";
import { getWalletDetail } from "../../ops-data";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("blink_cash", undefined, "tab_wallets");
}

export default async function Page({ params, searchParams }: { params: Promise<{ userId: string }>; searchParams: Promise<SearchParams> }) {
  const { userId } = await params;
  if (!UUID_RE.test(userId)) notFound();
  const sp = await searchParams;
  const raw = Math.floor(Number(Array.isArray(sp.page) ? sp.page[0] : sp.page));
  const page = Number.isFinite(raw) && raw >= 1 ? raw : 1;
  const { detail, transactions, migrationPending, error } = await getWalletDetail(userId, page);
  const t = await getTranslations("blink_cash");
  if (migrationPending) return <MigrationNotice t={t} />;
  if (error) return <LoadError t={t} error={error} />;
  if (!detail) notFound();
  return <WalletDetailView detail={detail} transactions={transactions} page={page} />;
}
