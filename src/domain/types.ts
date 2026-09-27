export type MarketId = "mi" | "ca";

export type Status = "notstarted" | "inprogress" | "blocked" | "done";

/** ok = on track or done; risk = must start within the warning window; late = overdue or blocked. */
export type Flag = "ok" | "risk" | "late";

export interface Workstream {
  id: string;
  label: string;
}

export interface Market {
  name: string;
  short: string;
  note: string;
}

export interface Item {
  id: string;
  ws: string;
  name: string;
  owner: string;
  /** Days before go-live the item must start. Negative means after go-live. */
  lead: number;
  /** Working estimate of duration in days. */
  dur: number;
  /** Owned by a shared central function that serves both launches. */
  central: boolean;
  /** Market-specific caveats. */
  notes?: Partial<Record<MarketId, string>>;
}

export interface Plan {
  /** ISO dates (yyyy-mm-dd). */
  goLive: Record<MarketId, string>;
  status: Record<MarketId, Record<string, Status>>;
  learnings: { wrong: string; leadTimes: string };
}
