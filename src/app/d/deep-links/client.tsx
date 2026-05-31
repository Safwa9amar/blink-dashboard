"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader, Button, StatGrid, StatCard, Card, SearchBox, FilterPills, DashIcon } from "@/components/ui";
import {
  DeepLinkTable,
  ImportDialog,
  DeepLinkField,
  useDeepLinksStore,
  useHydrateDeepLinks,
  ROLE_ORDER,
} from "@/features/deep-links";

export default function DeepLinksClient() {
  const t = useTranslations("deep_links");
  useHydrateDeepLinks();

  const routes = useDeepLinksStore((s) => s.routes);
  const scheme = useDeepLinksStore((s) => s.scheme);
  const source = useDeepLinksStore((s) => s.source);
  const reset = useDeepLinksStore((s) => s.reset);

  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const [importOpen, setImportOpen] = useState(false);
  const [testUrl, setTestUrl] = useState("");

  const paramRoutes = routes.filter((r) => r.requiresParams.length).length;
  const roleCounts = useMemo(() => {
    const m: Record<string, number> = {};
    routes.forEach((r) => (m[r.role] = (m[r.role] ?? 0) + 1));
    return m;
  }, [routes]);

  const filterOptions: [string, string, string?][] = [
    ["all", t("all")],
    ...ROLE_ORDER.filter((r) => roleCounts[r]).map((r) => [r, `${r} (${roleCounts[r]})`] as [string, string]),
  ];

  const rows = routes
    .filter((r) => (role === "all" ? true : r.role === role))
    .filter((r) => (q ? r.label.toLowerCase().includes(q.toLowerCase()) || r.deepLink.toLowerCase().includes(q.toLowerCase()) : true));

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button icon="download" onClick={() => setImportOpen(true)} className="[&_svg]:rotate-180">
            {t("import")}
          </Button>
        }
      />

      <StatGrid cols={4}>
        <StatCard label={t("stats.total")} value={routes.length} variant="primary" icon="map" />
        <StatCard label={t("stats.roles")} value={Object.keys(roleCounts).length} variant="info" icon="users" />
        <StatCard label={t("stats.with_params")} value={paramRoutes} variant="warning" icon="tag" />
        <StatCard label={t("stats.scheme")} value={`${scheme}://`} variant="success" icon="send" />
      </StatGrid>

      {source && (
        <div className="flex items-center gap-2 text-[12px] text-subtext mb-4 -mt-2">
          <DashIcon name="doc" className="w-3.5 h-3.5" />
          <span>{t("imported_from", { source })}</span>
          <button onClick={reset} className="text-primary hover:underline cursor-pointer">
            {t("reset_seed")}
          </button>
        </div>
      )}

      <Card title={t("builder.title")} description={t("builder.desc")} className="mb-5">
        <DeepLinkField value={testUrl} onChange={setTestUrl} />
      </Card>

      <div className="flex items-center gap-3 mb-[18px]">
        <SearchBox placeholder={t("search")} value={q} onChange={setQ} />
      </div>
      <FilterPills options={filterOptions} value={role} onChange={setRole} />
      <DeepLinkTable routes={rows} />

      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
