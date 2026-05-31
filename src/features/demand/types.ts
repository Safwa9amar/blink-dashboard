// Domain types for the demand feature.
export interface MapZone {
  z: string;
  area: string;
  x: number;
  y: number;
  load: number;
  orders: number;
  riders: number;
  wait: string;
  unmet: number;
}
