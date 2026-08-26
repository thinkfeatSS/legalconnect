import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { casesApi } from '../../services/api';
import { COLORS } from '../../theme/colors';

const STATUS_TABS = ['ALL', 'OPEN', 'IN_PROGRESS', 'HEARING_SCHEDULED', 'CLOSED'] as const;
type StatusTab = typeof STATUS_TABS[number];

const STATUS_COLOR: Record<string, string> = {
  OPEN: COLORS.success,
  IN_PROGRESS: COLORS.warning,
  HEARING_SCHEDULED: '#2563EB',
  CLOSED: COLORS.textMuted,
  STAYED: '#7C3AED',
  APPEALED: '#DB2777',
};

export default function CasesScreen({ navigation }: any) {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StatusTab>('ALL');
  const [search, setSearch] = useState('');

  const load = async (status?: string) => {
    setLoading(true);
    try {
      const res = await casesApi.getAll(status && status !== 'ALL' ? { status } : {});
      setCases(res.data.items ?? []);
    } catch {}
    finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { load(activeTab); }, [activeTab]));

  const filtered = search.trim()
    ? cases.filter((c) =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.caseNumber.toLowerCase().includes(search.toLowerCase()),
      )
    : cases;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Search */}
      <View style={styles.searchRow}>
        <Icon name="search-outline" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title or case number..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Status tabs */}
      <FlatList
        data={STATUS_TABS as unknown as string[]}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(t) => t}
        style={styles.tabList}
        renderItem={({ item: tab }) => (
          <TouchableOpacity
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab as StatusTab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <ActivityIndicator style={{ flex: 1, marginTop: 40 }} color={COLORS.primary} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={styles.list}
          windowSize={7}
          maxToRenderPerBatch={8}
          initialNumToRender={10}
          removeClippedSubviews
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="briefcase-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No cases found</Text>
              <Text style={styles.emptySubText}>Tap + to add your first case</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('CaseDetail', { caseId: item.id, caseTitle: item.title })}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardLeft}>
                  <Text style={styles.caseNumber}>#{item.caseNumber}</Text>
                  <Text style={styles.caseTitle} numberOfLines={1}>{item.title}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLOR[item.status] ?? COLORS.textMuted) + '20' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] ?? COLORS.textMuted }]}>
                    {item.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>
              <View style={styles.cardMeta}>
                <View style={styles.metaItem}>
                  <Icon name="library-outline" size={13} color={COLORS.textMuted} />
                  <Text style={styles.metaText}>{item.caseType}</Text>
                </View>
                {item.client && (
                  <View style={styles.metaItem}>
                    <Icon name="person-outline" size={13} color={COLORS.textMuted} />
                    <Text style={styles.metaText}>{item.client.fullName}</Text>
                  </View>
                )}
                <View style={styles.metaItem}>
                  <Icon name="document-outline" size={13} color={COLORS.textMuted} />
                  <Text style={styles.metaText}>{item._count?.hearings ?? 0} hearings</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateCase')}
      >
        <Icon name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    margin: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 42, color: COLORS.text, fontSize: 14 },
  tabList: { paddingHorizontal: 12, marginBottom: 4, maxHeight: 44, flexGrow: 0 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  tabTextActive: { color: COLORS.white },
  list: { padding: 12, paddingBottom: 100 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardLeft: { flex: 1, marginRight: 8 },
  caseNumber: { fontSize: 11, color: COLORS.accent, fontWeight: '700', marginBottom: 2 },
  caseTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 12, color: COLORS.textSecondary },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  emptySubText: { fontSize: 13, color: COLORS.textMuted },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
});
