// The timer display, in 4 styles the user can pick: Flip, Ring, Digital, Minimal.
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useColors } from '../state/AppProvider';
import { ClockStyle, Palette } from '../lib/theme';

interface Props {
  ms: number; // time left
  totalMs: number; // length of the session
  style: ClockStyle;
  accent: string;
  scale?: number; // 1 = normal, bigger for full screen
}

export function split(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return { mm: String(Math.floor(total / 60)).padStart(2, '0'), ss: String(total % 60).padStart(2, '0'), total };
}

export function Clock({ ms, totalMs, style, accent, scale = 1 }: Props) {
  const c = useColors();
  const { mm, ss, total } = split(ms);
  if (style === 'ring')
    return <RingClock mm={mm} ss={ss} pct={totalMs ? 1 - ms / totalMs : 0} accent={accent} scale={scale} c={c} />;
  if (style === 'digital') {
    return (
      <Text style={[styles.digital, { color: c.text, fontSize: 92 * scale }]}>
        {mm}
        <Text style={{ color: accent }}>:</Text>
        {ss}
      </Text>
    );
  }
  if (style === 'minimal') {
    const underMin = total < 60;
    return (
      <View style={styles.center}>
        <Text style={[styles.minimal, { color: c.text, fontSize: 120 * scale }]}>
          {underMin ? total : Math.ceil(total / 60)}
        </Text>
        <Text style={[styles.minimalSub, { color: c.muted, fontSize: 16 * scale }]}>
          {underMin ? 'seconds left' : 'minutes left'}
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.row}>
      <FlipCard value={mm} scale={scale} c={c} />
      <Text style={[styles.colon, { color: c.muted, fontSize: 56 * scale }]}>:</Text>
      <FlipCard value={ss} scale={scale} c={c} />
    </View>
  );
}

// ---------- Flip (split-flap animation) ----------

function Half({
  value,
  part,
  h,
  w,
  fontSize,
  c,
}: {
  value: string;
  part: 'top' | 'bottom';
  h: number;
  w: number;
  fontSize: number;
  c: Palette;
}) {
  return (
    <View style={{ height: h / 2, width: w, overflow: 'hidden', backgroundColor: c.card }}>
      <View style={{ height: h, width: w, marginTop: part === 'top' ? 0 : -h / 2, justifyContent: 'center' }}>
        <Text style={[styles.flipDigits, { color: c.text, fontSize, lineHeight: h }]}>{value}</Text>
      </View>
    </View>
  );
}

function FlipCard({ value, scale, c }: { value: string; scale: number; c: Palette }) {
  const fontSize = 80 * scale;
  const h = fontSize * 1.3;
  const w = fontSize * 1.38;
  const [pair, setPair] = useState({ cur: value, prev: value });
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (value === pair.cur) return;
    setPair({ cur: value, prev: pair.cur });
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 450,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const topRotate = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', '-90deg', '-90deg'] });
  const bottomRotate = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['90deg', '90deg', '0deg'] });
  const topOpacity = anim.interpolate({ inputRange: [0, 0.5, 0.51, 1], outputRange: [1, 1, 0, 0] });
  const bottomOpacity = anim.interpolate({ inputRange: [0, 0.49, 0.5, 1], outputRange: [0, 0, 1, 1] });
  const halfProps = { h, w, fontSize, c };

  return (
    <View style={{ width: w, height: h, borderRadius: 16 * scale, overflow: 'hidden' }}>
      {/* static: new value on top, old value on bottom (until the flap lands) */}
      <Half value={pair.cur} part="top" {...halfProps} />
      <Half value={pair.prev} part="bottom" {...halfProps} />
      {/* top flap falls down showing the old value */}
      <Animated.View
        style={[
          styles.abs,
          {
            top: 0,
            opacity: topOpacity,
            transformOrigin: 'bottom',
            transform: [{ perspective: 800 }, { rotateX: topRotate }],
          },
        ]}
      >
        <Half value={pair.prev} part="top" {...halfProps} />
      </Animated.View>
      {/* bottom flap lands showing the new value */}
      <Animated.View
        style={[
          styles.abs,
          {
            top: h / 2,
            opacity: bottomOpacity,
            transformOrigin: 'top',
            transform: [{ perspective: 800 }, { rotateX: bottomRotate }],
          },
        ]}
      >
        <Half value={pair.cur} part="bottom" {...halfProps} />
      </Animated.View>
      {/* hinge line */}
      <View style={[styles.abs, { top: h / 2 - 1, height: 2, width: w, backgroundColor: c.bg, opacity: 0.9 }]} />
    </View>
  );
}

// ---------- Ring ----------

function RingClock({
  mm,
  ss,
  pct,
  accent,
  scale,
  c,
}: {
  mm: string;
  ss: string;
  pct: number;
  accent: string;
  scale: number;
  c: Palette;
}) {
  const size = 250 * scale;
  const stroke = 12 * scale;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.cardHigh} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={accent}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={circ * (1 - Math.min(1, Math.max(0, pct)))}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={[styles.digital, { color: c.text, fontSize: 64 * scale }]}>
          {mm}:{ss}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  abs: { position: 'absolute', left: 0 },
  flipDigits: { fontWeight: '700', textAlign: 'center', fontVariant: ['tabular-nums'] },
  colon: { marginHorizontal: 8, fontWeight: '300' },
  digital: { fontWeight: '200', fontVariant: ['tabular-nums'], letterSpacing: 2 },
  minimal: { fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: -4 },
  minimalSub: { fontWeight: '600', letterSpacing: 1, marginTop: -8 },
});
