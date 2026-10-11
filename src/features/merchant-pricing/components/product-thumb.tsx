/* eslint-disable @next/next/no-img-element */
import { DashIcon } from "@/components/ui";

// Plain <img> (no next/image): product photos are arbitrary remote URLs and no
// remotePatterns are configured.
export function ProductThumb({ src, className = "w-10 h-10" }: { src?: string | null; className?: string }) {
  return src ? (
    <img src={src} alt="" loading="lazy" className={`${className} rounded-lg object-cover bg-muted shrink-0`} />
  ) : (
    <span
      className={`${className} rounded-lg bg-soft-pink text-primary inline-flex items-center justify-center shrink-0`}
    >
      <DashIcon name="package" className="w-4 h-4" />
    </span>
  );
}

/** Thumbnail + title + a muted sub-line, for table cells. */
export function ProductCellView({ src, title, sub }: { src?: string | null; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <ProductThumb src={src} />
      <div className="min-w-0">
        <p className="font-medium text-text truncate max-w-[240px]">{title}</p>
        {sub && <p className="text-xs text-subtext truncate max-w-[240px]">{sub}</p>}
      </div>
    </div>
  );
}
