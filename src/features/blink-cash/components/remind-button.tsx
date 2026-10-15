"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import type { TFn } from "../types";

type State =
  | { kind: "idle" }
  | { kind: "sent" }
  /** `final`: retrying won't help (already reminded today, nothing owed, not allowed). */
  | { kind: "error"; message: string; final: boolean };

type Remind = (id: string) => Promise<{ error?: string; final?: boolean }>;

/** Sends a merchant / agent a "settle your dues" notification via blink-server (the `remind` action picks which). */
export function RemindButton({ t, id, remind: send }: { t: TFn; id: string; remind: Remind }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [isPending, startTransition] = useTransition();

  function remind() {
    startTransition(async () => {
      const res = await send(id);
      if (res.error) {
        setState({ kind: "error", message: res.error, final: !!res.final });
        return;
      }
      setState({ kind: "sent" });
    });
  }

  const done = state.kind === "sent" || (state.kind === "error" && state.final);

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        size="xs"
        variant={done ? "ghost" : "primary"}
        icon={state.kind === "sent" ? "check" : "bell"}
        loading={isPending}
        disabled={done}
        onClick={remind}
      >
        {state.kind === "sent" ? t("dues.reminded") : t("dues.remind")}
      </Button>
      {state.kind === "error" && (
        <span className="text-xs text-danger max-w-[180px]" role="alert">
          {state.message}
        </span>
      )}
    </div>
  );
}
