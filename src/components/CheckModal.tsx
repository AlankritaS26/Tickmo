// After each focus session: did you finish this session's goal?
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useApp, useColors, useStyles } from '../state/AppProvider';
import { Palette, RADIUS } from '../lib/theme';
import { Mo } from './Mo';

export function CheckModal() {
  const C = useColors();
  const styles = useStyles(makeStyles);
  const { pendingCheck, actions } = useApp();
  if (!pendingCheck) return null;
  return (
    <Modal transparent animationType="fade" visible statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Mo size={64} mood="happy" />
          <Text style={styles.title}>Session finished</Text>
          <Text style={styles.q}>Did you finish:</Text>
          <Text style={styles.goal}>{pendingCheck.goal}</Text>
          <Pressable style={[styles.btn, { backgroundColor: C.break }]} onPress={() => actions.answerCheck('done')}>
            <Text style={styles.btnText}>Done</Text>
          </Pressable>
          <Pressable style={[styles.btn, { backgroundColor: C.gold }]} onPress={() => actions.answerCheck('partly')}>
            <Text style={[styles.btnText, { color: '#1A1D24' }]}>Partly</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.outline]} onPress={() => actions.answerCheck('not_done')}>
            <Text style={[styles.btnText, { color: C.muted }]}>Not done</Text>
          </Pressable>
          <Text style={styles.hint}>Unfinished goals move to your next session automatically.</Text>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 },
    sheet: { backgroundColor: c.card, borderRadius: RADIUS.card, padding: 24, alignItems: 'center' },
    title: { color: c.text, fontSize: 22, fontWeight: '800', marginTop: 12 },
    q: { color: c.muted, fontSize: 15, marginTop: 12 },
    goal: { color: c.text, fontSize: 18, fontWeight: '600', textAlign: 'center', marginTop: 6, marginBottom: 18 },
    btn: { width: '100%', paddingVertical: 14, borderRadius: RADIUS.pill, alignItems: 'center', marginTop: 10 },
    outline: { borderWidth: 1, borderColor: c.cardHigh },
    btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    hint: { color: c.muted, fontSize: 12, marginTop: 14, textAlign: 'center' },
  });
