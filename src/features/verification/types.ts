// Domain types for the verification feature.
export interface KycRow {
  who: string;
  role: string;
  doc: string;
  sub: string;
  status: string;
  reason?: string;
}
