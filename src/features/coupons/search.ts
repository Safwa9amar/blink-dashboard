// Pure builder for the customer-search filters (PostgREST `.or()` strings).

const MAX_TERMS = 3;

/**
 * One `.or()` expression per whitespace-separated term (max 3). PostgREST ANDs
 * successive `.or()` calls, so "hamza hassani" needs both words to match.
 * Terms with >= 3 digits also match the phone, with and without a leading 0
 * (phones are stored as "0550000001" and "+213674020244").
 */
export function customerSearchFilters(query: string): string[] {
  const terms = query
    .replace(/[%,()*\\]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, MAX_TERMS);
  return terms.map((term) => {
    const parts = [`first_name.ilike.%${term}%`, `last_name.ilike.%${term}%`];
    const digits = term.replace(/\D/g, "");
    if (digits.length >= 3) {
      const phones = new Set([digits, digits.replace(/^0+/, "")]);
      for (const p of phones) if (p.length >= 3) parts.push(`phone_number.ilike.%${p}%`);
    } else {
      parts.push(`phone_number.ilike.%${term}%`);
    }
    return parts.join(",");
  });
}
