// Profile tab: Mo, level, streak, badges and settings.
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useApp, useColors, useStyles } from '../state/AppProvider';
import { BADGES, MAX_FREEZES, XP, levelInfo, visibleStreak } from '../lib/gamification';
import { Mo } from '../components/Mo';
import { Stepper } from '../components/Stepper';
import { CLOCK_STYLES, PALETTES, Palette, RADIUS, THEME_IDS } from '../lib/theme';
import { Clock } from '../components/Clock';

export default function ProfileScreen() {
  const C = useColors();
  const styles = useStyles(makeStyles);
  const { progress, settings, today, actions } = useApp();
  const lvl = levelInfo(progress.xp);
  const streak = visibleStreak(progress, today);
  const d = settings.durations;
  const setDur = (k: keyof typeof d, v: number) => actions.updateSettings({ durations: { ...d, [k]: v } });

  const confirmReset = () =>
    Alert.alert('Reset everything?', 'This deletes all sessions, plans, XP and badges on this phone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: actions.resetAll },
    ]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Mo size={88} mood={streak ? 'happy' : 'sleepy'} />
          <View style={{ flex: 1 }}>
            <Text style={styles.level}>Level {lvl.level}</Text>
            <Text style={styles.xp}>{progress.xp} XP total</Text>
            <View style={styles.xpTrack}>
              <View style={[styles.xpBar, { width: `${(lvl.into / lvl.needed) * 100}%` }]} />
            </View>
            <Text style={styles.xpNext}>
              {lvl.needed - lvl.into} XP to level {lvl.level + 1}
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.box}>
            <Ionicons name="flame" size={22} color={C.focus} />
            <Text style={styles.boxValue}>{streak}</Text>
            <Text style={styles.boxLabel}>day streak</Text>
          </View>
          <View style={styles.box}>
            <Ionicons name="snow" size={22} color="#7CC8FF" />
            <Text style={styles.boxValue}>
              {progress.freezes}/{MAX_FREEZES}
            </Text>
            <Text style={styles.boxLabel}>streak freezes</Text>
          </View>
          <View style={styles.box}>
            <Ionicons name="trophy" size={22} color={C.gold} />
            <Text style={styles.boxValue}>{progress.bestStreak}</Text>
            <Text style={styles.boxLabel}>best streak</Text>
          </View>
        </View>
        <Text style={styles.hint}>
          Earn a streak freeze every 7 days in a row. It saves your streak if you miss one day.
        </Text>

        <Text style={styles.label}>BADGES</Text>
        <View style={styles.badges}>
          {BADGES.map((b) => {
            const has = progress.badges.includes(b.id);
            return (
              <View key={b.id} style={[styles.badge, !has && { opacity: 0.4 }]}>
                <Ionicons name={b.icon as keyof typeof Ionicons.glyphMap} size={26} color={has ? C.gold : C.muted} />
                <Text style={styles.badgeTitle}>{b.title}</Text>
                <Text style={styles.badgeDesc}>{b.desc}</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.label}>HOW XP WORKS</Text>
        <View style={styles.card}>
          <Text style={styles.rule}>+{XP.focus} finish a Pomodoro</Text>
          <Text style={styles.rule}>
            +{XP.done} tick off the session goal (+{XP.partly} if partly)
          </Text>
          <Text style={styles.rule}>+{XP.dailyTarget} hit your daily target</Text>
          <Text style={styles.rule}>Max {XP.dailyCap} XP a day, so rest is never punished</Text>
        </View>

        <Text style={styles.label}>THEME</Text>
        <View style={styles.swatches}>
          {THEME_IDS.map((id) => {
            const p = PALETTES[id];
            const on = settings.theme === id;
            return (
              <Pressable
                key={id}
                onPress={() => actions.updateSettings({ theme: id })}
                style={[styles.swatch, { backgroundColor: p.bg, borderColor: on ? p.focus : p.cardHigh }]}
              >
                <View style={styles.swatchDots}>
                  <View style={[styles.swatchDot, { backgroundColor: p.focus }]} />
                  <View style={[styles.swatchDot, { backgroundColor: p.break }]} />
                  <View style={[styles.swatchDot, { backgroundColor: p.card }]} />
                </View>
                <Text style={[styles.swatchName, { color: p.text }]}>{p.name}</Text>
                {on ? <Ionicons name="checkmark-circle" size={16} color={p.focus} style={styles.swatchTick} /> : null}
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>CLOCK STYLE</Text>
        <View style={styles.clockGrid}>
          {CLOCK_STYLES.map((cs) => {
            const on = settings.clockStyle === cs.id;
            return (
              <Pressable
                key={cs.id}
                onPress={() => actions.updateSettings({ clockStyle: cs.id })}
                style={[styles.clockOpt, on && { borderColor: C.focus }]}
              >
                <View style={styles.clockPreview} pointerEvents="none">
                  <Clock
                    ms={(24 * 60 + 59) * 1000}
                    totalMs={25 * 60 * 1000}
                    style={cs.id}
                    accent={C.focus}
                    scale={0.32}
                  />
                </View>
                <Text style={[styles.clockName, on && { color: C.focus }]}>{cs.name}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.hint}>Tip: long-press the clock on the Timer tab to switch quickly.</Text>

        <Text style={styles.label}>SETTINGS</Text>
        <View style={styles.card}>
          <Stepper
            label="Focus"
            value={d.focus}
            min={1}
            max={90}
            step={d.focus < 5 ? 1 : 5}
            suffix=" min"
            onChange={(v) => setDur('focus', v)}
          />
          <Stepper
            label="Short break"
            value={d.short}
            min={1}
            max={30}
            suffix=" min"
            onChange={(v) => setDur('short', v)}
          />
          <Stepper
            label="Long break"
            value={d.long}
            min={5}
            max={60}
            step={5}
            suffix=" min"
            onChange={(v) => setDur('long', v)}
          />
          <Stepper
            label="Daily target"
            value={settings.dailyGoal}
            min={1}
            max={16}
            suffix=" pomo"
            onChange={(v) => actions.updateSettings({ dailyGoal: v })}
          />
          <Text style={styles.hint}>
            New lengths apply when the timer is not running (after Reset or the next session).
          </Text>
        </View>

        <Pressable style={styles.reset} onPress={confirmReset}>
          <Text style={styles.resetText}>Reset all data</Text>
        </Pressable>
        <Text style={styles.footer}>Tickmo v2 · your data stays on this phone</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { padding: 20, paddingBottom: 40 },
    hero: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      backgroundColor: c.card,
      borderRadius: RADIUS.card,
      padding: 16,
    },
    level: { color: c.text, fontSize: 24, fontWeight: '800' },
    xp: { color: c.muted, fontSize: 13, marginTop: 2 },
    xpTrack: { height: 10, backgroundColor: c.cardHigh, borderRadius: 5, marginTop: 10, overflow: 'hidden' },
    xpBar: { height: 10, backgroundColor: c.gold, borderRadius: 5 },
    xpNext: { color: c.muted, fontSize: 12, marginTop: 6 },
    row: { flexDirection: 'row', gap: 10, marginTop: 12 },
    box: { flex: 1, backgroundColor: c.card, borderRadius: 16, padding: 12, alignItems: 'center' },
    boxValue: { color: c.text, fontSize: 20, fontWeight: '800', marginTop: 4 },
    boxLabel: { color: c.muted, fontSize: 11, marginTop: 2, textAlign: 'center' },
    hint: { color: c.muted, fontSize: 12, marginTop: 8, lineHeight: 17 },
    label: { color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 22, marginBottom: 8 },
    badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    badge: { width: '31%', backgroundColor: c.card, borderRadius: 16, padding: 10, alignItems: 'center' },
    badgeTitle: { color: c.text, fontSize: 13, fontWeight: '700', marginTop: 6, textAlign: 'center' },
    badgeDesc: { color: c.muted, fontSize: 10, marginTop: 2, textAlign: 'center' },
    card: { backgroundColor: c.card, borderRadius: RADIUS.card, paddingHorizontal: 16, paddingVertical: 8 },
    rule: { color: c.text, fontSize: 14, paddingVertical: 5 },
    reset: {
      marginTop: 24,
      padding: 14,
      borderRadius: RADIUS.pill,
      borderWidth: 1,
      borderColor: c.danger,
      alignItems: 'center',
    },
    resetText: { color: c.danger, fontWeight: '700' },
    swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    swatch: { width: '31%', borderRadius: 16, padding: 10, borderWidth: 2 },
    swatchDots: { flexDirection: 'row', gap: 4 },
    swatchDot: { width: 14, height: 14, borderRadius: 7 },
    swatchName: { fontSize: 13, fontWeight: '700', marginTop: 8 },
    swatchTick: { position: 'absolute', top: 8, right: 8 },
    clockGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    clockOpt: {
      width: '48%',
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 10,
      borderWidth: 2,
      borderColor: c.card,
      alignItems: 'center',
    },
    clockPreview: { height: 92, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    clockName: { color: c.text, fontSize: 13, fontWeight: '700', marginTop: 4 },
    footer: { color: c.muted, fontSize: 12, textAlign: 'center', marginTop: 16 },
  });
