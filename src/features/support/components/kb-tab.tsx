"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import {
  StatGrid,
  StatCard,
  SearchBox,
  Button,
  DataTable,
  Badge,
  fInput,
  type Column,
  type Lang,
} from "@/components/ui";
import { ROLE_VARIANT, ART_STATUS } from "../data";
import { useKbStore } from "../kb-store";
import type {
  SupportArticleRow,
  SupportArticleStatus,
  SupportArticleType,
  SupportCategoryRow,
  TFn,
} from "../types";

// The list-display title/body for a row: first language that has a title.
function primaryContent(row: SupportArticleRow): { title: string; body: string } {
  for (const c of [row.content_eng, row.content_fr, row.content_ar]) {
    if (c && c.title.trim()) return c;
  }
  return { title: "", body: "" };
}

// Localized category label for the active dashboard locale.
function categoryLabel(cat: SupportCategoryRow | undefined, locale: Lang): string {
  if (!cat) return "";
  if (locale === "fr") return cat.label_fr ?? cat.label_eng;
  if (locale === "ar") return cat.label_ar ?? cat.label_eng;
  return cat.label_eng;
}

// Short "x ago" / date label from an ISO timestamp.
function shortWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const day = 86_400_000;
  if (diff < 60_000) return "now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < day) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function KbTab({
  t,
  onNew,
  onEdit,
}: {
  t: TFn;
  onNew: (type: SupportArticleType) => void;
  onEdit: (id: string) => void;
}) {
  const locale = useLocale() as Lang;
  const articles = useKbStore((s) => s.articles);
  const categories = useKbStore((s) => s.categories);

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [audience, setAudience] = useState<string>("all");
  const [status, setStatus] = useState<"all" | SupportArticleStatus>("all");
  const [type, setType] = useState<"all" | SupportArticleType>("all");

  const catByKey = useMemo(() => {
    const m: Record<string, SupportCategoryRow> = {};
    categories.forEach((c) => (m[c.key] = c));
    return m;
  }, [categories]);

  const stats = useMemo(() => {
    const s = { published: 0, draft: 0, review: 0, faq: 0 };
    articles.forEach((a) => {
      s[a.status] += 1;
      if (a.type === "faq") s.faq += 1;
    });
    return s;
  }, [articles]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return articles.filter((a) => {
      if (cat !== "all" && a.category !== cat) return false;
      if (audience !== "all" && !a.target_roles.includes(audience)) return false;
      if (status !== "all" && a.status !== status) return false;
      if (type !== "all" && a.type !== type) return false;
      if (needle) {
        const p = primaryContent(a);
        const hay = `${p.title} ${a.category}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [articles, q, cat, audience, status, type]);

  const columns: Column<SupportArticleRow>[] = [
    {
      key: "title",
      label: t("col.article"),
      render: (r) => (
        <button
          type="button"
          onClick={() => onEdit(r.id)}
          className="text-start font-semibold text-text hover:text-primary transition-colors cursor-pointer"
        >
          {primaryContent(r).title || t("kb.untitled")}
        </button>
      ),
    },
    {
      key: "category",
      label: t("col.category"),
      render: (r) => (
        <span className="text-xs text-subtext">
          {categoryLabel(catByKey[r.category], locale) || r.category}
        </span>
      ),
    },
    {
      key: "target_roles",
      label: t("col.audience"),
      render: (r) => (
        <span className="inline-flex gap-1.5 flex-wrap">
          {r.target_roles.map((x) => (
            <Badge key={x} variant={ROLE_VARIANT[x]}>
              {x}
            </Badge>
          ))}
        </span>
      ),
    },
    {
      key: "type",
      label: t("col.type"),
      render: (r) => (
        <Badge variant={r.type === "faq" ? "info" : "default"}>
          {r.type === "faq" ? t("kb.type_faq") : t("kb.type_article")}
        </Badge>
      ),
    },
    {
      key: "status",
      label: t("col.status"),
      render: (r) => <Badge variant={ART_STATUS[r.status]}>{t(`art.${r.status}`)}</Badge>,
    },
    {
      key: "views",
      label: t("col.views"),
      render: (r) => (
        <span className="font-mono text-subtext">{r.views ? r.views.toLocaleString() : "—"}</span>
      ),
    },
    {
      key: "updated_at",
      label: t("col.updated"),
      render: (r) => <span className="text-subtext">{shortWhen(r.updated_at)}</span>,
    },
  ];

  return (
    <>
      <StatGrid cols={4}>
        <StatCard label={t("kb.published")} value={stats.published} variant="success" icon="doc" change={t("kb.published_chg")} />
        <StatCard label={t("kb.drafts")} value={stats.draft + stats.review} variant="warning" icon="package" change={t("kb.drafts_chg")} />
        <StatCard label={t("kb.faqs")} value={stats.faq} variant="info" icon="chat" change={t("kb.faqs_chg")} />
        <StatCard label={t("kb.total")} value={articles.length} variant="primary" icon="grid" change={t("kb.total_chg")} />
      </StatGrid>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchBox placeholder={t("kb.search")} value={q} onChange={setQ} />
        <div className="flex items-center gap-2 ms-auto">
          <Button variant="secondary" icon="plus" onClick={() => onNew("faq")}>
            {t("kb.new_faq")}
          </Button>
          <Button icon="plus" onClick={() => onNew("article")}>
            {t("kb.new_article")}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5 mb-[18px]">
        <select className={`${fInput} w-auto`} value={type} onChange={(e) => setType(e.target.value as typeof type)} aria-label={t("col.type")}>
          <option value="all">{t("kb.all_types")}</option>
          <option value="article">{t("kb.type_article")}</option>
          <option value="faq">{t("kb.type_faq")}</option>
        </select>
        <select className={`${fInput} w-auto`} value={cat} onChange={(e) => setCat(e.target.value)} aria-label={t("col.category")}>
          <option value="all">{t("kb.all_categories")}</option>
          {categories.map((c) => (
            <option key={c.key} value={c.key}>
              {categoryLabel(c, locale)}
            </option>
          ))}
        </select>
        <select className={`${fInput} w-auto`} value={audience} onChange={(e) => setAudience(e.target.value)} aria-label={t("col.audience")}>
          <option value="all">{t("kb.all_audiences")}</option>
          {["All", "Customer", "Rider", "Merchant", "Agent"].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select className={`${fInput} w-auto`} value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label={t("col.status")}>
          <option value="all">{t("kb.all_statuses")}</option>
          <option value="draft">{t("art.draft")}</option>
          <option value="review">{t("art.review")}</option>
          <option value="published">{t("art.published")}</option>
        </select>
      </div>

      <DataTable columns={columns} data={visible} empty={t("kb.empty")} />
    </>
  );
}
