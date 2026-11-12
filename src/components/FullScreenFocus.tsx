// Full-screen focus mode: just the clock and your goal. Tap anywhere to show/hide the controls.
import { useEffect, useState } from 'react';
import { Modal, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useApp, useColors, useNow, useStyles } from '../state/AppProvider';
import { Palette, RADIUS } from '../lib/theme';
import { remainingAt, minToMs } from '../lib/timer';
import { currentItem } from '../lib/plan';
import { Clock } from './Clock';

export function FullScreenFocus({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const C = useColors();
  const styles = useStyles(makeStyles);
  const { timer, plans, today, settings, actions } = useApp();
  const running = timer.status === 'running';
  const now = useNow(visible && running);
  const [showControls, setShowControls] = useState(true);

  // hide controls 3 s after they appear while running
  useEffect(() => {
    if (!visible || !showControls || !running) return;
    const id = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(id);
  }, [visible, showControls, running]);

  useEffect(() => {
    if (visible) setShowControls(true);
  }, [visible]);

  if (!visible) return null;
  const item = currentItem(plans[today]);
  const accent = timer.phase === 'focus' ? C.focus : C.break;
  const label = timer.phase === 'focus' ? (item?.title ?? 'Focus') : 'Break · rest your eyes';

  return (
    <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <StatusBar hidden />
      <Pressable style={styles.screen} onPress={() => setShowControls((v) => !v)}>
        <Text style={[styles.goal, { color: accent }]} numberOfLines={2}>
          {label}
        </Text>
        <Clock
          ms={remainingAt(timer, now)}
          totalMs={minToMs(timer.plannedMin)}
          style={settings.clockStyle}
          accent={accent}
          scale={1.3}
        />
        {showControls ? (
          <View style={styles.controls}>
            <Pressable
              style={[styles.btn, { backgroundColor: accent }]}
              onPress={running ? actions.pause : actions.start}
            >
              <Ionicons name={running ? 'pause' : 'play'} size={26} color={C.onAccent} />
            </Pressable>
            <Pressable style={[styles.btn, styles.ghost]} onPress={onClose}>
              <Ionicons name="contract" size={24} color={C.text} />
            </Pressable>
          </View>
        ) : (
          <Text style={styles.hint}>Tap to show controls</Text>
        )}
      </Pressable>
    </Modal>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
    goal: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 36, maxWidth: 520 },
    controls: { flexDirection: 'row', gap: 18, marginTop: 48, height: 64 },
    btn: { width: 64, height: 64, borderRadius: RADIUS.pill, alignItems: 'center', justifyContent: 'center' },
    ghost: { borderWidth: 1, borderColor: c.cardHigh },
    hint: { color: c.muted, fontSize: 13, marginTop: 48, height: 64, opacity: 0.6 },
  });
