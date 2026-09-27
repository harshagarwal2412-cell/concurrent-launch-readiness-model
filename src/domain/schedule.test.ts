import { describe, expect, it } from "vitest";
import { ITEMS, WORKSTREAMS } from "./data";
import {
  DEFAULT_PLAN,
  DEMO_PLAN_PATCH,
  collisions,
  exportPlan,
  flagOf,
  latestStart,
  parseDate,
  scoreboard,
  topCollisions,
  weekStart,
} from "./schedule";
import type { Item, Plan } from "./types";

const item = (o: Partial<Item> = {}): Item => ({
  id: "x", ws: "payer", name: "x", owner: "Clinical Ops", lead: 30, dur: 10, central: true, ...o,
});
const plan = (o: Partial<Plan> = {}): Plan => ({ ...structuredClone(DEFAULT_PLAN), ...o });

describe("data", () => {
  it("has 52 items with unique ids, all in a known workstream", () => {
    expect(ITEMS).toHaveLength(52);
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(52);
    const ws = new Set(WORKSTREAMS.map((w) => w.id));
    for (const i of ITEMS) expect(ws.has(i.ws), i.id).toBe(true);
  });
});

describe("latestStart", () => {
  it("subtracts the lead time from go-live", () => {
    expect(latestStart(item({ lead: 30 }), "2027-01-31").toDateString()).toBe(new Date(2027, 0, 1).toDateString());
  });

  it("supports post-go-live items (negative lead)", () => {
    expect(latestStart(item({ lead: -21 }), "2027-01-11").toDateString()).toBe(new Date(2027, 1, 1).toDateString());
  });

  it("moves every deadline when a go-live date moves", () => {
    const a = latestStart(ITEMS[0], "2027-01-11").getTime();
    const b = latestStart(ITEMS[0], "2027-01-18").getTime();
    expect(Math.round((b - a) / 86_400_000)).toBe(7);
  });
});

describe("flagOf", () => {
  const goLive = { mi: "2027-03-01", ca: "2027-03-01" };
  const it30 = item({ lead: 30 }); // latest start 2027-01-30

  it("is late when not started past the latest start", () => {
    expect(flagOf(it30, "mi", plan({ goLive }), parseDate("2027-02-05"))).toBe("late");
  });

  it("is at risk inside the 21-day window, and ok at 22 days", () => {
    expect(flagOf(it30, "mi", plan({ goLive }), parseDate("2027-01-09"))).toBe("risk");
    expect(flagOf(it30, "mi", plan({ goLive }), parseDate("2027-01-08"))).toBe("ok");
  });

  it("is at risk (not late) on the latest-start day itself", () => {
    expect(flagOf(it30, "mi", plan({ goLive }), parseDate("2027-01-30"))).toBe("risk");
  });

  it("done always clears the flag; blocked is always late", () => {
    const today = parseDate("2027-06-01");
    expect(flagOf(it30, "mi", plan({ goLive, status: { mi: { x: "done" }, ca: {} } }), today)).toBe("ok");
    expect(flagOf(it30, "mi", plan({ goLive, status: { mi: { x: "blocked" }, ca: {} } }), parseDate("2026-01-01"))).toBe("late");
  });

  it("in-progress items are never late on dates alone", () => {
    expect(flagOf(it30, "mi", plan({ goLive, status: { mi: { x: "inprogress" }, ca: {} } }), parseDate("2027-06-01"))).toBe("ok");
  });
});

describe("collisions", () => {
  it("weeks start on Monday", () => {
    expect(weekStart(parseDate("2026-10-04")).getDay()).toBe(1); // a Sunday → previous Monday
    expect(weekStart(parseDate("2026-10-05")).toDateString()).toBe(parseDate("2026-10-05").toDateString());
  });

  it("identical go-live dates make every central week a collision", () => {
    const p = plan({ goLive: { mi: "2027-06-01", ca: "2027-06-01" } });
    const rows = collisions(p, parseDate("2026-01-01"));
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.both && r.mi === r.ca)).toBe(true);
  });

  it("ignores non-central items and weeks already past", () => {
    const p = plan({ goLive: { mi: "2027-06-01", ca: "2027-06-01" } });
    const all = collisions(p, parseDate("2026-01-01")).reduce((s, r) => s + r.total, 0);
    expect(all).toBe(2 * ITEMS.filter((i) => i.central).length);
    expect(collisions(p, parseDate("2030-01-01"))).toHaveLength(0);
  });

  it("topCollisions returns the heaviest weeks first, capped", () => {
    const rows = topCollisions(DEFAULT_PLAN, parseDate("2026-06-01"), 5);
    expect(rows.length).toBeLessThanOrEqual(5);
    for (let i = 1; i < rows.length; i++) expect(rows[i - 1].total).toBeGreaterThanOrEqual(rows[i].total);
  });
});

describe("scoreboard", () => {
  it("counts every item in both markets", () => {
    const s = scoreboard(DEFAULT_PLAN, parseDate("2026-06-01"));
    expect(s.total).toBe(104);
    expect(s.goLiveGapDays).toBe(42);
  });

  it("the worked example flags the blocked credentialing item", () => {
    const p = { ...DEFAULT_PLAN, ...DEMO_PLAN_PATCH };
    const l5 = ITEMS.find((i) => i.id === "l5")!;
    expect(flagOf(l5, "mi", p, parseDate("2026-01-01"))).toBe("late");
    expect(scoreboard(p, parseDate("2026-09-26")).donePct).toBeGreaterThan(0);
  });
});

describe("export", () => {
  it("serializes both markets with dates and flags", () => {
    const out = exportPlan(DEFAULT_PLAN, parseDate("2026-09-26"), new Date("2026-09-26T12:00:00Z"));
    expect(Object.keys(out.markets)).toEqual(["Michigan", "California"]);
    expect(out.markets.Michigan).toHaveLength(52);
    expect(out.markets.Michigan[0].latestStart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
