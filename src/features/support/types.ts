// Domain types for the support feature.
export interface Ticket {
  id: string;
  subj: string;
  who: string;
  role: string;
  cat: string;
  prio: string;
  status: string;
  age: string;
}

export interface Article {
  title: string;
  cat: string;
  roles: string[];
  status: string;
  views: number;
  updated: string;
}

// A single message in a ticket thread or live chat — agent reply, customer
// message, or a private internal note.
export interface Message {
  from: "customer" | "agent" | "note";
  who: string;
  text: string;
  time: string;
}

// A live-chat / omnichannel inbox conversation.
export interface Chat {
  id: string;
  who: string;
  role: string;
  channel: string;
  preview: string;
  unread: number;
  wait: string;
  status: "active" | "waiting" | "idle";
}

// A support agent in the roster.
export interface Agent {
  name: string;
  team: string;
  status: "online" | "away" | "offline";
  load: number;
  cap: number;
  csat: number;
  frt: string;
  resolved: number;
}

// A single CSAT survey response.
export interface CsatResponse {
  who: string;
  score: number;
  comment: string;
  agent: string;
  cat: string;
  time: string;
}

// An SLA policy mapping a priority to first-response / resolution targets.
export interface SlaPolicy {
  name: string;
  prio: string;
  frt: string;
  resolution: string;
  met: number;
  breached: number;
}

// An automation / routing rule: when → conditions → actions.
export interface Rule {
  name: string;
  when: string;
  conditions: string[];
  actions: string[];
  runs: number;
  on: boolean;
}

export type TFn = (k: string, v?: Record<string, string | number>) => string;
