"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  PageHeader,
  Card,
  Badge,
  Button,
  DashIcon,
  LangTabs,
  dirFor,
  type Lang,
} from "@/components/ui";
import { Compose, useNewsStore, N_ROLE_VARIANT, N_STATUS } from "@/features/news";
import type { Post } from "@/features/news";

export default function NewsDetailClient({
  id,
  initialPost,
  startInEdit,
}: {
  id: string;
  initialPost: Post | null;
  startInEdit: boolean;
}) {
  const t = useTranslations("news");
  const locale = useLocale() as Lang;
  const [mode, setMode] = useState<"view" | "edit">(startInEdit ? "edit" : "view");
  const [lang, setLang] = useState<Lang>(locale);

  // Seed the store with the server-fetched post (only if absent, so an in-flight
  // optimistic edit isn't clobbered). The view reads from the store so edits show live.
  useEffect(() => {
    if (!initialPost) return;
    useNewsStore.setState((s) =>
      s.posts.some((p) => p.id === initialPost.id) ? s : { posts: [initialPost, ...s.posts] }
    );
  }, [initialPost]);

  const storePost = useNewsStore((s) => s.posts.find((p) => p.id === id));
  const post = storePost ?? initialPost;

  const back = (
    <Link
      href="/news"
      className="inline-flex items-center gap-1.5 text-sm text-subtext hover:text-text transition-colors mb-4"
    >
      <DashIcon name="chevron-left" className="w-4 h-4 rtl:-scale-x-100" />
      {t("detail.back")}
    </Link>
  );

  if (!post) {
    return (
      <div>
        {back}
        <Card className="text-center py-16">
          <p className="text-subtext text-sm">{t("detail.not_found")}</p>
        </Card>
      </div>
    );
  }

  if (mode === "edit") {
    return (
      <div>
        {back}
        <Compose initial={post} onCancel={() => setMode("view")} />
      </div>
    );
  }

  const copy = post.content?.[lang];
  const filled = {
    en: !!post.content?.en,
    fr: !!post.content?.fr,
    ar: !!post.content?.ar,
  };

  return (
    <div>
      {back}
      <PageHeader
        title={post.title}
        description={post.sum}
        actions={
          <Button icon="pencil" onClick={() => setMode("edit")}>
            {t("detail.edit")}
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
        <Card>
          <div
            className="h-44 -mx-5 -mt-5 mb-4 rounded-t-2xl bg-cover bg-center bg-muted"
            style={{ backgroundImage: `url(${post.cover})` }}
          />
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            <Badge variant={N_STATUS[post.status]}>{t(`filters.${post.status}`)}</Badge>
            <Badge variant="default">{post.cat}</Badge>
            {post.roles.map((r) => (
              <Badge key={r} variant={N_ROLE_VARIANT[r]}>
                {r}
              </Badge>
            ))}
            {post.pin && <Badge variant="warning">{t("preview.pinned")}</Badge>}
            {post.push && <Badge variant="primary">{t("preview.push_on")}</Badge>}
          </div>

          <LangTabs active={lang} onChange={setLang} filled={filled} />

          <div className="mt-4" dir={dirFor(lang)}>
            <h2 className="text-xl font-bold text-text leading-tight">{copy?.title || post.title}</h2>
            {copy?.sum && <p className="text-sm text-subtext mt-1.5">{copy.sum}</p>}
            {copy?.body ? (
              <div
                className="mt-4 text-sm text-text leading-relaxed [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-1 [&_h3]:font-bold [&_h3]:mt-4 [&_p]:mt-2.5 [&_ul]:list-disc [&_ul]:ps-5 [&_ul]:mt-2 [&_ol]:list-decimal [&_ol]:ps-5 [&_ol]:mt-2 [&_li]:mt-1 [&_blockquote]:border-s-2 [&_blockquote]:border-border [&_blockquote]:ps-3 [&_blockquote]:text-subtext [&_strong]:font-bold"
                dangerouslySetInnerHTML={{ __html: copy.body }}
              />
            ) : (
              <p className="mt-4 text-sm text-subtext italic">{t("detail.no_body")}</p>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card title={t("detail.article")}>
            <dl className="space-y-3 text-sm">
              <Row label={t("detail.reads")} value={post.views ? post.views.toLocaleString() : "—"} />
              <Row label={t("detail.ctr")} value={post.ctr} />
              {post.cta && <Row label={t("form.cta")} value={post.cta} />}
              {post.scheduledAt && (
                <Row label={t("detail.schedule")} value={fmt(post.scheduledAt)} />
              )}
              {post.expiresAt && <Row label={t("detail.expires")} value={fmt(post.expiresAt)} />}
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-subtext">{label}</dt>
      <dd className="font-semibold text-text text-end">{value}</dd>
    </div>
  );
}

function fmt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
