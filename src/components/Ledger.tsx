import { useEffect, useRef } from "react";
import { WORKSTREAMS } from "../domain/data";
import { STATUSES, daysBetween, flagOf, fmtDate, latestStart, ledgerRows, statusOf } from "../domain/schedule";
import type { Item, MarketId, Plan, Status } from "../domain/types";

interface Props {
  plan: Plan;
  today: Date;
  market: MarketId;
  focusId: string | null;
  onStatus: (id: string, s: Status) => void;
}

export function Ledger({ plan, today, market, focusId, onStatus }: Props) {
  const focusRef = useRef<HTMLSelectElement | null>(null);

  useEffect(() => {
    if (focusId && focusRef.current) {
      focusRef.current.closest(".item")?.scrollIntoView({ block: "center", behavior: "smooth" });
      focusRef.current.focus();
    }
  }, [focusId, market]);

  return (
    <div>
      {WORKSTREAMS.map((ws) => {
        const items = ledgerRows(ws.id, market, plan);
        const doneN = items.filter((i) => statusOf(plan, market, i.id) === "done").length;
        return (
          <div className="ws-group" key={ws.id}>
            <div className="ws-head">
              <h3>{ws.label}</h3>
              <span className="pct">
                {doneN} of {items.length} done
              </span>
            </div>
            {items.map((it) => (
              <Row
                key={it.id}
                it={it}
                plan={plan}
                today={today}
                market={market}
                selectRef={it.id === focusId ? focusRef : undefined}
                onStatus={onStatus}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

interface RowProps {
  it: Item;
  plan: Plan;
  today: Date;
  market: MarketId;
  selectRef?: React.RefObject<HTMLSelectElement>;
  onStatus: (id: string, s: Status) => void;
}

function Row({ it, plan, today, market, selectRef, onStatus }: RowProps) {
  const ls = latestStart(it, plan.goLive[market]);
  const f = flagOf(it, market, plan, today);
  const days = daysBetween(today, ls);
  const st = statusOf(plan, market, it.id);
  const note = it.notes?.[market];

  let when: React.ReactNode;
  if (st === "done") when = "done";
  else if (st === "blocked") when = "blocked";
  else if (days < 0) when = <span className="flag">{Math.abs(days)} days late</span>;
  else if (days <= 21) when = <span className="flagw">starts in {days} days</span>;
  else when = `${days} days out`;

  return (
    <div className={`item ${f === "late" ? "is-late" : f === "risk" ? "is-risk" : ""}`.trim()}>
      <div className="item-name-wrap">
        <div className="item-name">{it.name}</div>
        <div className="item-meta">
          {it.owner}
          {note ? ` — ${note}` : ""}
        </div>
      </div>
      <div className="start">
        {fmtDate(ls)}
        <br />
        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{when}</span>
      </div>
      <div className="sel-wrap">
        <select ref={selectRef} value={st} onChange={(e) => onStatus(it.id, e.target.value as Status)}>
          {STATUSES.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
