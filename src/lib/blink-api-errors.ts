// Maps a failed blinkApi() call to a translated message for the operator.
//
// blinkApi only surfaces `{ status, error }` (blink-server's `code` is dropped), so the
// mapping is by HTTP status. Each feature's locale bundle defines the keys under
// `<namespace>.errors.*` — `conflict` / `throttled` / `invalid` read differently per
// endpoint — and the raw server message only shows up as `{detail}` in the
// catch-all keys (`invalid`, `generic`). Server actions only (reads the request locale).
import { getTranslations } from "next-intl/server";

export type BlinkApiErrorKey =
  | "network"
  | "session"
  | "forbidden"
  | "not_found"
  | "invalid"
  | "conflict"
  | "throttled"
  | "generic";

export function blinkApiErrorKey(status: number): BlinkApiErrorKey {
  switch (status) {
    case 0:
      return "network"; // fetch failed / timed out
    case 401:
      return "session";
    case 403:
      return "forbidden";
    case 404:
      return "not_found";
    case 400:
      return "invalid";
    case 409:
      return "conflict";
    case 429:
      return "throttled";
    default:
      return "generic";
  }
}

/** `<namespace>.errors.<key>` for this failure; `{detail}` carries the raw server message. */
export async function blinkApiErrorMessage(
  namespace: string,
  res: { status: number; error: string }
): Promise<string> {
  const t = await getTranslations(`${namespace}.errors`);
  return t(blinkApiErrorKey(res.status), { detail: res.error });
}
