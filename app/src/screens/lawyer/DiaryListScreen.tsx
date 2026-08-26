import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { diaryApi } from '../../services/api';
import { COLORS } from '../../theme/colors';

const TYPE_ICONS: Record<string, string> = { CASE: '📁', HEARING: '🏛️', TASK: '✅', REMINDER: '🔔' };
const STATUS_COLORS: Record<string, string> = { OPEN: COLORS.primaryLight, IN_PROGRESS: COLORS.warning, COMPLETED: COLORS.success, ADJOURNED: COLORS.textMuted };

export default function DiaryListScreen({ navigation }: any) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await diaryApi.getEntries(activeType || undefined);
      setEntries(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { load(); }, [activeType]));

  const TYPES = ['', 'CASE', 'HEARING', 'TASK', 'REMINDER'];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Diary</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('DiaryEntry', {})}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {TYPES.map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, activeType === t && styles.tabActive]} onPress={() => setActiveType(t)}>
            <Text style={[styles.tabText, activeType === t && styles.tabTextActive]}>{t || 'All'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 48 }} /> : (
        <FlatList
          data={entries}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No diary entries yet</Text>}
          refreshing={loading}
          onRefresh={load}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('DiaryEntry', { entry: item })}>
              <View style={styles.cardLeft}>
                <Text style={styles.typeIcon}>{TYPE_ICONS[item.type] ?? '📋'}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.clientName && <Text style={styles.cardMeta}>👤 {item.clientName}</Text>}
                {item.hearingDate && <Text style={styles.cardMeta}>📅 {new Date(item.hearingDate).toDateString()}</Text>}
                {item.dueDate && <Text style={styles.cardMeta}>⏰ Due: {new Date(item.dueDate).toDateString()}</Text>}
              </View>
              <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] ?? COLORS.textMuted) + '20' }]}>
                <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] ?? COLORS.textMuted }]}>{item.status}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text, letterSpacing: -0.3 },
  addBtn: { backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 9 },
  addBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  tabs: { flexDirection: 'row', paddingHorizontal: 14, marginBottom: 8 },
  tab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8,
    backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border,
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '700' },
  tabTextActive: { color: COLORS.white },
  list: { padding: 14, gap: 12, paddingBottom: 32 },
  card: {
    flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 16,
    padding: 15, elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 2 },
    alignItems: 'flex-start',
  },
  cardLeft: { marginRight: 14, paddingTop: 2 },
  typeIcon: { fontSize: 26 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  cardMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16 },
  statusText: { fontSize: 11, fontWeight: '700' },
  empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 60, fontSize: 15 },
});
