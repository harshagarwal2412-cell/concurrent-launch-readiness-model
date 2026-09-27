import type { KeyboardEvent } from "react";
import { ITEMS, MARKETS, WORKSTREAMS } from "../domain/data";
import { DAY, MARKET_IDS, chartWindow, flagOf, fmtDate, latestStart, parseDate, statusOf } from "../domain/schedule";
import type { MarketId, Plan } from "../domain/types";

interface Props {
  plan: Plan;
  today: Date;
  onPick: (mk: MarketId, id: string) => void;
}

/** Lane chart: one row per workstream, a mark per item per market at its latest start date. */
export function CriticalPath({ plan, today, onPick }: Props) {
  const { min, max } = chartWindow(plan, today);
  const span = max - min;
  const pos = (t: number) => ((t - min) / span) * 100;

  const months: Date[] = [];
  const m = new Date(min);
  m.setDate(1);
  for (const d = new Date(m); d.getTime() <= max; d.setMonth(d.getMonth() + 1)) months.push(new Date(d));

  return (
    <div className="chart">
      {WORKSTREAMS.map((ws) => (
        <div className="lane" key={ws.id}>
          <div className="lane-name">{ws.label}</div>
          <div className="lane-track">
            {Array.from({ length: 11 }, (_, i) => (
              <div key={i} className="gridline" style={{ left: `${i * 10}%` }} />
            ))}
            {MARKET_IDS.map((mk) => (
              <div key={mk} className="goline" style={{ left: `${pos(parseDate(plan.goLive[mk]).getTime())}%` }} />
            ))}
            <div className="nowline" style={{ left: `${pos(today.getTime())}%` }} />
            {MARKET_IDS.flatMap((mk, mi) =>
              ITEMS.filter((i) => i.ws === ws.id).map((it) => {
                const ls = latestStart(it, plan.goLive[mk]);
                const f = flagOf(it, mk, plan, today);
                const st = statusOf(plan, mk, it.id);
                const go = () => onPick(mk, it.id);
                const onKey = (e: KeyboardEvent) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    go();
                  }
                };
                return (
                  <div
                    key={`${mk}-${it.id}`}
                    className={`tick s-${st} ${f === "late" ? "late" : f === "risk" ? "risk" : ""}`}
                    style={{
                      left: `${pos(ls.getTime())}%`,
                      width: `${Math.max(1.1, ((it.dur * DAY) / span) * 100)}%`,
                      top: `${mi === 0 ? 34 : 66}%`,
                    }}
                    tabIndex={0}
                    role="button"
                    title={`${MARKETS[mk].short} — ${it.name} — start by ${fmtDate(ls)}`}
                    onClick={go}
                    onKeyDown={onKey}
                  />
                );
              }),
            )}
          </div>
        </div>
      ))}
      <div className="axis">
        <div className="axis-sp" />
        <div className="axis-track">
          {months
            .filter((d) => pos(d.getTime()) >= 0 && pos(d.getTime()) <= 99)
            .map((d) => (
              <div key={d.getTime()} className="axis-lbl" style={{ left: `${pos(d.getTime())}%` }}>
                {d.toLocaleDateString("en-US", { month: "short" })} {String(d.getFullYear()).slice(2)}
              </div>
            ))}
          <div
            className="axis-lbl"
            style={{ left: `${pos(today.getTime())}%`, top: 8, color: "var(--ink)", fontWeight: 500 }}
          >
            today
          </div>
        </div>
      </div>
    </div>
  );
}
