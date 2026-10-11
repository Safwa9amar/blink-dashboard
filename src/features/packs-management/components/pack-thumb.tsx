/* eslint-disable @next/next/no-img-element */
import { DashIcon } from "@/components/ui";

// Plain <img> (no next/image): pack / product photos are arbitrary remote URLs and
// no remotePatterns are configured.
export function PackThumb({
  src,
  icon = "gift",
  className = "w-10 h-10",
}: {
  src?: string | null;
  icon?: string;
  className?: string;
}) {
  return src ? (
    <img src={src} alt="" loading="lazy" className={`${className} rounded-lg object-cover bg-muted shrink-0`} />
  ) : (
    <span
      className={`${className} rounded-lg bg-soft-pink text-primary inline-flex items-center justify-center shrink-0`}
    >
      <DashIcon name={icon} className="w-4 h-4" />
    </span>
  );
}
