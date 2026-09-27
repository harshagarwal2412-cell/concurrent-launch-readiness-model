/**
 * Exports the readiness model to CSV for the Python/SQL analysis in /analysis.
 * Uses the worked-example plan at a fixed as-of date so the analysis is reproducible.
 * Also exports the TypeScript engine's own results (engine_*.csv) so the SQL can be
 * tested against them.
 *
 *   npm run export:data
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ITEMS, MARKETS, WORKSTREAMS } from "../src/domain/data";
import {
  DEFAULT_PLAN, DEMO_PLAN_PATCH, MARKET_IDS, collisions, flagOf, latestStart, parseDate, scoreboard, statusOf,
} from "../src/domain/schedule";
import type { Plan } from "../src/domain/types";

const AS_OF = "2026-09-26";
const OUT = join(import.meta.dirname, "..", "analysis", "data");
mkdirSync(OUT, { recursive: true });

type Row = Record<string, string | number | boolean | undefined | null>;
const cell = (v: Row[string]) => {
  if (v === undefined || v === null) return "";
  if (typeof v === "boolean") return v ? "1" : "0";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
function write(name: string, rows: Row[]) {
  const cols = Object.keys(rows[0]);
  writeFileSync(join(OUT, name), [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n") + "\n");
  console.log(`wrote ${name} (${rows.length} rows)`);
}
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const plan: Plan = { ...DEFAULT_PLAN, ...DEMO_PLAN_PATCH };
const today = parseDate(AS_OF);

write("params.csv", [{ as_of: AS_OF, risk_window_days: 21 }]);
write("workstreams.csv", WORKSTREAMS.map((w, i) => ({ ws_id: w.id, label: w.label, sort_order: i + 1 })));
write("markets.csv", MARKET_IDS.map((mk) => ({ market_id: mk, name: MARKETS[mk].name, go_live: plan.goLive[mk] })));
write("items.csv", ITEMS.map((it) => ({
  item_id: it.id, ws_id: it.ws, name: it.name, owner: it.owner, lead_days: it.lead, duration_days: it.dur, is_central: it.central,
})));
write("item_status.csv", MARKET_IDS.flatMap((mk) => ITEMS.map((it) => ({
  market_id: mk, item_id: it.id, status: statusOf(plan, mk, it.id),
}))));

// Engine results, used only by the tests to cross-check the SQL.
write("engine_schedule.csv", MARKET_IDS.flatMap((mk) => ITEMS.map((it) => ({
  market_id: mk, item_id: it.id, latest_start: iso(latestStart(it, plan.goLive[mk])), flag: flagOf(it, mk, plan, today),
}))));
write("engine_collisions.csv", collisions(plan, today).map((c) => ({ week_start: iso(c.week), mi: c.mi, ca: c.ca, both: c.both })));
const sb = scoreboard(plan, today);
write("engine_scoreboard.csv", [{ late: sb.late, risk: sb.risk, done_pct: sb.donePct, total: sb.total, overlap_weeks: sb.overlapWeeks }]);
