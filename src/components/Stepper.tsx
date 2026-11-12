import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors, useStyles } from '../state/AppProvider';
import { Palette } from '../lib/theme';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
}

export function Stepper({ label, value, min, max, step = 1, suffix = '', onChange }: Props) {
  const C = useColors();
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <Pressable style={styles.btn} onPress={() => onChange(Math.max(min, value - step))} hitSlop={8}>
          <Text style={styles.btnText}>−</Text>
        </Pressable>
        <Text style={styles.value}>
          {value}
          {suffix}
        </Text>
        <Pressable style={styles.btn} onPress={() => onChange(Math.min(max, value + step))} hitSlop={8}>
          <Text style={styles.btnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
    label: { color: c.text, fontSize: 16 },
    controls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    btn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.cardHigh,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnText: { color: c.text, fontSize: 20, fontWeight: '600' },
    value: { color: c.text, fontSize: 16, fontWeight: '700', minWidth: 56, textAlign: 'center' },
  });
