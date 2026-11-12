// The "you did it" screen with XP, like Duolingo's lesson-complete screen.
import { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useApp, useColors, useStyles } from '../state/AppProvider';
import { badgeById } from '../lib/gamification';
import { Palette, RADIUS } from '../lib/theme';
import { Mo } from './Mo';

function Confetti() {
  const C = useColors();
  const styles = useStyles(makeStyles);
  const CONFETTI = [C.focus, C.break, C.gold, '#8B7CF6', '#5BA8FF'];
  const pieces = useRef(
    Array.from({ length: 18 }, (_, i) => ({
      x: (i / 18) * 100,
      fall: new Animated.Value(0),
      color: CONFETTI[i % CONFETTI.length],
      delay: (i % 6) * 90,
    })),
  ).current;
  useEffect(() => {
    Animated.parallel(
      pieces.map((p) => Animated.timing(p.fall, { toValue: 1, duration: 1400, delay: p.delay, useNativeDriver: true })),
    ).start();
  }, [pieces]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: 0,
            width: 8,
            height: 14,
            borderRadius: 2,
            backgroundColor: p.color,
            opacity: p.fall.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateY: p.fall.interpolate({ inputRange: [0, 1], outputRange: [-20, 420] }) },
              { rotate: p.fall.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${i % 2 ? 360 : -360}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

export function CelebrationModal() {
  const C = useColors();
  const styles = useStyles(makeStyles);
  const { celebration, actions } = useApp();
  const scale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!celebration) return;
    scale.setValue(0.6);
    Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [celebration, scale]);

  if (!celebration) return null;
  return (
    <Modal transparent animationType="fade" visible statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {celebration.big ? <Confetti /> : null}
          <Animated.View style={{ transform: [{ scale }] }}>
            <Mo size={96} mood={celebration.big ? 'party' : 'happy'} />
          </Animated.View>
          <Text style={styles.title}>{celebration.title}</Text>
          <Text style={styles.xp}>+{celebration.xp} XP</Text>
          {celebration.lines.map((l) => (
            <Text key={l} style={styles.line}>
              {l}
            </Text>
          ))}
          {celebration.badges.map((id) => {
            const b = badgeById(id);
            if (!b) return null;
            return (
              <View key={id} style={styles.badge}>
                <Ionicons name={b.icon as keyof typeof Ionicons.glyphMap} size={22} color={C.gold} />
                <Text style={styles.badgeText}>{b.title}</Text>
              </View>
            );
          })}
          <Pressable style={styles.btn} onPress={actions.closeCelebration}>
            <Text style={styles.btnText}>Continue</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 24 },
    sheet: {
      backgroundColor: c.card,
      borderRadius: RADIUS.card,
      padding: 24,
      alignItems: 'center',
      overflow: 'hidden',
    },
    title: { color: c.text, fontSize: 24, fontWeight: '800', marginTop: 12 },
    xp: { color: c.gold, fontSize: 40, fontWeight: '900', marginVertical: 8 },
    line: { color: c.muted, fontSize: 14, marginTop: 4, textAlign: 'center' },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: c.cardHigh,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: RADIUS.pill,
      marginTop: 10,
    },
    badgeText: { color: c.text, fontWeight: '700' },
    btn: {
      marginTop: 22,
      backgroundColor: c.focus,
      width: '100%',
      paddingVertical: 14,
      borderRadius: RADIUS.pill,
      alignItems: 'center',
    },
    btnText: { color: c.onAccent, fontSize: 17, fontWeight: '700' },
  });
