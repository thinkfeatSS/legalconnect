import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  ActivityIndicator, TouchableOpacity, Alert,
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
};

export default function ClientCaseDetailScreen({ navigation, route }: any) {
  const { caseId } = route.params;
  const [caseData, setCaseData] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [caseRes, timelineRes] = await Promise.all([
        casesApi.getOne(caseId),
        casesApi.getTimeline(caseId),
      ]);
      setCaseData(caseRes.data);
      setTimeline(timelineRes.data);
    } catch {
      Alert.alert('Error', 'Failed to load case');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, [caseId]));

  if (loading || !caseData) {
    return <ActivityIndicator style={{ flex: 1 }} color={COLORS.primary} />;
  }

  const nextHearing = caseData.hearings?.find((h: any) => h.status === 'SCHEDULED');
  const sharedDocs = caseData.documents?.filter((d: any) => d.isSharedWithClient) ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.caseNumber}>#{caseData.caseNumber}</Text>
          <Text style={styles.caseTitle}>{caseData.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLOR[caseData.status] ?? COLORS.textMuted) + '30' }]}>
            <Text style={[styles.statusText, { color: STATUS_COLOR[caseData.status] ?? COLORS.textMuted }]}>
              {caseData.status.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Lawyer */}
          {caseData.lawyer && (
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>Your Lawyer</Text>
              <View style={styles.lawyerRow}>
                <View style={styles.lawyerAvatar}>
                  <Icon name="person" size={22} color={COLORS.white} />
                </View>
                <View>
                  <Text style={styles.lawyerName}>{caseData.lawyer.fullName}</Text>
                  <Text style={styles.lawyerMeta}>{caseData.lawyer.specialization ?? 'Attorney'}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Next Hearing */}
          {nextHearing && (
            <View style={[styles.infoCard, styles.hearingCard]}>
              <Text style={styles.infoCardTitle}>Next Hearing</Text>
              <View style={styles.hearingRow}>
                <Icon name="hammer-outline" size={20} color='#2563EB' />
                <View style={styles.hearingInfo}>
                  <Text style={styles.hearingDate}>
                    {new Date(nextHearing.hearingDate).toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </Text>
                  {nextHearing.courtRoom && <Text style={styles.hearingMeta}>Court Room: {nextHearing.courtRoom}</Text>}
                  {nextHearing.judge && <Text style={styles.hearingMeta}>Judge: {nextHearing.judge}</Text>}
                </View>
              </View>
            </View>
          )}

          {/* Court Info */}
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Court Information</Text>
            {caseData.courtName && <InfoRow icon="business-outline" label="Court" value={caseData.courtName} />}
            {caseData.courtCity && <InfoRow icon="location-outline" label="City" value={`${caseData.courtCity}, ${caseData.courtProvince ?? ''}`} />}
            <InfoRow icon="scale-outline" label="Type" value={caseData.caseType} />
          </View>

          {/* Shared Documents */}
          <View style={styles.infoCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.infoCardTitle}>Shared Documents ({sharedDocs.length})</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ClientDocuments', { caseId })}>
                <Text style={styles.viewAllLink}>View all →</Text>
              </TouchableOpacity>
            </View>
            {sharedDocs.length === 0
              ? <Text style={styles.noDocsText}>No documents shared yet</Text>
              : sharedDocs.slice(0, 3).map((doc: any) => (
                  <View key={doc.id} style={styles.docItem}>
                    <Icon name="document-text-outline" size={16} color={COLORS.accent} />
                    <Text style={styles.docName} numberOfLines={1}>{doc.title}</Text>
                    <Text style={styles.docCat}>{doc.category?.replace(/_/g, ' ')}</Text>
                  </View>
                ))}
          </View>

          {/* Timeline */}
          <Text style={styles.timelineTitle}>Case Timeline</Text>
          {timeline.length === 0 ? (
            <Text style={styles.noDocsText}>No timeline events yet</Text>
          ) : (
            timeline.map((ev, idx) => (
              <View key={ev.id ?? idx} style={styles.timelineItem}>
                <View style={styles.timelineDot}>
                  <Icon
                    name={ev.type === 'HEARING' ? 'hammer-outline' : ev.type === 'DOCUMENT' ? 'document-outline' : 'book-outline'}
                    size={12}
                    color={COLORS.white}
                  />
                </View>
                <View style={styles.timelineBody}>
                  <Text style={styles.timelineType}>{ev.type}</Text>
                  <Text style={styles.timelineText}>{ev.data.title ?? ev.data.outcome ?? 'Update'}</Text>
                  <Text style={styles.timelineDate}>{new Date(ev.date).toLocaleDateString()}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Icon name={icon} size={14} color={COLORS.accent} style={{ marginRight: 6 }} />
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, padding: 20 },
  caseNumber: { fontSize: 12, color: COLORS.accent, fontWeight: '700', marginBottom: 4 },
  caseTitle: { fontSize: 18, color: COLORS.white, fontWeight: '700', marginBottom: 10 },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  content: { padding: 16 },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  hearingCard: { borderLeftWidth: 4, borderLeftColor: '#2563EB' },
  infoCardTitle: { fontSize: 12, fontWeight: '700', color: COLORS.accent, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  lawyerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lawyerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  lawyerName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  lawyerMeta: { fontSize: 12, color: COLORS.textSecondary },
  hearingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  hearingInfo: { flex: 1 },
  hearingDate: { fontSize: 14, fontWeight: '700', color: '#2563EB' },
  hearingMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  infoLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600', marginRight: 4 },
  infoValue: { fontSize: 13, color: COLORS.text, flex: 1 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewAllLink: { fontSize: 12, color: COLORS.accent, fontWeight: '700' },
  noDocsText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', paddingVertical: 12 },
  docItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderTopWidth: 1, borderTopColor: COLORS.border },
  docName: { flex: 1, fontSize: 13, color: COLORS.text, fontWeight: '600' },
  docCat: { fontSize: 11, color: COLORS.textMuted },
  timelineTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  timelineItem: { flexDirection: 'row', marginBottom: 14 },
  timelineDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 2 },
  timelineBody: { flex: 1, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 10 },
  timelineType: { fontSize: 10, color: COLORS.accent, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  timelineText: { fontSize: 13, color: COLORS.text, fontWeight: '600', marginTop: 2 },
  timelineDate: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
});
