// Backend instance keys + type — pure constants with no React/Zustand, so they're
// safe to import from BOTH server code (instance-base.ts, the log actions) and
// client code (the store + switcher). The actual URLs are resolved server-side
// from an allowlist (src/app/d/blink-server/instance-base.ts).
export const SERVER_INSTANCES = ["online", "local"] as const;
export type ServerInstance = (typeof SERVER_INSTANCES)[number];
