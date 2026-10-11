/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";
import { Modal } from "@/components/ui";
import type { TFn } from "../types";
import { UntrustedUrl } from "./untrusted-url";

// Full-size document. Images render inline, PDFs in an iframe — only for a
// `trusted` URL (our own storage, see checkStoreUrl); anything else is shown as
// text and never loaded. Nothing sends a Referer to the file host.
export function DocumentViewer({
  open,
  t,
  title,
  url,
  trusted,
  isPdf,
  onClose,
  footer,
}: {
  open: boolean;
  t: TFn;
  title: string;
  url: string;
  trusted: boolean;
  isPdf: boolean;
  onClose: () => void;
  footer?: ReactNode;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} widthClassName="max-w-3xl">
      {trusted ? (
        <div className="rounded-xl overflow-hidden border border-border bg-background">
          {isPdf ? (
            <iframe src={url} title={title} referrerPolicy="no-referrer" className="w-full h-[70vh]" />
          ) : (
            <img src={url} alt={title} referrerPolicy="no-referrer" className="w-full max-h-[70vh] object-contain" />
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-background p-4">
          <UntrustedUrl t={t} url={url} />
        </div>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3 mt-4">
        {trusted && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
            className="text-sm font-semibold text-primary hover:underline"
          >
            {t("viewer.open_new_tab")}
          </a>
        )}
        {footer}
      </div>
    </Modal>
  );
}
