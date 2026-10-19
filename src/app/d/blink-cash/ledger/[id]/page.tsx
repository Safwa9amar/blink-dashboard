import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { pageMeta } from "@/lib/dash-metadata";
import { TxDetailView } from "@/features/blink-cash";
import { LoadError, MigrationNotice } from "@/features/blink-cash/components/ops-shared";
import { UUID_RE } from "@/features/blink-cash/lib/filters";
import { getTxDetail } from "../../ops-data";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("blink_cash", undefined, "tab_ledger");
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const { detail, migrationPending, error } = await getTxDetail(id);
  const t = await getTranslations("blink_cash");
  if (migrationPending) return <MigrationNotice t={t} />;
  if (error) return <LoadError t={t} error={error} />;
  if (!detail) notFound();
  return <TxDetailView detail={detail} />;
}
