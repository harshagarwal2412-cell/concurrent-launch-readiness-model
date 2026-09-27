import { fmtShort, topCollisions } from "../domain/schedule";
import type { Plan } from "../domain/types";

export function Collisions({ plan, today }: { plan: Plan; today: Date }) {
  const rows = topCollisions(plan, today);
  if (!rows.length) {
    return (
      <div className="collide">
        <div className="crow">
          <div className="cweek">Clear</div>
          <div style={{ fontSize: 13, color: "var(--ink-2)" }}>
            No week ahead has central work due for both markets. Either the dates are far enough apart, or everything
            central is already behind you.
          </div>
          <div />
        </div>
      </div>
    );
  }
  const maxT = Math.max(...rows.map((r) => r.total));
  return (
    <div className="collide">
      {rows.map((r) => (
        <div className="crow" key={r.week.getTime()}>
          <div className="cweek">{fmtShort(r.week)}</div>
          <div className="cbar">
            <span className="mi" style={{ width: `${(r.mi / maxT) * 100}%` }} />
            <span className="ca" style={{ width: `${(r.ca / maxT) * 100}%` }} />
          </div>
          <div className="ccount">
            {r.mi}+{r.ca}
          </div>
        </div>
      ))}
    </div>
  );
}
