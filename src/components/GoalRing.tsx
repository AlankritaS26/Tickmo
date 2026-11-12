import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useColors, useStyles } from '../state/AppProvider';
import { Palette } from '../lib/theme';

interface Props {
  value: number;
  max: number;
  size?: number;
  color?: string;
  label?: string;
}

export function GoalRing({ value, max, size = 84, color, label }: Props) {
  const C = useColors();
  const styles = useStyles(makeStyles);
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={C.cardHigh} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color ?? C.focus}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - pct)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={styles.value}>
          {value}/{max}
        </Text>
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    center: { alignItems: 'center', justifyContent: 'center' },
    value: { color: c.text, fontSize: 18, fontWeight: '700' },
    label: { color: c.muted, fontSize: 10, marginTop: 2 },
  });
