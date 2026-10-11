import { DashIcon } from "@/components/ui";
import type { TFn } from "../types";

// A file URL that doesn't point at our own storage (see checkStoreUrl): never
// loaded or linked, just flagged with the raw value as plain text so staff can
// see where it goes. `bare` drops the warning line when it already shows nearby.
export function UntrustedUrl({ t, url, bare = false }: { t: TFn; url: string; bare?: boolean }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      {!bare && (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-warning">
          <DashIcon name="warn" className="w-3.5 h-3.5 shrink-0" />
          {t("viewer.untrusted")}
        </span>
      )}
      <span dir="ltr" title={url} className="text-[11px] text-subtext font-mono break-all line-clamp-3 select-all">
        {url}
      </span>
    </div>
  );
}
