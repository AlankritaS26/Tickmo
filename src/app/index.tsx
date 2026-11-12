// Timer tab: the current session's goal, the clock (4 styles), full-screen mode and today's progress.
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { focusStarted, useApp, useColors, useNow, useStyles } from '../state/AppProvider';
import { Clock } from '../components/Clock';
import { FullScreenFocus } from '../components/FullScreenFocus';
import { GoalRing } from '../components/GoalRing';
import { Logo, Mo } from '../components/Mo';
import { FOCUS_BEFORE_LONG_BREAK, Phase, minToMs, remainingAt } from '../lib/timer';
import { currentItem } from '../lib/plan';
import { statsForDay, hours } from '../lib/stats';
import { levelInfo, visibleStreak } from '../lib/gamification';
import { CLOCK_STYLES, Palette, RADIUS, tagColor } from '../lib/theme';

const LABELS: Record<Phase, string> = { focus: 'Focus', short: 'Short break', long: 'Long break' };

export default function TimerScreen() {
  const C = useColors();
  const styles = useStyles(makeStyles);
  const { ready, timer, sessions, plans, progress, settings, today, actions } = useApp();
  const running = timer.status === 'running';
  const now = useNow(running);
  const [full, setFull] = useState(false);
  if (!ready) return <View style={styles.screen} />;

  const plan = plans[today];
  const item = currentItem(plan);
  const stats = statsForDay(sessions, today, plan);
  const accent = timer.phase === 'focus' ? C.focus : C.break;
  const streak = visibleStreak(progress, today);
  const lvl = levelInfo(progress.xp);

  // Reset/Skip in the middle of a focus session: ask first, it is saved as Interrupted.
  const guarded = (action: () => void, verb: string) => () => {
    if (!focusStarted(timer)) return action();
    Alert.alert(`${verb} this session?`, 'It will be saved as Interrupted in your report. No XP for it.', [
      { text: 'Keep going', style: 'cancel' },
      { text: verb, style: 'destructive', onPress: action },
    ]);
  };

  // Long-press the clock to switch its design.
  const cycleClock = () => {
    const i = CLOCK_STYLES.findIndex((c) => c.id === settings.clockStyle);
    const next = CLOCK_STYLES[(i + 1) % CLOCK_STYLES.length];
    actions.updateSettings({ clockStyle: next.id });
    Haptics.selectionAsync().catch(() => {});
  };

  const sessionLine = item
    ? item.used >= item.estimate
      ? `Extra session (${item.used} of ~${item.estimate} used)`
      : `Session ${item.used + 1} of ~${item.estimate}`
    : '';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Logo size={24} />
        <View style={styles.chips}>
          <View style={styles.chip}>
            <Ionicons name="flame" size={16} color={streak ? C.focus : C.muted} />
            <Text style={styles.chipText}>{streak}</Text>
          </View>
          <View style={styles.chip}>
            <Ionicons name="star" size={16} color={C.gold} />
            <Text style={styles.chipText}>Lv {lvl.level}</Text>
          </View>
        </View>
      </View>

      <View style={styles.goalCard}>
        {timer.phase === 'focus' ? (
          item ? (
            <>
              <View style={styles.goalTop}>
                <Text style={styles.goalLabel}>THIS SESSION</Text>
                {item.tag ? (
                  <View style={[styles.pill, { backgroundColor: tagColor(item.tag) }]}>
                    <Text style={styles.pillText}>{item.tag}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.goal} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.goalMeta}>
                {sessionLine}
                {item.status === 'partly' ? '  ·  continuing' : ''}
              </Text>
            </>
          ) : (
            <Link href="/plan" asChild>
              <Pressable style={styles.noPlan}>
                <Mo size={40} mood="focus" />
                <Text style={styles.noPlanText}>Plan what you'll do in this session</Text>
                <Ionicons name="chevron-forward" size={18} color={C.muted} />
              </Pressable>
            </Link>
          )
        ) : (
          <>
            <Text style={styles.goalLabel}>BREAK</Text>
            <Text style={styles.goal}>Stand up, drink water, look away from screens.</Text>
          </>
        )}
      </View>

      <View style={styles.center}>
        <View style={styles.phaseRow}>
          <Text style={[styles.phase, { color: accent }]}>{LABELS[timer.phase]}</Text>
          <Pressable onPress={() => setFull(true)} hitSlop={10} style={styles.fullBtn}>
            <Ionicons name="expand" size={20} color={C.muted} />
          </Pressable>
        </View>
        <Pressable onLongPress={cycleClock} delayLongPress={400}>
          <Clock
            ms={remainingAt(timer, now)}
            totalMs={minToMs(timer.plannedMin)}
            style={settings.clockStyle}
            accent={accent}
          />
        </Pressable>
        <View style={styles.dots}>
          {Array.from({ length: FOCUS_BEFORE_LONG_BREAK }).map((_, i) => (
            <View key={i} style={[styles.dot, i < timer.focusDoneInCycle && { backgroundColor: C.focus }]} />
          ))}
        </View>

        <Pressable
          style={[styles.mainBtn, { backgroundColor: accent }]}
          onPress={running ? actions.pause : actions.start}
        >
          <Text style={styles.mainBtnText}>{running ? 'Pause' : timer.status === 'paused' ? 'Resume' : 'Start'}</Text>
        </Pressable>
        <View style={styles.row}>
          <Pressable style={styles.smallBtn} onPress={guarded(actions.reset, 'End')}>
            <Text style={styles.smallBtnText}>Reset</Text>
          </Pressable>
          <Pressable style={styles.smallBtn} onPress={guarded(actions.skip, 'Skip')}>
            <Text style={styles.smallBtnText}>Skip</Text>
          </Pressable>
        </View>
        <Text style={styles.tip}>Long-press the clock to change its style</Text>
      </View>

      <View style={styles.todayCard}>
        <GoalRing value={stats.pomodoros} max={settings.dailyGoal} label="today" />
        <View style={styles.todayStats}>
          <Text style={styles.todayTitle}>Today</Text>
          <Text style={styles.todayLine}>
            {stats.pomodoros} Pomodoros · {hours(stats.focusMinutes)} focus
          </Text>
          <Text style={styles.todayLine}>
            {stats.done}/{stats.planned} goals done · {progress.xpByDay[today] ?? 0} XP
            {stats.interrupted ? ` · ${stats.interrupted} interrupted` : ''}
          </Text>
        </View>
      </View>

      <FullScreenFocus visible={full} onClose={() => setFull(false)} />
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg, paddingHorizontal: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 },
    chips: { flexDirection: 'row', gap: 8 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: c.card,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: RADIUS.pill,
    },
    chipText: { color: c.text, fontWeight: '700' },
    goalCard: { backgroundColor: c.card, borderRadius: RADIUS.card, padding: 16, marginTop: 16 },
    goalTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    goalLabel: { color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
    pill: { borderRadius: RADIUS.pill, paddingHorizontal: 8, paddingVertical: 2 },
    pillText: { color: '#111', fontSize: 11, fontWeight: '800' },
    goal: { color: c.text, fontSize: 20, fontWeight: '700', marginTop: 6 },
    goalMeta: { color: c.muted, fontSize: 13, marginTop: 6 },
    noPlan: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    noPlanText: { color: c.text, fontSize: 16, flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    phaseRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
    phase: { fontSize: 18, fontWeight: '600', letterSpacing: 1 },
    fullBtn: { padding: 4 },
    dots: { flexDirection: 'row', gap: 10, marginTop: 20 },
    dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: c.cardHigh },
    mainBtn: { marginTop: 24, paddingVertical: 16, width: 220, borderRadius: RADIUS.pill, alignItems: 'center' },
    mainBtnText: { color: c.onAccent, fontSize: 20, fontWeight: '700' },
    row: { flexDirection: 'row', gap: 12, marginTop: 14 },
    smallBtn: {
      paddingVertical: 10,
      paddingHorizontal: 22,
      borderRadius: RADIUS.pill,
      borderWidth: 1,
      borderColor: c.cardHigh,
    },
    smallBtnText: { color: c.muted, fontSize: 16 },
    tip: { color: c.muted, fontSize: 11, marginTop: 12, opacity: 0.7 },
    todayCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      backgroundColor: c.card,
      borderRadius: RADIUS.card,
      padding: 14,
      marginBottom: 16,
    },
    todayStats: { flex: 1 },
    todayTitle: { color: c.text, fontSize: 16, fontWeight: '700' },
    todayLine: { color: c.muted, fontSize: 13, marginTop: 4 },
  });
