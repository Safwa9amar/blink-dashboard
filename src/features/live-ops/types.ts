// Domain types for the live-ops feature.
export interface OpsEvent {
  ic: string;
  v: string;
  tt: string[];
  mt: string;
}

export interface Kpi {
  active: number;
  enroute: number;
  online: number;
  agents: number;
}

export interface FeedItem extends OpsEvent {
  key: number;
  t: number;
}
