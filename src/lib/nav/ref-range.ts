// The apps show references as `id.slice(0, 8).toUpperCase()`. Turn that (or a full
// uuid) into a filter usable on a uuid primary key without casts or migrations.
export type RefMatch = { exact: string } | { gte: string; lte: string };

const FULL = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const SHORT = /^[0-9a-f]{8}$/;

export function refToRange(input: string): RefMatch | null {
  const q = input.trim().replace(/^#/, "").toLowerCase();
  if (FULL.test(q)) return { exact: q };
  if (SHORT.test(q)) return { gte: `${q}-0000-0000-0000-000000000000`, lte: `${q}-ffff-ffff-ffff-ffffffffffff` };
  return null;
}
