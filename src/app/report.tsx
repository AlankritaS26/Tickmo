// Report tab: planned vs actually done, today and this week.
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useApp, useColors, useStyles } from '../state/AppProvider';
import { hours, lastNDays, sessionsOn, statsForDay } from '../lib/stats';
import { shortDay, timeOf } from '../lib/dates';
import { Palette, RADIUS, tagColor } from '../lib/theme';
import { addDays, dayKey } from '../lib/dates';

const resultOf = (C: Palette): Record<string, { label: string; color: string }> => ({
  done: { label: 'Done', color: C.break },
  partly: { label: 'Partly', color: C.gold },
  not_done: { label: 'Not done', color: C.muted },
});

function Stat({ value, label }: { value: string; label: string }) {
  const C = useColors();
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ReportScreen() {
  const C = useColors();
  const styles = useStyles(makeStyles);
  const { sessions, plans, progress, settings, today } = useApp();
  const plan = plans[today];
  const s = statsForDay(sessions, today, plan);
  const week = lastNDays(sessions, today, 7);
  const weekMin = week.reduce((m, d) => m + d.minutes, 0);
  const weekPomos = week.reduce((m, d) => m + d.pomodoros, 0);
  const maxBar = Math.max(settings.dailyGoal, ...week.map((d) => d.pomodoros));
  const allMin = sessions.filter((r) => r.phase === 'focus' && !r.interrupted).reduce((m, r) => m + r.plannedMin, 0);
  const weekStart = addDays(today, -6);
  const byTag: Record<string, number> = {};
  sessions
    .filter((r) => r.phase === 'focus' && !r.interrupted && dayKey(r.endedAt) >= weekStart)
    .forEach((r) => {
      const k = r.tag ?? 'Untagged';
      byTag[k] = (byTag[k] ?? 0) + r.plannedMin;
    });
  const tagRows = Object.entries(byTag).sort((a, b) => b[1] - a[1]);
  const tagMax = Math.max(1, ...tagRows.map((t) => t[1]));
  const log = sessionsOn(sessions, today)
    .filter((r) => r.phase === 'focus')
    .sort((a, b) => b.endedAt - a.endedAt);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h1}>Daily report</Text>
        {plan?.target ? <Text style={styles.target}>Target: {plan.target}</Text> : null}

        <View style={styles.card}>
          <View style={styles.row}>
            <Stat value={String(s.pomodoros)} label="Pomodoros" />
            <Stat value={hours(s.focusMinutes)} label="Focus time" />
            <Stat value={`${s.done}/${s.planned}`} label="Goals done" />
          </View>
          <View style={[styles.row, { marginTop: 14 }]}>
            <Stat value={String(s.partly)} label="Partly done" />
            <Stat value={String(s.interrupted)} label="Interrupted" />
            <Stat value={String(progress.xpByDay[today] ?? 0)} label="XP today" />
          </View>
        </View>

        <Text style={styles.label}>PLANNED VS DONE</Text>
        <View style={styles.card}>
          {plan?.items.length ? (
            plan.items.map((i) => (
              <View key={i.id} style={styles.planRow}>
                <Ionicons
                  name={
                    i.status === 'done' ? 'checkmark-circle' : i.status === 'partly' ? 'contrast' : 'ellipse-outline'
                  }
                  size={20}
                  color={i.status === 'done' ? C.break : i.status === 'partly' ? C.gold : C.muted}
                />
                <Text style={styles.planTitle} numberOfLines={1}>
                  {i.title}
                </Text>
                <Text style={styles.planMeta}>
                  {i.used}/{i.estimate}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>No plan for today yet.</Text>
          )}
        </View>

        <Text style={styles.label}>LAST 7 DAYS</Text>
        <View style={styles.card}>
          <View style={styles.bars}>
            {week.map((d) => (
              <View key={d.day} style={styles.barCol}>
                <Text style={styles.barNum}>{d.pomodoros || ''}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${(d.pomodoros / maxBar) * 100}%`,
                        backgroundColor: d.pomodoros >= settings.dailyGoal ? C.break : C.focus,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barDay, d.day === today && { color: C.text }]}>{shortDay(d.day)}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.weekLine}>
            {weekPomos} Pomodoros · {hours(weekMin)} this week · best streak {progress.bestStreak} days ·{' '}
            {hours(allMin)} all time
          </Text>
        </View>

        <Text style={styles.label}>TIME BY SUBJECT (7 DAYS)</Text>
        <View style={styles.card}>
          {tagRows.length ? (
            tagRows.map(([t, m]) => (
              <View key={t} style={styles.tagRow}>
                <Text style={styles.tagName}>{t}</Text>
                <View style={styles.tagTrack}>
                  <View
                    style={[
                      styles.tagBar,
                      { width: `${(m / tagMax) * 100}%`, backgroundColor: t === 'Untagged' ? C.muted : tagColor(t) },
                    ]}
                  />
                </View>
                <Text style={styles.tagMin}>{hours(m)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>Add a subject to your plan goals to see where your time goes.</Text>
          )}
        </View>

        <Text style={styles.label}>TODAY'S SESSIONS</Text>
        <View style={styles.card}>
          {log.length ? (
            log.map((r) => {
              const res = r.interrupted
                ? { label: 'Interrupted', color: C.danger }
                : r.result
                  ? resultOf(C)[r.result]
                  : null;
              return (
                <View key={r.id} style={styles.logRow}>
                  <Text style={styles.logTime}>{timeOf(r.endedAt)}</Text>
                  <Text style={styles.logGoal} numberOfLines={1}>
                    {r.goal ?? 'Focus session'} · {r.plannedMin}m
                  </Text>
                  {res ? <Text style={[styles.logRes, { color: res.color }]}>{res.label}</Text> : null}
                </View>
              );
            })
          ) : (
            <Text style={styles.empty}>Finish a Pomodoro and it shows up here.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { padding: 20, paddingBottom: 40 },
    h1: { color: c.text, fontSize: 26, fontWeight: '800' },
    target: { color: c.muted, fontSize: 14, marginTop: 6 },
    label: { color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 20, marginBottom: 8 },
    card: { backgroundColor: c.card, borderRadius: RADIUS.card, padding: 16, marginTop: 12 },
    row: { flexDirection: 'row' },
    stat: { flex: 1, alignItems: 'center' },
    statValue: { color: c.text, fontSize: 22, fontWeight: '800' },
    statLabel: { color: c.muted, fontSize: 12, marginTop: 4 },
    planRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
    planTitle: { color: c.text, fontSize: 15, flex: 1 },
    planMeta: { color: c.muted, fontSize: 13 },
    empty: { color: c.muted, fontSize: 14 },
    bars: { flexDirection: 'row', justifyContent: 'space-between', height: 140 },
    barCol: { flex: 1, alignItems: 'center' },
    barNum: { color: c.muted, fontSize: 11, height: 16 },
    barTrack: { flex: 1, width: 18, justifyContent: 'flex-end', backgroundColor: c.cardHigh, borderRadius: 9 },
    bar: { width: 18, borderRadius: 9 },
    barDay: { color: c.muted, fontSize: 12, marginTop: 6 },
    weekLine: { color: c.muted, fontSize: 13, marginTop: 14, lineHeight: 19 },
    logRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
    logTime: { color: c.muted, fontSize: 13, width: 44, fontVariant: ['tabular-nums'] },
    logGoal: { color: c.text, fontSize: 14, flex: 1 },
    tagRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
    tagName: { color: c.text, fontSize: 13, width: 72 },
    tagTrack: { flex: 1, height: 10, backgroundColor: c.cardHigh, borderRadius: 5, overflow: 'hidden' },
    tagBar: { height: 10, borderRadius: 5 },
    tagMin: { color: c.muted, fontSize: 12, width: 52, textAlign: 'right' },
    logRes: { fontSize: 13, fontWeight: '700' },
  });
