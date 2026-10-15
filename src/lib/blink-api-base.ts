// blink-server base URLs, in failover order (Render primary, then spare) — the same
// pair the mobile app fails over between. BLINK_API_BASE_URL may hold one URL or a
// comma-separated list; the retired greenpedal host is ignored so a stale env var
// can't take the dashboard's server calls down. Server-only (no NEXT_PUBLIC_).

const DEFAULT_BASES = ["https://blink-server-q4ey.onrender.com", "https://blink-server-spare.onrender.com"];
const RETIRED = /greenpedal\.net/i;

export function parseApiBases(env: string | undefined): string[] {
  const fromEnv = (env ?? "")
    .split(",")
    .map((s) => s.trim().replace(/\/+$/, ""))
    .filter((u) => u && !RETIRED.test(u));
  return [...new Set([...fromEnv, ...DEFAULT_BASES])];
}

export const BLINK_API_BASES = parseApiBases(process.env.BLINK_API_BASE_URL);
export const BLINK_API_BASE = BLINK_API_BASES[0];

// The connection was never made, so retrying a write on the next instance can't double it.
const NOT_CONNECTED = new Set(["ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED", "ECONNRESET", "UND_ERR_CONNECT_TIMEOUT"]);

export function shouldFailOver(method: string, err: unknown): boolean {
  if (method.toUpperCase() === "GET") return true;
  const cause = (err as { cause?: { code?: string } } | null)?.cause;
  return !!cause?.code && NOT_CONNECTED.has(cause.code);
}

/**
 * `fetch(base + path)` against each instance in order. Moves to the next one only when the
 * request itself fails (DNS, connection, timeout) — an HTTP error response is returned as is.
 * Writes only fail over when the connection was never established.
 */
export async function fetchBlinkApi(path: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<Response> {
  const { timeoutMs = 15000, ...rest } = init;
  const method = rest.method ?? "GET";
  let lastErr: unknown = new Error("No blink-server instance configured");
  for (const base of BLINK_API_BASES) {
    try {
      return await fetch(`${base}${path}`, { ...rest, signal: AbortSignal.timeout(timeoutMs) });
    } catch (e) {
      lastErr = e;
      if (!shouldFailOver(method, e)) break;
    }
  }
  throw lastErr;
}
