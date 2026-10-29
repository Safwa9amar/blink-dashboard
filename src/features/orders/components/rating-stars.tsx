/** "★★★★☆" for a 1–5 rating, with the number for screen readers and copy-paste. */
export function RatingStars({ value, max = 5 }: { value: number; max?: number }) {
  const full = Math.max(0, Math.min(max, Math.round(value)));
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={`${value}/${max}`}>
      <span aria-hidden className="tracking-wider">
        <span className="text-warning">{"★".repeat(full)}</span>
        <span className="text-border">{"★".repeat(max - full)}</span>
      </span>
      <span className="text-xs text-subtext tabular-nums">
        {value}/{max}
      </span>
    </span>
  );
}
