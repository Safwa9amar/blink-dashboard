import { StatGrid, StatCard, SearchBox, Button, DataTable, Badge, type Column } from "@/components/ui";
import { ARTICLES, ROLE_VARIANT, ART_STATUS, type Article } from "../data";
import type { TFn } from "../types";


export function KbTab({ t, onNew }: { t: TFn; onNew: () => void }) {
  const columns: Column<Article>[] = [
    { key: "title", label: t("col.article"), render: (r) => <span className="font-semibold text-text">{r.title}</span> },
    { key: "cat", label: t("col.category"), render: (r) => <span className="text-xs text-subtext">{r.cat}</span> },
    {
      key: "roles",
      label: t("col.audience"),
      render: (r) => (
        <span className="inline-flex gap-1.5 flex-wrap">
          {r.roles.map((x) => (
            <Badge key={x} variant={ROLE_VARIANT[x]}>
              {x}
            </Badge>
          ))}
        </span>
      ),
    },
    { key: "status", label: t("col.status"), render: (r) => <Badge variant={ART_STATUS[r.status]}>{r.status}</Badge> },
    { key: "views", label: t("col.views"), render: (r) => <span className="font-mono text-subtext">{r.views ? r.views.toLocaleString() : "—"}</span> },
    { key: "updated", label: t("col.updated"), tdClass: "text-subtext" },
  ];
  return (
    <>
      <StatGrid cols={4}>
        <StatCard label={t("kb.published")} value={72} variant="success" icon="doc" change={t("kb.published_chg")} />
        <StatCard label={t("kb.drafts")} value={11} variant="warning" icon="package" change={t("kb.drafts_chg")} />
        <StatCard label={t("kb.reads")} value="148K" variant="info" icon="trending" change={t("kb.reads_chg")} />
        <StatCard label={t("kb.helpful")} value="91%" variant="primary" icon="star" change={t("kb.helpful_chg")} />
      </StatGrid>
      <div className="flex items-center gap-3 mb-[18px]">
        <SearchBox placeholder={t("kb.search")} />
        <Button variant="secondary" icon="filter">{t("col.category")}</Button>
        <Button icon="plus" onClick={onNew} className="ms-auto">
          {t("new_article")}
        </Button>
      </div>
      <DataTable columns={columns} data={ARTICLES} empty={t("kb.empty")} />
    </>
  );
}
