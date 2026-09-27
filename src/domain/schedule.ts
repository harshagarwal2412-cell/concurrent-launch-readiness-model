import { ITEMS, MARKETS, WORKSTREAMS } from "./data";
import type { Flag, Item, MarketId, Plan, Status } from "./types";

export const DAY = 86_400_000;
export const MARKET_IDS: MarketId[] = ["mi", "ca"];
/** Items not yet started whose latest start is within this many days are "at risk". */
export const RISK_WINDOW_DAYS = 21;

export const STATUSES: [Status, string][] = [
  ["notstarted", "Not started"],
  ["inprogress", "In progress"],
  ["blocked", "Blocked"],
  ["done", "Done"],
];

export const DEFAULT_PLAN: Plan = {
  goLive: { mi: "2027-01-11", ca: "2027-02-22" },
  status: { mi: {}, ca: {} },
  learnings: { wrong: "", leadTimes: "" },
};

// ---------- dates (local-time, day precision) ----------

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export const fmtDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
export const fmtShort = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** Monday of the week containing d. */
export function weekStart(d: Date): Date {
  const x = startOfDay(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

export const daysBetween = (from: Date, to: Date) => Math.round((to.getTime() - from.getTime()) / DAY);

// ---------- model ----------

/** The last date an item can start and still finish before its market's go-live. */
export function latestStart(item: Item, goLiveIso: string): Date {
  return startOfDay(new Date(parseDate(goLiveIso).getTime() - item.lead * DAY));
}

export const statusOf = (plan: Plan, mk: MarketId, id: string): Status => plan.status[mk][id] ?? "notstarted";

export function flagOf(item: Item, mk: MarketId, plan: Plan, today: Date): Flag {
  const st = statusOf(plan, mk, item.id);
  if (st === "done") return "ok";
  if (st === "blocked") return "late";
  const days = daysBetween(today, latestStart(item, plan.goLive[mk]));
  if (st === "notstarted" && days < 0) return "late";
  if (st === "notstarted" && days <= RISK_WINDOW_DAYS) return "risk";
  return "ok";
}

export interface Scoreboard {
  late: number;
  risk: number;
  donePct: number;
  total: number;
  goLiveGapDays: number;
  overlapWeeks: number;
}

export function scoreboard(plan: Plan, today: Date, items: Item[] = ITEMS): Scoreboard {
  let late = 0;
  let risk = 0;
  let done = 0;
  let total = 0;
  for (const mk of MARKET_IDS) {
    for (const it of items) {
      total++;
      const f = flagOf(it, mk, plan, today);
      if (f === "late") late++;
      else if (f === "risk") risk++;
      if (statusOf(plan, mk, it.id) === "done") done++;
    }
  }
  return {
    late,
    risk,
    donePct: total ? Math.round((done / total) * 100) : 0,
    total,
    goLiveGapDays: Math.abs(daysBetween(parseDate(plan.goLive.mi), parseDate(plan.goLive.ca))),
    overlapWeeks: collisions(plan, today, items).filter((r) => r.both).length,
  };
}

export interface CollisionWeek {
  week: Date;
  mi: number;
  ca: number;
  both: boolean;
  total: number;
}

/**
 * For each upcoming week, count the central-function items that must start in
 * that week, per market. Weeks where both markets need central work are the
 * resource collisions a status deck hides.
 */
export function collisions(plan: Plan, today: Date, items: Item[] = ITEMS): CollisionWeek[] {
  const map = new Map<number, Record<MarketId, number>>();
  for (const mk of MARKET_IDS) {
    for (const it of items.filter((i) => i.central)) {
      const wk = weekStart(latestStart(it, plan.goLive[mk]));
      if (wk < today) continue;
      const k = wk.getTime();
      if (!map.has(k)) map.set(k, { mi: 0, ca: 0 });
      map.get(k)![mk]++;
    }
  }
  return [...map.entries()]
    .map(([k, v]) => ({ week: new Date(k), ...v, both: v.mi > 0 && v.ca > 0, total: v.mi + v.ca }))
    .sort((a, b) => a.week.getTime() - b.week.getTime());
}

/** The heaviest collision weeks, most items first. */
export function topCollisions(plan: Plan, today: Date, limit = 8): CollisionWeek[] {
  return collisions(plan, today)
    .filter((r) => r.both)
    .sort((a, b) => b.total - a.total || a.week.getTime() - b.week.getTime())
    .slice(0, limit);
}

/** Time window for the critical-path chart: earliest latest-start to 30 days past the last go-live. */
export function chartWindow(plan: Plan, today: Date, items: Item[] = ITEMS): { min: number; max: number } {
  let min = today.getTime();
  let max = today.getTime();
  for (const mk of MARKET_IDS) {
    max = Math.max(max, parseDate(plan.goLive[mk]).getTime() + 30 * DAY);
    for (const it of items) min = Math.min(min, latestStart(it, plan.goLive[mk]).getTime());
  }
  return { min: Math.min(min, today.getTime() - 20 * DAY), max };
}

/** Items in a workstream, soonest latest-start first. */
export function ledgerRows(wsId: string, mk: MarketId, plan: Plan): Item[] {
  return ITEMS.filter((i) => i.ws === wsId).sort(
    (a, b) => latestStart(a, plan.goLive[mk]).getTime() - latestStart(b, plan.goLive[mk]).getTime(),
  );
}

/** Serializable snapshot handed to whoever owns launch readiness. */
export function exportPlan(plan: Plan, today: Date, now = new Date()) {
  return {
    generated: now.toISOString(),
    goLive: plan.goLive,
    markets: Object.fromEntries(
      MARKET_IDS.map((mk) => [
        MARKETS[mk].name,
        ITEMS.map((it) => ({
          workstream: WORKSTREAMS.find((w) => w.id === it.ws)!.label,
          item: it.name,
          owner: it.owner,
          central: it.central,
          latestStart: latestStart(it, plan.goLive[mk]).toISOString().slice(0, 10),
          status: statusOf(plan, mk, it.id),
          flag: flagOf(it, mk, plan, today),
        })),
      ]),
    ),
    learnings: plan.learnings,
  };
}

/** Worked example: Michigan mid-flight with a blocked credentialing submission, California barely started. */
export const DEMO_PLAN_PATCH: Pick<Plan, "status" | "learnings"> = {
  status: {
    mi: {
      p1: "done", p2: "done", p3: "inprogress", p4: "notstarted", l1: "done", l2: "inprogress",
      l3: "done", l4: "inprogress", l5: "blocked", l6: "notstarted", s1: "done", s2: "inprogress",
      s3: "inprogress", t1: "inprogress", t2: "notstarted", o1: "inprogress", o2: "notstarted",
      v5: "inprogress", f1: "inprogress",
    },
    ca: {
      p1: "inprogress", p2: "notstarted", l1: "inprogress", l2: "notstarted", l3: "notstarted",
      l4: "notstarted", l5: "notstarted", s1: "inprogress", s2: "notstarted", v5: "notstarted",
    },
  },
  learnings: {
    wrong:
      "Assumed the payer roster could be submitted ahead of the market medical director signing. It could not, and credentialing sat blocked for three weeks while everything downstream kept its original date.",
    leadTimes:
      "Eligibility file testing needs 45 days, not 21. Two rounds of format correction is the normal case, not the exception.",
  },
};
