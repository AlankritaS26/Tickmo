// Pure timer logic. No React here, so it is easy to test and reason about.
// Key idea: we store WHEN the phase ends (endTime), not "seconds left".
// So if the app is closed or killed, we can still work out the correct time.

export type Phase = 'focus' | 'short' | 'long';
export type Status = 'idle' | 'running' | 'paused';
export type Durations = Record<Phase, number>; // minutes

export const DEFAULT_DURATIONS: Durations = { focus: 25, short: 5, long: 15 };
export const FOCUS_BEFORE_LONG_BREAK = 4;

export interface TimerState {
  phase: Phase;
  status: Status;
  endTime: number | null; // epoch ms, only when running
  remainingMs: number; // used when idle or paused
  plannedMin: number; // length of the current phase
  phaseStartedAt: number | null; // first time this phase was started
  focusDoneInCycle: number; // 0..3, resets after a long break
  notificationId: string | null;
}

export type CheckResult = 'done' | 'partly' | 'not_done';

export interface SessionRecord {
  id: string;
  phase: Phase;
  startedAt: number;
  endedAt: number;
  plannedMin: number;
  interrupted?: boolean; // reset in the middle of a focus session
  planItemId?: string;
  goal?: string;
  tag?: string;
  result?: CheckResult;
}

export const minToMs = (m: number) => m * 60 * 1000;

export const initialState = (d: Durations): TimerState => ({
  phase: 'focus',
  status: 'idle',
  endTime: null,
  remainingMs: minToMs(d.focus),
  plannedMin: d.focus,
  phaseStartedAt: null,
  focusDoneInCycle: 0,
  notificationId: null,
});

export function remainingAt(s: TimerState, now: number): number {
  if (s.status === 'running' && s.endTime) return Math.max(0, s.endTime - now);
  return s.remainingMs;
}

export function start(s: TimerState, now: number): TimerState {
  if (s.status === 'running') return s;
  return {
    ...s,
    status: 'running',
    endTime: now + s.remainingMs,
    phaseStartedAt: s.phaseStartedAt ?? now,
  };
}

export function pause(s: TimerState, now: number): TimerState {
  if (s.status !== 'running') return s;
  return { ...s, status: 'paused', remainingMs: remainingAt(s, now), endTime: null, notificationId: null };
}

export function nextPhase(s: TimerState): { phase: Phase; focusDoneInCycle: number } {
  if (s.phase === 'focus') {
    const done = s.focusDoneInCycle + 1;
    return done >= FOCUS_BEFORE_LONG_BREAK
      ? { phase: 'long', focusDoneInCycle: 0 }
      : { phase: 'short', focusDoneInCycle: done };
  }
  return { phase: 'focus', focusDoneInCycle: s.focusDoneInCycle };
}

function moveTo(s: TimerState, phase: Phase, focusDoneInCycle: number, d: Durations): TimerState {
  return {
    ...s,
    phase,
    focusDoneInCycle,
    status: 'idle',
    endTime: null,
    remainingMs: minToMs(d[phase]),
    plannedMin: d[phase],
    phaseStartedAt: null,
    notificationId: null,
  };
}

// Called when the countdown reaches zero. Returns the next state and a record to save.
export function complete(s: TimerState, d: Durations): { state: TimerState; record: SessionRecord } {
  const endedAt = s.endTime ?? Date.now();
  const record: SessionRecord = {
    id: `${endedAt}-${s.phase}`,
    phase: s.phase,
    startedAt: s.phaseStartedAt ?? endedAt - minToMs(s.plannedMin),
    endedAt,
    plannedMin: s.plannedMin,
  };
  const n = nextPhase(s);
  return { state: moveTo(s, n.phase, n.focusDoneInCycle, d), record };
}

// Skip does NOT count as a finished Pomodoro.
export function skip(s: TimerState, d: Durations): TimerState {
  const n = nextPhase(s);
  return moveTo(s, n.phase, s.phase === 'focus' ? s.focusDoneInCycle : n.focusDoneInCycle, d);
}

export function reset(s: TimerState, d: Durations): TimerState {
  return moveTo(s, s.phase, s.focusDoneInCycle, d);
}

// When settings change and the timer has not started, use the new length.
export function applyDurations(s: TimerState, d: Durations): TimerState {
  if (s.status !== 'idle' || s.phaseStartedAt) return s;
  return { ...s, remainingMs: minToMs(d[s.phase]), plannedMin: d[s.phase] };
}
