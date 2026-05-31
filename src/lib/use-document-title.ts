"use client";

import { useEffect } from "react";

/**
 * Client-side dynamic <title> — lets pages reflect live/stat data in the tab title,
 * e.g. a real-time counter or a headline KPI. Composes as "(badge) title · Blink".
 * Runs after the server-rendered metadata, so it enhances rather than replaces it.
 */
export function useDocumentTitle(title: string, badge?: string | number) {
  useEffect(() => {
    const hasBadge = badge !== undefined && badge !== null && `${badge}` !== "";
    document.title = `${hasBadge ? `(${badge}) ` : ""}${title} · Blink`;
  }, [title, badge]);
}
