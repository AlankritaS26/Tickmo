import { addDays, dayKey } from './dates';
import { DayPlan } from './plan';
import { SessionRecord } from './timer';

export interface DayStats {
  pomodoros: number;
  focusMinutes: number;
  interrupted: number;
  breaks: number;
  planned: number;
  done: number;
  partly: number;
}

export function sessionsOn(all: SessionRecord[], day: string) {
  return all.filter((r) => dayKey(r.endedAt) === day);
}

export function statsForDay(all: SessionRecord[], day: string, plan?: DayPlan): DayStats {
  const list = sessionsOn(all, day);
  const focus = list.filter((r) => r.phase === 'focus' && !r.interrupted);
  return {
    pomodoros: focus.length,
    focusMinutes: focus.reduce((sum, r) => sum + r.plannedMin, 0),
    interrupted: list.filter((r) => r.interrupted).length,
    breaks: list.filter((r) => r.phase !== 'focus').length,
    planned: plan?.items.length ?? 0,
    done: plan?.items.filter((i) => i.status === 'done').length ?? 0,
    partly: plan?.items.filter((i) => i.status === 'partly').length ?? 0,
  };
}

export function lastNDays(all: SessionRecord[], today: string, n = 7) {
  return Array.from({ length: n }, (_, i) => {
    const day = addDays(today, i - (n - 1));
    const focus = sessionsOn(all, day).filter((r) => r.phase === 'focus' && !r.interrupted);
    return { day, pomodoros: focus.length, minutes: focus.reduce((s, r) => s + r.plannedMin, 0) };
  });
}

export const hours = (min: number) => `${(min / 60).toFixed(1)}h`;
