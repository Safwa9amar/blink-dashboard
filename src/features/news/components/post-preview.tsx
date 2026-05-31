"use client";

import { useTranslations } from "next-intl";
import { Modal, Badge, dirFor, type Lang } from "@/components/ui";
import { N_CATS, N_ROLE_VARIANT } from "../data";
import type { PostContent } from "../types";

// Minimal shape the preview needs — a full Post satisfies it, and the Compose
// form can hand in an in-progress draft.
export interface PreviewData {
  cover: string;
  cat: string;
  cta?: string;
  roles?: string[];
  title?: string;
  sum?: string;
  content?: Partial<Record<Lang, PostContent>>;
}

export function PostPreview({
  open,
  onClose,
  data,
  lang,
}: {
  open: boolean;
  onClose: () => void;
  data: PreviewData | null;
  lang: Lang;
}) {
  const t = useTranslations("news");
  if (!data) return null;

  const catColor = N_CATS.find((c) => c.name === data.cat)?.color;
  // Resolve displayed content for the active language, falling back to English.
  // An all-empty language entry counts as a miss so the fallback actually fires
  // (the compose draft always defines all three keys, even when blank).
  const pick = (cc?: PostContent) => (cc && (cc.title || cc.sum || cc.body) ? cc : undefined);
  const c: PostContent =
    pick(data.content?.[lang]) ??
    pick(data.content?.en) ??
    ({ title: data.title ?? "", sum: data.sum ?? "", body: "" } as PostContent);
  const dir = dirFor(lang);
  const hasBody = !!c.body && c.body !== "<p></p>";

  return (
    <Modal open={open} onClose={onClose} title={t("preview_modal.title")}>
      <div className="w-[272px] mx-auto rounded-[26px] bg-background border border-border overflow-hidden shadow-2xl">
        <div className="relative h-[150px] bg-cover bg-center bg-muted" style={{ backgroundImage: `url(${data.cover})` }}>
          <span
            className="absolute top-3 start-3 bg-white/90 text-[9px] font-extrabold px-2.5 py-[3px] rounded-full uppercase tracking-wide"
            style={{ color: catColor }}
          >
            {data.cat}
          </span>
        </div>
        <div className="px-4 pt-4 pb-5 max-h-[55vh] overflow-y-auto" dir={dir}>
          <h4 className="text-[17px] font-bold text-text leading-tight">{c.title || t("preview.headline")}</h4>
          <p className="text-[13px] text-subtext mt-1.5 leading-normal">{c.sum || t("preview.summary")}</p>
          {hasBody ? (
            // Body is authored in our own admin editor (trusted). If this ever
            // rendered untrusted input, sanitize with DOMPurify first.
            <div className="blink-prose mt-3.5 !text-[13px]" dangerouslySetInnerHTML={{ __html: c.body }} />
          ) : (
            <p className="text-[12px] text-subtext mt-3.5 italic">{t("preview_modal.empty_body")}</p>
          )}
          <span className="mt-4 inline-flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-full">
            {data.cta || t("form.cta_ph")}
          </span>
        </div>
      </div>
      {data.roles && data.roles.length > 0 && (
        <div className="flex gap-1.5 justify-center mt-3 flex-wrap">
          {data.roles.map((r) => (
            <Badge key={r} variant={N_ROLE_VARIANT[r]}>
              {r}
            </Badge>
          ))}
        </div>
      )}
    </Modal>
  );
}
