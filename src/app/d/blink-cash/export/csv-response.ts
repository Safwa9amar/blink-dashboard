import { CSV_BOM } from "@/features/blink-cash/lib/csv";
import { getStaffActor } from "@/lib/auth/staff";

/** 403 unless the signed-in staff role may open /blink-cash (route handlers have no layout guard). */
export async function guard(): Promise<Response | null> {
  return (await getStaffActor("/blink-cash")) ? null : new Response("Forbidden", { status: 403 });
}

export function csvResponse(name: string, body: string): Response {
  return new Response(CSV_BOM + body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}

/** Safe filename fragment (Algiers date). */
export const stamp = () => new Date(Date.now() + 3_600_000).toISOString().slice(0, 10);
