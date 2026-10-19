import { createHash, randomBytes } from "node:crypto";
import { PREFIX_DISPLAY_LEN, TOKEN_PREFIX } from "./shared";

// SERVER-ONLY. Must match blink-server's MCP auth exactly:
//   token = "blk_mcp_" + base64url(32 random bytes)  (no padding)
//   hash  = sha256 hex of the full token string
export function generateToken(): string {
  return TOKEN_PREFIX + randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function tokenPrefix(token: string): string {
  return token.slice(0, PREFIX_DISPLAY_LEN);
}
