// Daily target + a plan for each session.

export type ItemStatus = 'pending' | 'partly' | 'done';

export interface PlanItem {
  id: string;
  title: string;
  estimate: number; // how many sessions you think it needs
  used: number; // how many focus sessions you actually spent
  status: ItemStatus;
  carried?: boolean; // moved over from an earlier day
  tag?: string; // subject, e.g. DSA, OS, DBMS
  movedOn?: string; // set on the old day when it was carried over
}

export interface DayPlan {
  target: string; // e.g. "Finish OS Module 3 + 10 DSA problems"
  items: PlanItem[];
}

export type Plans = Record<string, DayPlan>; // key = dayKey

export const emptyPlan = (): DayPlan => ({ target: '', items: [] });

export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// The goal for the next session = the first item that is not done.
export function currentItem(plan: DayPlan | undefined): PlanItem | undefined {
  return plan?.items.find((i) => i.status !== 'done');
}

// Unfinished items from the most recent earlier day that has a plan.
export function unfinishedBefore(plans: Plans, today: string): { day: string; items: PlanItem[] } | null {
  const days = Object.keys(plans)
    .filter((d) => d < today)
    .sort()
    .reverse();
  for (const d of days) {
    const items = plans[d].items.filter((i) => i.status !== 'done' && !i.movedOn);
    if (plans[d].items.length) return items.length ? { day: d, items } : null;
  }
  return null;
}

export const DEFAULT_TAGS = ['DSA', 'OS', 'DBMS', 'CN', 'Dev', 'Revision', 'Other'];

// Rough finish time if you keep going: remaining sessions x (focus + short break).
export function finishEstimate(
  items: PlanItem[],
  focusMin: number,
  shortMin: number,
  now = Date.now(),
): { sessions: number; at: number } {
  const sessions = items.filter((i) => i.status !== 'done').reduce((s, i) => s + Math.max(1, i.estimate - i.used), 0);
  const at = now + sessions * (focusMin + shortMin) * 60000 - (sessions ? shortMin * 60000 : 0);
  return { sessions, at };
}
