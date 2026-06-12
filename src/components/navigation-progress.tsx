"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * A thin progress bar at the top of the viewport that animates during
 * App-Router navigations.  It listens for internal link clicks (start)
 * and pathname/searchParams changes (finish).
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const prevPath = useRef(pathname + searchParams.toString());

  const start = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setState("loading");
  }, []);

  const done = useCallback(() => {
    setState("done");
    timeoutRef.current = setTimeout(() => setState("idle"), 300);
  }, []);

  // Complete when the route actually changes
  useEffect(() => {
    const current = pathname + searchParams.toString();
    if (current !== prevPath.current) {
      prevPath.current = current;
      done();
    }
  }, [pathname, searchParams, done]);

  // Intercept internal link clicks to start the bar
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("http") ||
        href.startsWith("#") ||
        anchor.target === "_blank" ||
        e.metaKey ||
        e.ctrlKey
      )
        return;

      // Only trigger for links that navigate away from the current path
      const url = new URL(href, window.location.origin);
      if (url.pathname + url.search !== window.location.pathname + window.location.search) {
        start();
      }
    }

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, [start]);

  if (state === "idle") return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 h-[3px] pointer-events-none">
      <div
        className={`h-full bg-primary origin-left ${
          state === "loading"
            ? "animate-progress-loading"
            : "animate-progress-done"
        }`}
      />
    </div>
  );
}
