"use server";

import { hasStaffRole } from "@/lib/auth/staff";
import { blinkApi } from "@/lib/blink-api";
import { blinkApiErrorMessage } from "@/lib/blink-api-errors";
import { DUES_ROLES } from "./data";

const NS = "blink_cash.dues";

// Nudges a merchant to settle a store's outstanding dues. blink-server sends the
// notification (POST /merchant/admin/dues/{store_id}/remind). A reminder changes no
// dues, so nothing is revalidated (re-rendering would also re-run the whole dues
// report). `final` = retrying won't help (409 nothing outstanding, 429 already
// reminded in the last 24h, 403, 404): the button stays off and shows why.
export async function remindMerchantDues(storeId: string): Promise<{ error?: string; final?: boolean }> {
  return remind(NS, `/merchant/admin/dues/${encodeURIComponent(storeId)}/remind`);
}

// Same for an agent's cash dues (POST /agents/admin/dues/{agent_id}/remind).
export async function remindAgentDues(agentId: string): Promise<{ error?: string; final?: boolean }> {
  return remind("blink_cash.agents", `/agents/admin/dues/${encodeURIComponent(agentId)}/remind`);
}

async function remind(ns: string, path: string): Promise<{ error?: string; final?: boolean }> {
  if (!(await hasStaffRole(...DUES_ROLES))) {
    return { error: await blinkApiErrorMessage(ns, { status: 403, error: "" }), final: true };
  }

  const res = await blinkApi(path, { method: "POST", roles: DUES_ROLES });
  if (res.ok) return {};
  return {
    error: await blinkApiErrorMessage(ns, res),
    final: res.status === 409 || res.status === 429 || res.status === 403 || res.status === 404,
  };
}
