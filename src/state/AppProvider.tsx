// One place that holds all app data and actions, shared by every tab.
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as T from '../lib/timer';
import { KEYS, clearAll, loadArray, loadObject, saveJSON } from '../lib/storage';
import { cancelEnd, scheduleEnd } from '../lib/notifications';
import { dayKey } from '../lib/dates';
import { DayPlan, PlanItem, Plans, currentItem, emptyPlan, newId, unfinishedBefore } from '../lib/plan';
import { Progress, XP, addXp, badgeById, emptyProgress, newBadges, recordFocusDay } from '../lib/gamification';
import { statsForDay } from '../lib/stats';
import { ClockStyle, PALETTES, Palette, ThemeId } from '../lib/theme';

export interface Settings {
  durations: T.Durations;
  dailyGoal: number; // Pomodoros per day
  theme: ThemeId;
  clockStyle: ClockStyle;
}

export const DEFAULT_SETTINGS: Settings = {
  durations: T.DEFAULT_DURATIONS,
  dailyGoal: 6,
  theme: 'ember',
  clockStyle: 'flip',
};

// A focus session reset or skipped after this much time is saved as "Interrupted".
export const INTERRUPT_AFTER_MS = 10 * 1000;

export interface Celebration {
  title: string;
  xp: number;
  lines: string[];
  badges: string[];
  big: boolean;
}

interface PendingCheck {
  recordId: string;
  itemId: string;
  goal: string;
  day: string;
  xp: number;
  lines: string[];
  big: boolean;
}

interface Store {
  ready: boolean;
  settings: Settings;
  timer: T.TimerState;
  sessions: T.SessionRecord[];
  plans: Plans;
  progress: Progress;
  pendingCheck: PendingCheck | null;
  celebration: Celebration | null;
}

const initialStore = (): Store => ({
  ready: false,
  settings: DEFAULT_SETTINGS,
  timer: T.initialState(DEFAULT_SETTINGS.durations),
  sessions: [],
  plans: {},
  progress: emptyProgress(),
  pendingCheck: null,
  celebration: null,
});

const SAVE_KEY: Partial<Record<keyof Store, string>> = {
  settings: KEYS.settings,
  timer: KEYS.timer,
  sessions: KEYS.sessions,
  plans: KEYS.plans,
  progress: KEYS.progress,
  pendingCheck: KEYS.check,
};

function useStore() {
  const ref = useRef<Store>(initialStore());
  const [, setVersion] = useState(0);

  // Merge changes, save the changed parts, and re-render.
  const set = useCallback((patch: Partial<Store>) => {
    ref.current = { ...ref.current, ...patch };
    for (const k of Object.keys(patch) as (keyof Store)[]) {
      const key = SAVE_KEY[k];
      if (key) saveJSON(key, k === 'pendingCheck' ? { v: ref.current[k] } : ref.current[k]);
    }
    setVersion((v) => v + 1);
  }, []);

  return { ref, set };
}

function makeActions(ref: { current: Store }, set: (p: Partial<Store>) => void) {
  const s = () => ref.current;
  const today = () => dayKey();
  const planFor = (day: string): DayPlan => s().plans[day] ?? emptyPlan();
  const setPlan = (day: string, plan: DayPlan) => set({ plans: { ...s().plans, [day]: plan } });
  const updateItem = (day: string, id: string, fn: (i: PlanItem) => PlanItem) => {
    const plan = planFor(day);
    setPlan(day, { ...plan, items: plan.items.map((i) => (i.id === id ? fn(i) : i)) });
  };

  const celebrate = (c: Omit<Celebration, 'badges'>, day: string) => {
    const st = s();
    const earned = newBadges({
      sessions: st.sessions,
      progress: st.progress,
      todayItems: planFor(day).items,
      targetHitToday: st.progress.targetHitDays.includes(day),
    });
    if (earned.length) {
      set({ progress: { ...st.progress, badges: [...st.progress.badges, ...earned] } });
    }
    const lines = [...c.lines, ...earned.map((b) => `New badge: ${badgeById(b)?.title}`)];
    set({ celebration: { ...c, lines, badges: earned } });
  };

  // A focus session reached zero.
  const onFocusComplete = (record: T.SessionRecord) => {
    const day = dayKey(record.endedAt);
    const item = currentItem(planFor(day));
    const rec: T.SessionRecord = { ...record, planItemId: item?.id, goal: item?.title, tag: item?.tag };
    const sessions = [...s().sessions, rec];
    let { p, usedFreeze, earnedFreeze } = recordFocusDay(s().progress, day);
    const lines: string[] = [];
    let total = 0;

    const a = addXp(p, day, XP.focus);
    p = a.p;
    total += a.gained;
    lines.push(`+${a.gained} XP  Pomodoro finished`);
    if (usedFreeze) lines.push('A streak freeze saved your streak');
    if (earnedFreeze) lines.push('You earned a streak freeze');

    let big = false;
    const done = statsForDay(sessions, day).pomodoros;
    if (done >= s().settings.dailyGoal && !p.targetHitDays.includes(day)) {
      const b = addXp(p, day, XP.dailyTarget);
      p = { ...b.p, targetHitDays: [...b.p.targetHitDays, day] };
      total += b.gained;
      lines.push(`+${b.gained} XP  Daily target hit`);
      big = true;
    }
    set({ sessions, progress: p });

    if (item) {
      set({ pendingCheck: { recordId: rec.id, itemId: item.id, goal: item.title, day, xp: total, lines, big } });
    } else {
      celebrate({ title: big ? 'Daily target done' : 'Session done', xp: total, lines, big }, day);
    }
  };

  let completing = false;
  const checkFinished = () => {
    const st = s();
    if (completing || st.timer.status !== 'running' || !st.timer.endTime) return;
    if (st.timer.endTime > Date.now()) return;
    completing = true;
    const { state, record } = T.complete(st.timer, st.settings.durations);
    set({ timer: state });
    if (record.phase === 'focus') onFocusComplete(record);
    else set({ sessions: [...s().sessions, record] });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    completing = false;
  };

  // Honest interruptions: leaving a started focus session is recorded, not punished.
  const recordInterruption = () => {
    const t = s().timer;
    if (t.phase !== 'focus' || !t.phaseStartedAt) return;
    const now = Date.now();
    const elapsed = T.minToMs(t.plannedMin) - T.remainingAt(t, now);
    if (elapsed < INTERRUPT_AFTER_MS) return; // a few seconds is just a mis-tap
    const item = currentItem(planFor(today()));
    set({
      sessions: [
        ...s().sessions,
        {
          id: `${now}-focus-int`,
          phase: 'focus',
          startedAt: t.phaseStartedAt,
          endedAt: now,
          plannedMin: Math.round(elapsed / 60000),
          interrupted: true,
          planItemId: item?.id,
          goal: item?.title,
          tag: item?.tag,
        },
      ],
    });
  };

  return {
    checkFinished,

    async start() {
      const next = T.start(s().timer, Date.now());
      set({ timer: next });
      if (next.endTime) {
        const goal = next.phase === 'focus' ? currentItem(planFor(today()))?.title : undefined;
        const id = await scheduleEnd(next.phase, next.endTime, goal);
        set({ timer: { ...s().timer, notificationId: id } });
      }
    },
    async pause() {
      await cancelEnd(s().timer.notificationId);
      set({ timer: T.pause(s().timer, Date.now()) });
    },
    async reset() {
      await cancelEnd(s().timer.notificationId);
      recordInterruption();
      set({ timer: T.reset(s().timer, s().settings.durations) });
    },
    async skip() {
      await cancelEnd(s().timer.notificationId);
      recordInterruption();
      set({ timer: T.skip(s().timer, s().settings.durations) });
    },

    answerCheck(result: T.CheckResult) {
      const pc = s().pendingCheck;
      if (!pc) return;
      updateItem(pc.day, pc.itemId, (i) => ({
        ...i,
        used: i.used + 1,
        status: result === 'done' ? 'done' : result === 'partly' ? 'partly' : i.status,
      }));
      set({ sessions: s().sessions.map((r) => (r.id === pc.recordId ? { ...r, result } : r)) });
      const lines = [...pc.lines];
      let xp = pc.xp;
      if (result !== 'not_done') {
        const a = addXp(s().progress, pc.day, result === 'done' ? XP.done : XP.partly);
        set({ progress: a.p });
        xp += a.gained;
        lines.push(`+${a.gained} XP  Goal ${result === 'done' ? 'ticked off' : 'partly done'}`);
      } else {
        lines.push('No worries. It moves to your next session.');
      }
      set({ pendingCheck: null });
      const title = pc.big ? 'Daily target done' : result === 'done' ? 'Ticked off' : 'Session done';
      celebrate({ title, xp, lines, big: pc.big || result === 'done' }, pc.day);
    },
    closeCelebration() {
      set({ celebration: null });
    },

    // Plan actions (always for today)
    setTarget(target: string) {
      setPlan(today(), { ...planFor(today()), target });
    },
    addItem(title: string, estimate: number, tag?: string) {
      const plan = planFor(today());
      const item: PlanItem = { id: newId(), title: title.trim(), estimate, used: 0, status: 'pending', tag };
      setPlan(today(), { ...plan, items: [...plan.items, item] });
    },
    removeItem(id: string) {
      const plan = planFor(today());
      setPlan(today(), { ...plan, items: plan.items.filter((i) => i.id !== id) });
    },
    moveItem(id: string, dir: -1 | 1) {
      const items = [...planFor(today()).items];
      const i = items.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= items.length) return;
      [items[i], items[j]] = [items[j], items[i]];
      setPlan(today(), { ...planFor(today()), items });
    },
    toggleDone(id: string) {
      updateItem(today(), id, (i) => ({ ...i, status: i.status === 'done' ? 'pending' : 'done' }));
    },
    carryOver() {
      const prev = unfinishedBefore(s().plans, today());
      if (!prev) return;
      const plan = planFor(today());
      const have = new Set(plan.items.map((i) => i.title));
      const moved = prev.items
        .filter((i) => !have.has(i.title))
        .map((i) => ({ ...i, id: newId(), used: 0, status: 'pending' as const, carried: true }));
      setPlan(today(), { ...plan, items: [...moved, ...plan.items] });
      // mark them as moved on the old day so they are not offered again
      const old = s().plans[prev.day];
      setPlan(prev.day, {
        ...old,
        items: old.items.map((i) => (i.status === 'done' || i.movedOn ? i : { ...i, movedOn: today() })),
      });
    },

    updateSettings(patch: Partial<Settings>) {
      const settings = { ...s().settings, ...patch };
      set({ settings, timer: T.applyDurations(s().timer, settings.durations) });
    },
    async resetAll() {
      await cancelEnd(s().timer.notificationId);
      await clearAll();
      ref.current = { ...initialStore(), ready: true };
      set({});
    },
  };
}

type Actions = ReturnType<typeof makeActions>;
type Ctx = Store & { today: string; actions: Actions };

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { ref, set } = useStore();
  const actionsRef = useRef<Actions | null>(null);
  if (!actionsRef.current) actionsRef.current = makeActions(ref, set);
  const actions = actionsRef.current;

  // Load everything saved on the phone.
  useEffect(() => {
    (async () => {
      const [settings, sessions, progress] = await Promise.all([
        loadObject<Settings>(KEYS.settings, DEFAULT_SETTINGS),
        loadArray<T.SessionRecord>(KEYS.sessions),
        loadObject<Progress>(KEYS.progress, emptyProgress()),
      ]);
      settings.durations = { ...T.DEFAULT_DURATIONS, ...settings.durations };
      const timer = await loadObject<T.TimerState>(KEYS.timer, T.initialState(settings.durations));
      const plans = await loadObject<Plans>(KEYS.plans, {});
      const check = await loadObject<{ v: PendingCheck | null }>(KEYS.check, { v: null });
      ref.current = { ...ref.current, settings, sessions, progress, timer, plans, ready: true, pendingCheck: check.v };
      set({});
      actions.checkFinished();
    })();
  }, [actions, ref, set]);

  // Check about once a second if the countdown finished (works after the app was closed too).
  const running = ref.current.timer.status === 'running';
  useEffect(() => {
    if (!running) return;
    const id = setInterval(actions.checkFinished, 1000);
    return () => clearInterval(id);
  }, [running, actions]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') actions.checkFinished();
    });
    return () => sub.remove();
  }, [actions]);

  return <AppContext.Provider value={{ ...ref.current, today: dayKey(), actions }}>{children}</AppContext.Provider>;
}

// Colours of the selected theme.
export function useColors(): Palette {
  const { settings } = useApp();
  return PALETTES[settings.theme] ?? PALETTES.ember;
}

// Builds a StyleSheet from the current theme (re-built only when the theme changes).
export function useStyles<S>(make: (c: Palette) => S): S {
  const c = useColors();
  return useMemo(() => make(c), [c, make]);
}

// True if a focus session has started (running or paused) and would be lost by Reset/Skip.
export function focusStarted(t: T.TimerState, now = Date.now()): boolean {
  return (
    t.phase === 'focus' && !!t.phaseStartedAt && T.minToMs(t.plannedMin) - T.remainingAt(t, now) >= INTERRUPT_AFTER_MS
  );
}

export function useApp(): Ctx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

// Re-renders every `ms` while active and returns the CURRENT time.
// v1 bug: it returned the time saved in state, which was stale for one render right after Start,
// so the clock flashed 01:18 / 01:02 before settling. Now it always returns Date.now().
export function useNow(active: boolean, ms = 200): number {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick((t) => t + 1), ms);
    return () => clearInterval(id);
  }, [active, ms]);
  return Date.now();
}
