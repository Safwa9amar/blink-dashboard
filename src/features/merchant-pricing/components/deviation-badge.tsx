import { Badge } from "@/components/ui";
import { isOverTolerance } from "../rows";

/** Signed % gap from the reference price — red past the ±20% tolerance. */
export function DeviationBadge({ deviation }: { deviation: number | null }) {
  if (deviation === null) return <span className="text-subtext">—</span>;
  return (
    <Badge variant={isOverTolerance(deviation) ? "danger" : "success"}>
      <span dir="ltr">
        {deviation > 0 ? "+" : ""}
        {deviation.toFixed(1)}%
      </span>
    </Badge>
  );
}
