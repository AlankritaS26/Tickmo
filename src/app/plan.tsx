// Plan tab: today's target + what you'll do in each session.
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useApp, useColors, useStyles } from '../state/AppProvider';
import { DEFAULT_TAGS, PlanItem, currentItem, finishEstimate, unfinishedBefore } from '../lib/plan';
import { timeOf } from '../lib/dates';
import { tagColor } from '../lib/theme';
import { Stepper } from '../components/Stepper';
import { Palette, RADIUS } from '../lib/theme';

const statusOf = (C: Palette): Record<PlanItem['status'], { label: string; color: string }> => ({
  pending: { label: 'To do', color: C.muted },
  partly: { label: 'Partly', color: C.gold },
  done: { label: 'Done', color: C.break },
});

export default function PlanScreen() {
  const C = useColors();
  const styles = useStyles(makeStyles);
  const { plans, today, settings, actions } = useApp();
  const plan = plans[today];
  const items = plan?.items ?? [];
  const now = currentItem(plan);
  const leftover = unfinishedBefore(plans, today);
  const eta = finishEstimate(items, settings.durations.focus, settings.durations.short);
  const totalSessions = eta.sessions;

  const [target, setTarget] = useState(plan?.target ?? '');
  const [title, setTitle] = useState('');
  const [estimate, setEstimate] = useState(1);
  const [tag, setTag] = useState<string | undefined>(undefined);

  // keep the box in sync after loading or when the day changes
  const savedTarget = plan?.target ?? '';
  useEffect(() => setTarget(savedTarget), [savedTarget]);

  const add = () => {
    if (!title.trim()) return;
    actions.addItem(title, estimate, tag);
    setTitle('');
    setEstimate(1);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.h1}>Today's plan</Text>

          <Text style={styles.label}>DAILY TARGET</Text>
          <TextInput
            style={styles.input}
            value={target}
            onChangeText={setTarget}
            onEndEditing={() => actions.setTarget(target)}
            onBlur={() => actions.setTarget(target)}
            placeholder="e.g. Finish OS Module 3 + 10 DSA problems"
            placeholderTextColor={C.muted}
          />

          {leftover ? (
            <Pressable style={styles.carry} onPress={actions.carryOver}>
              <Ionicons name="arrow-redo-outline" size={18} color={C.gold} />
              <Text style={styles.carryText}>
                Bring {leftover.items.length} unfinished item{leftover.items.length > 1 ? 's' : ''} from {leftover.day}
              </Text>
            </Pressable>
          ) : null}

          <Text style={styles.label}>ADD A SESSION GOAL</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              onSubmitEditing={add}
              returnKeyType="done"
              placeholder="e.g. Process scheduling notes"
              placeholderTextColor={C.muted}
            />
            <Text style={styles.small}>Subject</Text>
            <View style={styles.tags}>
              {DEFAULT_TAGS.map((t) => {
                const on = tag === t;
                const col = tagColor(t);
                return (
                  <Pressable
                    key={t}
                    onPress={() => setTag(on ? undefined : t)}
                    style={[styles.tag, { borderColor: col }, on && { backgroundColor: col }]}
                  >
                    <Text style={[styles.tagText, { color: on ? '#111' : col }]}>{t}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Stepper label="Sessions needed" value={estimate} min={1} max={8} onChange={setEstimate} />
            <Pressable style={[styles.addBtn, !title.trim() && { opacity: 0.5 }]} onPress={add}>
              <Text style={styles.addText}>Add to plan</Text>
            </Pressable>
          </View>

          <View style={styles.listHeader}>
            <Text style={styles.label}>SESSIONS ({items.length})</Text>
            <Text style={styles.meta}>
              {totalSessions ? `~${totalSessions} Pomodoros left · done by ~${timeOf(eta.at)}` : 'All done'}
            </Text>
          </View>

          {items.length === 0 ? (
            <Text style={styles.empty}>
              No plan yet. Add what you'll do in each session, then press Start on the Timer tab.
            </Text>
          ) : null}

          {items.map((item, idx) => {
            const st = statusOf(C)[item.status];
            const isNow = now?.id === item.id;
            return (
              <View key={item.id} style={[styles.item, isNow && styles.itemNow]}>
                <Pressable onPress={() => actions.toggleDone(item.id)} hitSlop={8}>
                  <Ionicons
                    name={item.status === 'done' ? 'checkmark-circle' : 'ellipse-outline'}
                    size={26}
                    color={item.status === 'done' ? C.break : C.muted}
                  />
                </Pressable>
                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    {item.tag ? (
                      <View style={[styles.pill, { backgroundColor: tagColor(item.tag) }]}>
                        <Text style={styles.pillText}>{item.tag}</Text>
                      </View>
                    ) : null}
                    <Text style={[styles.itemTitle, item.status === 'done' && styles.doneText]} numberOfLines={2}>
                      {item.title}
                    </Text>
                  </View>
                  <Text style={styles.itemMeta}>
                    <Text style={{ color: st.color }}>{st.label}</Text> · {item.used}/{item.estimate} sessions
                    {isNow ? ' · next up' : ''}
                    {item.carried ? ' · carried over' : ''}
                  </Text>
                </View>
                <View style={styles.itemActions}>
                  <Pressable onPress={() => actions.moveItem(item.id, -1)} disabled={idx === 0} hitSlop={6}>
                    <Ionicons name="chevron-up" size={20} color={idx === 0 ? C.cardHigh : C.muted} />
                  </Pressable>
                  <Pressable
                    onPress={() => actions.moveItem(item.id, 1)}
                    disabled={idx === items.length - 1}
                    hitSlop={6}
                  >
                    <Ionicons name="chevron-down" size={20} color={idx === items.length - 1 ? C.cardHigh : C.muted} />
                  </Pressable>
                  <Pressable onPress={() => actions.removeItem(item.id)} hitSlop={6}>
                    <Ionicons name="trash-outline" size={18} color={C.danger} />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { padding: 20, paddingBottom: 40 },
    h1: { color: c.text, fontSize: 26, fontWeight: '800', marginBottom: 12 },
    label: { color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 18, marginBottom: 8 },
    input: {
      backgroundColor: c.cardHigh,
      color: c.text,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
    },
    card: { backgroundColor: c.card, borderRadius: RADIUS.card, padding: 14 },
    addBtn: {
      backgroundColor: c.focus,
      borderRadius: RADIUS.pill,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 6,
    },
    addText: { color: c.onAccent, fontSize: 16, fontWeight: '700' },
    carry: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 14,
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.gold,
    },
    carryText: { color: c.gold, fontSize: 14, flex: 1 },
    listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    meta: { color: c.muted, fontSize: 12, marginBottom: 8 },
    empty: { color: c.muted, fontSize: 14, lineHeight: 20 },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: c.card,
    },
    itemNow: { borderColor: c.focus },
    itemTitle: { color: c.text, fontSize: 16, fontWeight: '600' },
    doneText: { color: c.muted, textDecorationLine: 'line-through' },
    itemMeta: { color: c.muted, fontSize: 12, marginTop: 4 },
    small: { color: c.muted, fontSize: 13, marginTop: 12, marginBottom: 6 },
    tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: { borderWidth: 1, borderRadius: RADIUS.pill, paddingHorizontal: 12, paddingVertical: 6 },
    tagText: { fontSize: 13, fontWeight: '700' },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    pill: { borderRadius: RADIUS.pill, paddingHorizontal: 8, paddingVertical: 2 },
    pillText: { color: '#111', fontSize: 11, fontWeight: '800' },
    itemActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  });
