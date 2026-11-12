// Mo, the Tickmo mascot and logo: a little tick-mark buddy in the theme's accent colour.
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useColors } from '../state/AppProvider';

export type MoMood = 'happy' | 'focus' | 'sleepy' | 'party';

export function Mo({ size = 72, mood = 'happy', color }: { size?: number; mood?: MoMood; color?: string }) {
  const c = useColors();
  const body = color ?? c.focus;
  const eyesClosed = mood === 'sleepy';
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect x="8" y="12" width="84" height="80" rx="30" fill={body} />
      <Circle cx="24" cy="62" r="6" fill="#FFFFFF" opacity={0.18} />
      <Circle cx="76" cy="62" r="6" fill="#FFFFFF" opacity={0.18} />
      {eyesClosed ? (
        <>
          <Path d="M28 46 q8 6 16 0" stroke="#1A1D24" strokeWidth="4" fill="none" strokeLinecap="round" />
          <Path d="M56 46 q8 6 16 0" stroke="#1A1D24" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <Circle cx="36" cy="46" r={mood === 'focus' ? 5 : 7} fill="#1A1D24" />
          <Circle cx="64" cy="46" r={mood === 'focus' ? 5 : 7} fill="#1A1D24" />
          <Circle cx="38" cy="43" r="2" fill="#fff" />
          <Circle cx="66" cy="43" r="2" fill="#fff" />
        </>
      )}
      {/* the smile is a tick mark */}
      <Path
        d={mood === 'party' ? 'M36 64 L46 74 L68 56' : 'M38 66 L46 72 L64 60'}
        stroke="#fff"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {mood === 'party' ? <Path d="M38 16 L50 0 L62 16 Z" fill={c.gold} /> : null}
    </Svg>
  );
}

// Mo + the name, used as the logo in the header.
export function Logo({ size = 26 }: { size?: number }) {
  const c = useColors();
  return (
    <View style={styles.row}>
      <Mo size={size + 8} mood="happy" />
      <Text style={[styles.name, { color: c.text, fontSize: size }]}>
        Tick<Text style={{ color: c.focus }}>mo</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontWeight: '800', letterSpacing: -0.5 },
});
