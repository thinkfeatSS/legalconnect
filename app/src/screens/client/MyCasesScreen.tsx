import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { casesApi } from '../../services/api';
import { COLORS } from '../../theme/colors';

const STATUS_COLOR: Record<string, string> = {
  OPEN: COLORS.success,
  IN_PROGRESS: COLORS.warning,
  HEARING_SCHEDULED: '#2563EB',
  CLOSED: COLORS.textMuted,
  STAYED: '#7C3AED',
  APPEALED: '#DB2777',
};

export default function MyCasesScreen({ navigation }: any) {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await casesApi.getMyCases();
      setCases(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  return (
    <SafeAreaView style={styles.safe}>
      {loading ? (
        <ActivityIndicator style={{ flex: 1, marginTop: 40 }} color={COLORS.primary} />
      ) : (
        <FlatList
          data={cases}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={styles.list}
          windowSize={7}
          maxToRenderPerBatch={8}
          initialNumToRender={10}
          removeClippedSubviews
          ListHeaderComponent={<Text style={styles.header}>My Cases</Text>}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="folder-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No cases assigned</Text>
              <Text style={styles.emptySubText}>Your lawyer will add you to cases</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('ClientCaseDetail', { caseId: item.id })}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardLeft}>
                  <Text style={styles.caseNumber}>#{item.caseNumber}</Text>
                  <Text style={styles.caseTitle} numberOfLines={2}>{item.title}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: (STATUS_COLOR[item.status] ?? COLORS.textMuted) + '20' }]}>
                  <Text style={[styles.badgeText, { color: STATUS_COLOR[item.status] ?? COLORS.textMuted }]}>
                    {item.status.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Icon name="library-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{item.caseType}</Text>
                {item.lawyer && <>
                  <Icon name="person-outline" size={13} color={COLORS.textMuted} />
                  <Text style={styles.metaText}>{item.lawyer.fullName}</Text>
                </>}
              </View>

              {/* Next hearing */}
              {item.hearings?.find((h: any) => h.status === 'SCHEDULED') && (() => {
                const next = item.hearings.find((h: any) => h.status === 'SCHEDULED');
                return (
                  <View style={styles.hearingBanner}>
                    <Icon name="hammer-outline" size={13} color='#2563EB' />
                    <Text style={styles.hearingBannerText}>
                      Next hearing: {new Date(next.hearingDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                );
              })()}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { fontSize: 20, fontWeight: '800', color: COLORS.text, margin: 16, marginBottom: 8 },
  list: { paddingHorizontal: 12, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 5,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardLeft: { flex: 1, marginRight: 8 },
  caseNumber: { fontSize: 11, color: COLORS.accent, fontWeight: '700', marginBottom: 2 },
  caseTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  metaText: { fontSize: 12, color: COLORS.textSecondary },
  hearingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  hearingBannerText: { fontSize: 12, color: '#2563EB', fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  emptySubText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },
});
