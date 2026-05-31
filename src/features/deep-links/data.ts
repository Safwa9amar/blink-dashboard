import rawCatalog from "./deeplinks.json";
import { normalize } from "./processing";
import type { DeepLinkCatalog, RawDeepLinkFile } from "./types";

const raw = rawCatalog as unknown as RawDeepLinkFile;

export const SEED_SCHEME = raw.scheme ?? "blink";
export const SEED_ROUTES = normalize(raw);
export const SEED_CATALOG: DeepLinkCatalog = { scheme: SEED_SCHEME, routes: SEED_ROUTES };
