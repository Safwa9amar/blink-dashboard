"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  PageHeader,
  Button,
  StatGrid,
  StatCard,
  Card,
  SearchBox,
  FilterPills,
  Badge,
  Toggle,
  DataTable,
  FormRow,
  fInput,
  DashIcon,
  type Column,
} from "@/components/ui";
import {
  DeepLinkField,
  ImportDialog,
  ROLE_VARIANT,
  ROLE_ORDER,
  useHydrateDeepLinks,
  useDeepLinksStore,
  parseDeepLink,
  extractParams,
  missingParams,
  fillRoute,
  type ManagedDeepLink,
  type DeepLinkRole,
} from "@/features/deep-links";
import { createDeepLink, deleteDeepLink, toggleDeepLinkActive } from "./action";

export default function DeepLinksClient({
  links,
  error,
}: {
  links: ManagedDeepLink[];
  error: string | null;
}) {
  const t = useTranslations("deep_links");
  const router = useRouter();
  useHydrateDeepLinks();

  const routes = useDeepLinksStore((s) => s.routes);
  const scheme = useDeepLinksStore((s) => s.scheme);

  // ─── Create form ───────────────────────────────────────────────────
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [campaign, setCampaign] = useState("");
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const missing = url ? missingParams(url) : [];
  const canSave = !!title.trim() && !!url.trim() && missing.length === 0 && !busy;

  // The two resolved forms of the in-progress link (see the app's gen-deeplinks.js):
  //   previewHref → internal "/(role)/…/<value>" for router.push() / a push data.href
  //   url         → external "blink://…" for SMS / QR / email
  const parsed = useMemo(() => parseDeepLink(url, routes), [url, routes]);
  const previewHref =
    url && missing.length === 0 && parsed.route ? fillRoute(parsed.route.routePath, parsed.params) : null;

  async function handleCreate() {
    if (!canSave) return;
    setBusy(true);
    setFormErr(null);
    const res = await createDeepLink({
      title: title.trim(),
      role: (parsed.route?.role ?? "shared") as DeepLinkRole,
      routePath: parsed.route?.routePath ?? url.trim(),
      deepLink: url.trim(),
      requiredParams: parsed.route?.requiresParams ?? extractParams(url),
      params: parsed.params ?? {},
      campaign: campaign.trim() || null,
      isActive: active,
    });
    setBusy(false);
    if (res.error) {
      setFormErr(res.error);
      return;
    }
    setUrl("");
    setTitle("");
    setCampaign("");
    setActive(true);
    router.refresh();
  }

  // ─── Mutations on saved links ──────────────────────────────────────
  async function handleToggle(l: ManagedDeepLink) {
    await toggleDeepLinkActive(l.id, !l.is_active);
    router.refresh();
  }

  async function handleDelete(l: ManagedDeepLink) {
    if (!confirm(t("manage.confirm_delete", { title: l.title }))) return;
    await deleteDeepLink(l.id);
    router.refresh();
  }

  // ─── List: stats, filters ──────────────────────────────────────────
  const totalClicks = links.reduce((n, l) => n + (l.clicks ?? 0), 0);
  const activeCount = links.filter((l) => l.is_active).length;

  const roleCounts = useMemo(() => {
    const m: Record<string, number> = {};
    links.forEach((l) => (m[l.role] = (m[l.role] ?? 0) + 1));
    return m;
  }, [links]);

  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");

  const filterOptions: [string, string][] = [
    ["all", t("all")],
    ...ROLE_ORDER.filter((r) => roleCounts[r]).map(
      (r) => [r, `${r} (${roleCounts[r]})`] as [string, string]
    ),
  ];

  const rows = links
    .filter((l) => (role === "all" ? true : l.role === role))
    .filter((l) => {
      if (!q) return true;
      const n = q.toLowerCase();
      return (
        l.title.toLowerCase().includes(n) ||
        l.slug.toLowerCase().includes(n) ||
        l.deep_link.toLowerCase().includes(n)
      );
    });

  const columns: Column<ManagedDeepLink>[] = [
    {
      key: "title",
      label: t("manage.col.link"),
      render: (l) => (
        <div className="min-w-0 space-y-1">
          <div className="font-medium text-text truncate">{l.title}</div>
          <CopyText value={fillRoute(l.route_path, l.params)} primary />
          <CopyText value={l.deep_link} />
        </div>
      ),
    },
    {
      key: "role",
      label: t("manage.col.role"),
      render: (l) => <Badge variant={ROLE_VARIANT[l.role]}>{l.role}</Badge>,
    },
    {
      key: "campaign",
      label: t("manage.col.campaign"),
      render: (l) => (l.campaign ? <span className="text-subtext">{l.campaign}</span> : "—"),
    },
    {
      key: "clicks",
      label: t("manage.col.clicks"),
      render: (l) => <span className="tabular-nums font-medium">{l.clicks ?? 0}</span>,
    },
    {
      key: "is_active",
      label: t("manage.col.status"),
      sortable: false,
      render: (l) => <Toggle on={l.is_active} onClick={() => handleToggle(l)} />,
    },
    {
      key: "actions",
      label: "",
      sortable: false,
      tdClass: "text-end",
      render: (l) => (
        <button
          type="button"
          onClick={() => handleDelete(l)}
          aria-label={t("manage.delete")}
          className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-subtext hover:text-danger hover:bg-danger-light transition-colors cursor-pointer"
        >
          <DashIcon name="trash" className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("manage.description")}
        actions={
          <Button
            variant="secondary"
            icon="download"
            onClick={() => setImportOpen(true)}
            className="[&_svg]:rotate-180"
          >
            {t("import")}
          </Button>
        }
      />

      <StatGrid cols={4}>
        <StatCard label={t("manage.stats.total")} value={links.length} variant="primary" icon="map" />
        <StatCard label={t("manage.stats.active")} value={activeCount} variant="success" icon="send" />
        <StatCard label={t("manage.stats.clicks")} value={totalClicks} variant="info" icon="trending" />
        <StatCard label={t("manage.stats.scheme")} value={`${scheme}://`} variant="warning" icon="tag" />
      </StatGrid>

      {error && (
        <div className="mb-4 rounded-xl border border-danger/30 bg-danger-light px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <Card title={t("manage.create_title")} description={t("manage.create_desc")} className="mb-5">
        <FormRow label={t("manage.destination")}>
          <DeepLinkField value={url} onChange={setUrl} />
        </FormRow>

        {previewHref && (
          <div className="mb-5 rounded-xl border border-border bg-background px-4 py-3 grid sm:grid-cols-2 gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-subtext mb-1">
                {t("manage.href_label")}
              </div>
              <CopyText value={previewHref} primary />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-subtext mb-1">
                {t("manage.url_label")}
              </div>
              <CopyText value={url} />
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-x-5">
          <FormRow label={t("manage.title_label")}>
            <input
              className={fInput}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("manage.title_ph")}
            />
          </FormRow>
          <FormRow label={t("manage.campaign_label")} hint={t("manage.optional")}>
            <input
              className={fInput}
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder={t("manage.campaign_ph")}
            />
          </FormRow>
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <Toggle on={active} onClick={() => setActive((v) => !v)} />
            <span className="text-sm font-medium text-text">{t("manage.active")}</span>
          </label>
          <div className="flex items-center gap-3">
            {formErr && <span className="text-sm text-danger">{formErr}</span>}
            {!formErr && missing.length > 0 && (
              <span className="text-sm text-subtext">{t("manage.need_params")}</span>
            )}
            <Button icon="plus" onClick={handleCreate} disabled={!canSave}>
              {busy ? t("manage.saving") : t("manage.save")}
            </Button>
          </div>
        </div>
      </Card>

      <Card
        title={t("manage.saved_title")}
        description={t("manage.saved_desc")}
        bodyClassName="p-0"
        className="overflow-hidden"
      >
        <div className="flex items-center gap-3 px-5 pt-5">
          <SearchBox placeholder={t("manage.search_saved")} value={q} onChange={setQ} />
        </div>
        <div className="px-5 pt-3">
          <FilterPills options={filterOptions} value={role} onChange={setRole} />
        </div>
        <div className="px-5 pb-5">
          <DataTable columns={columns} data={rows} emptyMessage={t("manage.none_saved")} pageSize={10} />
        </div>
      </Card>

      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}

// Inline, click-to-copy mono string with a brief confirmation flash.
function CopyText({ value, primary = false }: { value: string; primary?: boolean }) {
  const t = useTranslations("deep_links");
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      title={t("manage.copy")}
      onClick={() => {
        void navigator.clipboard?.writeText(value);
        setDone(true);
        setTimeout(() => setDone(false), 1200);
      }}
      className={`group inline-flex items-center gap-1.5 max-w-full font-mono text-[12px] ${
        primary ? "text-text" : "text-subtext"
      } hover:text-primary transition-colors cursor-pointer`}
    >
      <span className="truncate">{value}</span>
      {done ? (
        <span className="text-success text-[11px] shrink-0">✓</span>
      ) : (
        <DashIcon name="copy" className="w-3 h-3 shrink-0 opacity-60 group-hover:opacity-100" />
      )}
    </button>
  );
}
