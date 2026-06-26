// Generic loading placeholder — a pulsing muted block. Compose with width/height/
// radius utility classes (e.g. <Skeleton className="h-12 w-40 rounded-2xl" />) to
// mirror the shape of the content it stands in for while data loads.
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />;
}
