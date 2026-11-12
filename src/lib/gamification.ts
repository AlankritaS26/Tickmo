// Duolingo-style fun, but rewards come from real work (goals ticked off), not minutes alone.
import { diffDays } from './dates';
import { SessionRecord } from './timer';

export const XP = {
  focus: 10,
  done: 15,
  partly: 5,
  dailyTarget: 30,
  dailyCap: 200,
};

export const MAX_FREEZES = 2;

export interface Progress {
  xp: number;
  xpByDay: Record<string, number>;
  streak: number;
  bestStreak: number;
  lastDay: string | null; // last day with at least 1 finished Pomodoro
  freezes: number;
  badges: string[];
  targetHitDays: string[];
}

export const emptyProgress = (): Progress => ({
  xp: 0,
  xpByDay: {},
  streak: 0,
  bestStreak: 0,
  lastDay: null,
  freezes: 0,
  badges: [],
  targetHitDays: [],
});

// Adds XP but never more than the daily cap. Returns how much was actually added.
export function addXp(p: Progress, day: string, amount: number): { p: Progress; gained: number } {
  const already = p.xpByDay[day] ?? 0;
  const gained = Math.max(0, Math.min(amount, XP.dailyCap - already));
  if (!gained) return { p, gained: 0 };
  return { p: { ...p, xp: p.xp + gained, xpByDay: { ...p.xpByDay, [day]: already + gained } }, gained };
}

// Call when a focus session finishes on `day`.
export function recordFocusDay(p: Progress, day: string): { p: Progress; usedFreeze: boolean; earnedFreeze: boolean } {
  if (p.lastDay === day) return { p, usedFreeze: false, earnedFreeze: false };
  let streak = 1;
  let freezes = p.freezes;
  let usedFreeze = false;
  if (p.lastDay) {
    const gap = diffDays(p.lastDay, day);
    if (gap === 1) streak = p.streak + 1;
    else if (gap === 2 && freezes > 0) {
      // one missed day, saved by a streak freeze
      freezes -= 1;
      usedFreeze = true;
      streak = p.streak + 1;
    }
  }
  let earnedFreeze = false;
  if (streak % 7 === 0 && freezes < MAX_FREEZES) {
    freezes += 1;
    earnedFreeze = true;
  }
  return {
    p: { ...p, streak, bestStreak: Math.max(p.bestStreak, streak), lastDay: day, freezes },
    usedFreeze,
    earnedFreeze,
  };
}

// The streak to show today (0 if it has already been broken).
export function visibleStreak(p: Progress, today: string): number {
  if (!p.lastDay) return 0;
  const gap = diffDays(p.lastDay, today);
  if (gap <= 1) return p.streak;
  if (gap === 2 && p.freezes > 0) return p.streak; // a freeze will save it if you study today
  return 0;
}

// Each level needs a bit more XP than the last: 100, 150, 200, ...
export function levelInfo(xp: number): { level: number; into: number; needed: number } {
  let level = 1;
  let need = 100;
  let left = xp;
  while (left >= need) {
    left -= need;
    level += 1;
    need += 50;
  }
  return { level, into: left, needed: need };
}

export interface Badge {
  id: string;
  title: string;
  desc: string;
  icon: string; // Ionicons name
}

export const BADGES: Badge[] = [
  { id: 'first', title: 'First tick', desc: 'Finish your first Pomodoro', icon: 'checkmark-circle' },
  { id: 'planner', title: 'Planner pro', desc: 'Finish every planned item in a day (3+ items)', icon: 'list' },
  { id: 'target', title: 'Bullseye', desc: 'Hit your daily target', icon: 'locate' },
  { id: 'early', title: 'Early bird', desc: 'Finish a Pomodoro before 7am', icon: 'sunny' },
  { id: 'streak7', title: 'On fire', desc: 'Reach a 7-day streak', icon: 'flame' },
  { id: 'hours10', title: '10 hours', desc: 'Focus for 10 hours in total', icon: 'time' },
];

export interface BadgeContext {
  sessions: SessionRecord[];
  progress: Progress;
  todayItems: { status: string }[];
  targetHitToday: boolean;
}

export function newBadges(ctx: BadgeContext): string[] {
  const has = new Set(ctx.progress.badges);
  const focus = ctx.sessions.filter((s) => s.phase === 'focus' && !s.interrupted);
  const earned: string[] = [];
  const check = (id: string, ok: boolean) => {
    if (ok && !has.has(id)) earned.push(id);
  };
  check('first', focus.length >= 1);
  check('planner', ctx.todayItems.length >= 3 && ctx.todayItems.every((i) => i.status === 'done'));
  check('target', ctx.targetHitToday);
  check(
    'early',
    focus.some((s) => new Date(s.endedAt).getHours() < 7),
  );
  check('streak7', ctx.progress.streak >= 7);
  check('hours10', focus.reduce((m, s) => m + s.plannedMin, 0) >= 600);
  return earned;
}

export const badgeById = (id: string) => BADGES.find((b) => b.id === id);
