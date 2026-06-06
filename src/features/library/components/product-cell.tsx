/* eslint-disable @next/next/no-img-element */
import { DashIcon } from "@/components/ui";

// Thumbnail + name + sub cell for the catalog table. Plain <img> (no next/image)
// since catalog photos are arbitrary remote URLs and no remotePatterns are configured.
export function ProductCell({ name, sub, image }: { name: string; sub?: string; image?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      {image ? (
        <img
          src={image}
          alt=""
          className="w-9 h-9 rounded-lg object-cover bg-muted shrink-0"
          loading="lazy"
        />
      ) : (
        <span className="w-9 h-9 rounded-lg bg-soft-pink text-primary inline-flex items-center justify-center shrink-0">
          <DashIcon name="package" className="w-4 h-4" />
        </span>
      )}
      <div className="flex flex-col">
        <span className="font-semibold text-text">{name}</span>
        {sub && <span className="text-xs text-subtext">{sub}</span>}
      </div>
    </div>
  );
}
