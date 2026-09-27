import { useMemo, useState } from "react";
import { Collisions } from "./components/Collisions";
import { CriticalPath } from "./components/CriticalPath";
import { Ledger } from "./components/Ledger";
import { DEFAULT_PLAN, DEMO_PLAN_PATCH, exportPlan, scoreboard, startOfDay } from "./domain/schedule";
import type { MarketId, Status } from "./domain/types";
import { usePlan } from "./hooks/usePlan";

function download(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function App() {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [plan, setPlan] = usePlan();
  const [market, setMarket] = useState<MarketId>("mi");
  const [focusId, setFocusId] = useState<string | null>(null);

  const board = useMemo(() => scoreboard(plan, today), [plan, today]);

  const setGoLive = (mk: MarketId, v: string) => v && setPlan((p) => ({ ...p, goLive: { ...p.goLive, [mk]: v } }));
  const setStatus = (id: string, s: Status) =>
    setPlan((p) => ({ ...p, status: { ...p.status, [market]: { ...p.status[market], [id]: s } } }));

  const cells: [string, string | number, string][] = [
    ["bad", board.late, "Overdue or blocked"],
    ["warn", board.risk, "Must start inside 21 days"],
    ["good", `${board.donePct}%`, "Complete across both markets"],
    ["", board.total, "Dependencies tracked"],
  ];

  return (
    <>
      <header className="top">
        <div className="top-in">
          <h1>Two markets, one central team, one calendar</h1>
          <p className="sub">
            A lead-time model for launching supportive oncology markets concurrently. It answers one question a status
            deck can't: given the go-live dates, what should already have started, and which weeks ask the same central
            function for two things at once.
          </p>
          <p className="disclosure">
            No company data is in here. Every item is a generic readiness dependency for in-home and virtual oncology
            care in a new state. Set the two go-live dates and the model does the rest — or load the worked example to
            see how it flags a slip.
          </p>
        </div>
      </header>

      <div className="wrap">
        <div className="controls">
          <div className="ctl">
            <label htmlFor="miDate">Michigan go-live</label>
            <input type="date" id="miDate" value={plan.goLive.mi} onChange={(e) => setGoLive("mi", e.target.value)} />
          </div>
          <div className="ctl">
            <label htmlFor="caDate">California go-live</label>
            <input type="date" id="caDate" value={plan.goLive.ca} onChange={(e) => setGoLive("ca", e.target.value)} />
          </div>
          <div className="ctl">
            <label htmlFor="mkt">Ledger shows</label>
            <select id="mkt" value={market} onChange={(e) => setMarket(e.target.value as MarketId)}>
              <option value="mi">Michigan</option>
              <option value="ca">California</option>
            </select>
          </div>
          <div className="spacer" />
          <button onClick={() => setPlan((p) => ({ ...p, ...structuredClone(DEMO_PLAN_PATCH) }))}>
            Load worked example
          </button>
          <button
            onClick={() =>
              setPlan((p) => ({ ...p, status: { mi: {}, ca: {} }, learnings: { ...DEFAULT_PLAN.learnings } }))
            }
          >
            Clear statuses
          </button>
          <button
            className="primary"
            onClick={() =>
              download(`launch-readiness-${new Date().toISOString().slice(0, 10)}.json`, exportPlan(plan, today))
            }
          >
            Export JSON
          </button>
        </div>

        <div className="board">
          {cells.map(([c, n, k]) => (
            <div key={k} className={`cell ${c}`.trim()}>
              <span className="n">{n}</span>
              <span className="k">{k}</span>
            </div>
          ))}
        </div>
        <p className="board-note">
          Go-live dates are {board.goLiveGapDays} days apart, so the two launches share {board.overlapWeeks} weeks in
          which central work is due for both.
        </p>

        <section>
          <h2>Critical path against today</h2>
          <p className="lede">
            Each mark sits on the last date that item can start and still finish before its market's go-live. Marks to
            the left of the heavy line are already overdue. Tap one to open it in the ledger below.
          </p>
          <div className="chart-shell">
            <div className="chart-scroll">
              <CriticalPath
                plan={plan}
                today={today}
                onPick={(mk, id) => {
                  setMarket(mk);
                  setFocusId(id);
                }}
              />
            </div>
            <div className="chart-legend">
              <span><i className="swatch" style={{ background: "#fff", borderColor: "#7C8B99" }} />Not started</span>
              <span><i className="swatch" style={{ background: "#2B5F7E" }} />In progress</span>
              <span><i className="swatch" style={{ background: "#3E7A5E" }} />Done</span>
              <span><i className="swatch late" style={{ background: "#A8342A" }} />Overdue or blocked</span>
              <span><i className="swatch" style={{ width: 2, background: "#16212E" }} />Today</span>
              <span><i className="swatch" style={{ width: 2, background: "#2B5F7E" }} />Go-live</span>
            </div>
          </div>
        </section>

        <section>
          <h2>Where the two launches collide</h2>
          <p className="lede">
            Market hiring scales with the market. Clinical Operations, Product, Learning &amp; Development and
            credentialing don't — the same people serve both launches. These are the weeks both markets need central
            work started.
          </p>
          <Collisions plan={plan} today={today} />
          <p className="key">
            <span><i className="dot" style={{ background: "#2B5F7E" }} />Michigan</span>&nbsp;&nbsp;
            <span><i className="dot" style={{ background: "#B4791F" }} />California</span>
            &nbsp;— counting only items owned by a central function, placed in the week they must start.
          </p>
        </section>

        <section>
          <h2>Readiness ledger</h2>
          <p className="lede">
            Ordered by workstream, then by how soon it has to start. Latest start is derived from the go-live date and
            the item's lead time, so moving a launch date moves every deadline with it.
          </p>
          <Ledger plan={plan} today={today} market={market} focusId={focusId} onStatus={setStatus} />
        </section>

        <section>
          <h2>What the next launch inherits</h2>
          <p className="lede">
            The reason to run the first two launches against a model is the third one. These notes export with the file
            and become the starting template.
          </p>
          <div className="pair">
            <div>
              <label htmlFor="l1" className="ctl">
                <span style={{ fontSize: 12.5, color: "var(--ink-3)", fontWeight: 500 }}>
                  Assumptions that turned out wrong
                </span>
              </label>
              <textarea
                id="l1"
                value={plan.learnings.wrong}
                onChange={(e) => setPlan((p) => ({ ...p, learnings: { ...p.learnings, wrong: e.target.value } }))}
                placeholder="e.g. assumed credentialing rosters could be submitted before the market medical director signed; they couldn't, which cost three weeks."
              />
            </div>
            <div>
              <label htmlFor="l2" className="ctl">
                <span style={{ fontSize: 12.5, color: "var(--ink-3)", fontWeight: 500 }}>
                  Lead times to change for the next market
                </span>
              </label>
              <textarea
                id="l2"
                value={plan.learnings.leadTimes}
                onChange={(e) => setPlan((p) => ({ ...p, learnings: { ...p.learnings, leadTimes: e.target.value } }))}
                placeholder="e.g. payer eligibility file testing needs 45 days, not 21 — two rounds of format correction is normal, not exceptional."
              />
            </div>
          </div>
        </section>

        <footer>
          <p>
            Harsh Agarwal · A planning tool, not a product. The lead times are estimates from multi-market operational
            rollouts — the point of the model is that the estimates are visible and arguable, which a status deck's
            dates are not. Export produces a JSON file you can keep or hand to whoever owns launch readiness.
          </p>
        </footer>
      </div>
    </>
  );
}
