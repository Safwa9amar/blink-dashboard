"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, DashIcon, FilterPills, LivePill, PageHeader, Segmented } from "@/components/ui";
import { useInbox } from "@/components/shell/inbox-provider";
import { InboxRow } from "@/features/inbox";
import { loadInboxPage } from "@/lib/shell/actions";
import type { InboxCategory } from "@/lib/shell/inbox-kinds";
import type { InboxItem, InboxPage } from "@/lib/shell/inbox-types";

type Tab = "all" | "unread";
type Category = "all" | InboxCategory;

const byNewest = (a: InboxItem, b: InboxItem) => (a.at === b.at ? (a.id < b.id ? 1 : -1) : a.at < b.at ? 1 : -1);

/** Fresh rows win; older rows already paged in stay below them. */
function merge(fresh: InboxItem[], current: InboxItem[]): InboxItem[] {
  const ids = new Set(fresh.map((i) => i.id));
  return [...fresh, ...current.filter((i) => !ids.has(i.id))].sort(byNewest);
}

export default function InboxClient({ initial, categories }: { initial: InboxPage; categories: InboxCategory[] }) {
  const t = useTranslations("inbox");
  const { unread, live, version, markRead, markAllRead } = useInbox();
  const [category, setCategory] = useState<Category>("all");
  const [tab, setTab] = useState<Tab>("all");
  const [items, setItems] = useState<InboxItem[]>(initial.items);
  const [more, setMore] = useState(initial.more);
  const [failed, setFailed] = useState(!!initial.error);
  const [loading, setLoading] = useState(false);
  // Only the latest request may land (filters can change while one is in flight).
  const req = useRef(0);

  const query = useCallback(
    (extra: { before?: InboxItem } = {}) =>
      loadInboxPage({
        category: category === "all" ? undefined : category,
        unreadOnly: tab === "unread",
        before: extra.before ? { at: extra.before.at, id: extra.before.id } : undefined,
      }),
    [category, tab]
  );

  const reload = useCallback(
    async (mode: "replace" | "merge") => {
      const id = ++req.current;
      if (mode === "replace") setLoading(true);
      try {
        const page = await query();
        if (id !== req.current) return;
        setFailed(!!page.error);
        if (page.error) return;
        setItems((cur) => (mode === "replace" ? page.items : merge(page.items, cur)));
        if (mode === "replace") setMore(page.more);
      } catch {
        if (id === req.current) setFailed(true);
      } finally {
        if (id === req.current) setLoading(false);
      }
    },
    [query]
  );

  // Filters changed: start over. (The server rendered the unfiltered first page.)
  const loadedFilters = useRef("all|all");
  useEffect(() => {
    const key = `${category}|${tab}`;
    if (key === loadedFilters.current) return;
    loadedFilters.current = key;
    void reload("replace");
  }, [category, tab, reload]);

  // A live event refreshed the bell: pull the newest rows into the list too.
  const seenVersion = useRef(version);
  useEffect(() => {
    if (version === seenVersion.current) return;
    seenVersion.current = version;
    void reload("merge");
  }, [version, reload]);

  const loadMore = async () => {
    const last = items[items.length - 1];
    if (!last) return;
    const id = ++req.current;
    setLoading(true);
    try {
      const page = await query({ before: last });
      if (id !== req.current) return;
      if (page.error) {
        setFailed(true);
        return;
      }
      setItems((cur) => merge(page.items, cur));
      setMore(page.more);
    } finally {
      if (id === req.current) setLoading(false);
    }
  };

  const onOpen = (item: InboxItem) => {
    if (!item.unread) return;
    markRead([item.id]);
    setItems((cur) => cur.map((i) => (i.id === item.id ? { ...i, unread: false } : i)));
  };

  const onMarkAll = () => {
    markAllRead();
    setItems((cur) => cur.map((i) => ({ ...i, unread: false })));
  };

  const categoryOptions: [Category, string][] = [
    ["all", t("categories.all")],
    ...categories.map((c): [Category, string] => [c, t(`categories.${c}`)]),
  ];

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <>
            {live ? (
              <LivePill>{t("live")}</LivePill>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-[12.5px] font-semibold text-subtext">
                <span className="w-2 h-2 rounded-full bg-subtext/50" />
                {t("connecting")}
              </span>
            )}
            <Button variant="secondary" size="md" icon="check" onClick={onMarkAll} disabled={unread === 0}>
              {t("mark_all_read")}
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        {categories.length > 1 ? <FilterPills options={categoryOptions} value={category} onChange={setCategory} /> : <span />}
        <Segmented<Tab>
          options={[
            ["all", t("filter.all")],
            ["unread", unread > 0 ? `${t("filter.unread")} · ${unread > 99 ? "99+" : unread}` : t("filter.unread")],
          ]}
          value={tab}
          onChange={setTab}
          className="mb-4"
        />
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {failed && items.length === 0 ? (
          <div className="py-16 text-center text-sm">
            <p className="text-subtext">{t("error")}</p>
            <button type="button" onClick={() => void reload("replace")} className="mt-2 text-primary text-[12.5px] font-semibold hover:underline cursor-pointer">
              {t("retry")}
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-subtext text-sm">
            <span className="w-12 h-12 rounded-2xl bg-soft-pink text-primary flex items-center justify-center">
              <DashIcon name="bell" className="w-6 h-6" />
            </span>
            {loading ? t("loading") : tab === "unread" ? t("empty_unread") : category === "all" ? t("empty") : t("empty_filtered")}
          </div>
        ) : (
          <div className={loading ? "opacity-60 transition-opacity" : undefined}>
            {items.map((item) => (
              <InboxRow key={item.id} item={item} onOpen={onOpen} />
            ))}
          </div>
        )}
      </div>

      {more && items.length > 0 && (
        <div className="flex justify-center mt-4">
          <Button variant="secondary" size="md" onClick={() => void loadMore()} loading={loading}>
            {t("load_more")}
          </Button>
        </div>
      )}
    </div>
  );
}
