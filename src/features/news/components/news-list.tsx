"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { StatGrid, StatCard, Card, Button, SearchBox, Badge, DashIcon, FilterPills, EmptyState, type Lang } from "@/components/ui";
import { N_ROLE_VARIANT, N_STATUS } from "../data";
import type { Post, PostStatus } from "../types";
import { useNewsStore } from "../store";
import { MetaCol } from "./meta-col";
import { PostPreview, type PreviewData } from "./post-preview";

type Filter = "all" | PostStatus;

function RowAction({ icon, label, onClick, danger }: { icon: string; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`w-8 h-8 inline-flex items-center justify-center rounded-lg text-subtext hover:bg-muted transition-colors cursor-pointer ${
        danger ? "hover:text-danger" : "hover:text-text"
      }`}
    >
      <DashIcon name={icon} className="w-[15px] h-[15px]" />
    </button>
  );
}

export function NewsList({ onNew }: { onNew: () => void }) {
  const t = useTranslations("news");
  const router = useRouter();
  const locale = useLocale() as Lang;
  const posts = useNewsStore((s) => s.posts);
  const togglePin = useNewsStore((s) => s.togglePin);
  const duplicatePost = useNewsStore((s) => s.duplicatePost);
  const deletePost = useNewsStore((s) => s.deletePost);

  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState<PreviewData | null>(null);

  const counts = useMemo(() => {
    const c = { all: posts.length, published: 0, scheduled: 0, draft: 0 } as Record<Filter, number>;
    posts.forEach((p) => (c[p.status] += 1));
    return c;
  }, [posts]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return posts.filter((p) => {
      if (filter !== "all" && p.status !== filter) return false;
      if (needle && !`${p.title} ${p.sum} ${p.cat}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [posts, filter, q]);

  const filterOptions: [Filter, string][] = [
    ["all", `${t("filters.all")} (${counts.all})`],
    ["published", `${t("filters.published")} (${counts.published})`],
    ["scheduled", `${t("filters.scheduled")} (${counts.scheduled})`],
    ["draft", `${t("filters.draft")} (${counts.draft})`],
  ];

  return (
    <>
      <StatGrid cols={4}>
        {/* Published/Scheduled track the live store (and agree with the filter pills);
            Reads & CTR stay as decorative aggregate brand figures. */}
        <StatCard label={t("stats.published")} value={counts.published} variant="success" icon="newspaper" change={t("stats.published_chg")} />
        <StatCard label={t("stats.scheduled")} value={counts.scheduled} variant="info" icon="calendar2" change={t("stats.scheduled_chg")} />
        <StatCard label={t("stats.reads")} value="1.2M" variant="primary" icon="trending" change={t("stats.reads_chg")} />
        <StatCard label={t("stats.ctr")} value="7.1%" variant="warning" icon="activity" change={t("stats.ctr_chg")} />
      </StatGrid>
      <div className="flex items-center gap-3 mb-[18px]">
        <SearchBox placeholder={t("search")} value={q} onChange={setQ} />
        <Button icon="plus" onClick={onNew} className="ms-auto">
          {t("new_post")}
        </Button>
      </div>
      <FilterPills options={filterOptions} value={filter} onChange={setFilter} />
      <Card>
        {visible.length === 0 ? (
          <EmptyState icon={<DashIcon name="newspaper" className="w-10 h-10" />} title={t("empty.title")} description={t("empty.desc")} />
        ) : (
          visible.map((p, i) => (
            <div key={p.id} className={`flex items-center gap-4 py-3.5 ${i ? "border-t border-border" : ""}`}>
              <div
                className="relative w-[84px] h-14 rounded-[10px] bg-cover bg-center bg-muted shrink-0"
                style={{ backgroundImage: `url(${p.cover})` }}
              >
                {p.pin && (
                  <span className="absolute -top-1.5 -start-1.5 w-[22px] h-[22px] rounded-full bg-primary flex items-center justify-center">
                    <DashIcon name="pin" className="w-3 h-3 text-white" />
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/news/${p.id}`}
                  className="text-[14.5px] font-bold text-text truncate hover:text-primary transition-colors block"
                >
                  {p.title}
                </Link>
                <div className="text-xs text-subtext mt-0.5 truncate">{p.sum}</div>
                <div className="flex gap-1.5 mt-[7px] flex-wrap">
                  <Badge variant="default">{p.cat}</Badge>
                  {p.roles.map((r) => (
                    <Badge key={r} variant={N_ROLE_VARIANT[r]}>
                      {r}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-[18px] shrink-0">
                <MetaCol value={p.views ? `${(p.views / 1000).toFixed(1)}k` : "—"} label={t("reads")} />
                <MetaCol value={p.ctr} label={t("ctr")} />
                <div className="text-center min-w-[54px]">
                  <Badge variant={N_STATUS[p.status]}>{t(`filters.${p.status}`)}</Badge>
                  <div className="text-[10px] text-subtext uppercase tracking-wide mt-1">{p.date}</div>
                </div>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <RowAction icon="eye" label={t("actions.preview")} onClick={() => setPreview(toPreview(p))} />
                <RowAction icon="pencil" label={t("actions.edit")} onClick={() => router.push(`/news/${p.id}?edit=1`)} />
                <RowAction icon="pin" label={t("actions.pin")} onClick={() => togglePin(p.id)} />
                <RowAction icon="copy" label={t("actions.duplicate")} onClick={() => duplicatePost(p.id)} />
                <RowAction icon="trash" label={t("actions.delete")} onClick={() => deletePost(p.id)} danger />
              </div>
            </div>
          ))
        )}
      </Card>
      <PostPreview open={!!preview} onClose={() => setPreview(null)} data={preview} lang={locale} />
    </>
  );
}

function toPreview(p: Post): PreviewData {
  return { cover: p.cover, cat: p.cat, cta: p.cta, roles: p.roles, content: p.content, title: p.title, sum: p.sum };
}
