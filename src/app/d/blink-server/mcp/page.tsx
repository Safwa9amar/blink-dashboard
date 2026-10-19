import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { requirePathAccess } from "@/lib/auth/staff";
import { listMcpAudit, listMcpTokens } from "./action";
import McpClient from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("blink_server", undefined, "tab_mcp");
}

export default async function Page() {
  const role = await requirePathAccess("/blink-server/mcp");
  const [tokens, audit] = await Promise.all([listMcpTokens(), listMcpAudit({ limit: 100 })]);
  return (
    <McpClient
      isSuper={role === "super_admin"}
      tokens={tokens.data ?? []}
      audit={audit.data ?? []}
      migrationPending={!!(tokens.migrationPending || audit.migrationPending)}
      error={tokens.migrationPending ? null : tokens.error}
    />
  );
}
