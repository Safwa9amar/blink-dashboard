// Client-safe types shared by the ⌘K palette, RecordPeek and the server actions.
export type RecordKind = "order" | "transaction" | "person" | "store";
/**
 * `raw` carries the enum values behind `title`/`subtitle` so the client can translate them
 * (`search.enums.*`); `subtitle` stays the raw-value fallback. `detail` is the non-enum rest of the subtitle.
 */
export interface SearchHit {
  kind: RecordKind;
  id: string;
  title: string;
  subtitle: string;
  ref?: string;
  raw?: { type?: string; status?: string; role?: string };
  detail?: string;
}
export interface SearchGroup { kind: RecordKind; hits: SearchHit[] }
/** `label` is a key under the `search.fields.*` namespace. Values of `status`/`type`/`role` fields are raw enums and `created`/`updated`/`joined` are ISO timestamps; the client formats both. */
export interface RecordDetail { kind: RecordKind; id: string; title: string; fields: { label: string; value: string }[]; listHref: string }
