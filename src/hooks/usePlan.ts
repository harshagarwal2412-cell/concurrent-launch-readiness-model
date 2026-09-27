import { useEffect, useState } from "react";
import { DEFAULT_PLAN } from "../domain/schedule";
import type { Plan } from "../domain/types";

const KEY = "launchModel.v2";

function load(): Plan {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Plan>;
      return { ...DEFAULT_PLAN, ...p, status: { ...DEFAULT_PLAN.status, ...p.status } };
    }
  } catch {
    /* storage unavailable (private mode, blocked site data) — fall back to defaults */
  }
  return DEFAULT_PLAN;
}

/** Plan state persisted to localStorage, so a planner's statuses survive a reload. */
export function usePlan() {
  const [plan, setPlan] = useState<Plan>(load);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(plan));
    } catch {
      /* ignore */
    }
  }, [plan]);
  return [plan, setPlan] as const;
}
