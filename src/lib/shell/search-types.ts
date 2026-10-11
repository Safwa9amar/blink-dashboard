// Client-safe types shared by the ⌘K palette, RecordPeek and the server actions.
export type RecordKind = "order" | "transaction" | "person" | "store";
export interface SearchHit { kind: RecordKind; id: string; title: string; subtitle: string; ref?: string }
export interface SearchGroup { kind: RecordKind; hits: SearchHit[] }
/** `label` is a key under the `search.fields.*` translation namespace. */
export interface RecordDetail { kind: RecordKind; id: string; title: string; fields: { label: string; value: string }[]; listHref: string }
