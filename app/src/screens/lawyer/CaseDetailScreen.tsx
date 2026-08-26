import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { casesApi } from '../../services/api';
import { COLORS } from '../../theme/colors';

const TABS = ['Overview', 'Hearings', 'Documents', 'Timeline'] as const;
type Tab = typeof TABS[number];

const STATUS_COLOR: Record<string, string> = {
  OPEN: COLORS.success,
  IN_PROGRESS: COLORS.warning,
  HEARING_SCHEDULED: '#2563EB',
  CLOSED: COLORS.textMuted,
  STAYED: '#7C3AED',
  APPEALED: '#DB2777',
};

const HEARING_STATUS_COLOR: Record<string, string> = {
  SCHEDULED: '#2563EB',
  HELD: COLORS.success,
  ADJOURNED: COLORS.warning,
  CANCELLED: COLORS.error,
  PART_HEARD: '#D97706',
};

export default function CaseDetailScreen({ navigation, route }: any) {
  const { caseId } = route.params;
  const [caseData, setCaseData] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');

  const load = async () => {
    setLoading(true);
    try {
      const [caseRes, timelineRes] = await Promise.all([
        casesApi.getOne(caseId),
        casesApi.getTimeline(caseId),
      ]);
      setCaseData(caseRes.data);
      setTimeline(timelineRes.data);
    } catch (e: any) {
      Alert.alert('Error', 'Failed to load case');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, [caseId]));

  if (loading || !caseData) {
    return <ActivityIndicator style={{ flex: 1 }} color={COLORS.primary} />;
  }

  const renderOverview = () => (
    <View>
      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLOR[caseData.status] ?? COLORS.textMuted) + '20' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLOR[caseData.status] ?? COLORS.textMuted }]}>
            {caseData.status.replace(/_/g, ' ')}
          </Text>
        </View>
        <Text style={styles.caseType}>{caseData.caseType}</Text>
      </View>

      <InfoCard title="Case Details">
        <InfoRow icon="library-outline" label="Case Number" value={caseData.caseNumber} />
        <InfoRow icon="calendar-outline" label="Filing Date" value={caseData.filingDate ? new Date(caseData.filingDate).toLocaleDateString() : 'N/A'} />
        {caseData.firNumber && <InfoRow icon="alert-circle-outline" label="FIR Number" value={caseData.firNumber} />}
      </InfoCard>

      <InfoCard title="Court">
        <InfoRow icon="business-outline" label="Court" value={caseData.courtName ?? 'N/A'} />
        <InfoRow icon="location-outline" label="City" value={`${caseData.courtCity ?? ''}${caseData.courtProvince ? ` (${caseData.courtProvince})` : ''}`} />
        <InfoRow icon="scale-outline" label="Type" value={caseData.courtType} />
      </InfoCard>

      {(caseData.plaintiff?.name || caseData.defendant?.name) && (
        <InfoCard title="Parties">
          {caseData.plaintiff?.name && <InfoRow icon="person-outline" label="Plaintiff" value={`${caseData.plaintiff.name}${caseData.plaintiff.cnic ? ` (${caseData.plaintiff.cnic})` : ''}`} />}
          {caseData.defendant?.name && <InfoRow icon="person-outline" label="Defendant" value={`${caseData.defendant.name}${caseData.defendant.cnic ? ` (${caseData.defendant.cnic})` : ''}`} />}
        </InfoCard>
      )}

      {caseData.opposingCounsel?.name && (
        <InfoCard title="Opposing Counsel">
          <InfoRow icon="briefcase-outline" label="Counsel" value={caseData.opposingCounsel.name} />
          {caseData.opposingCounsel.firm && <InfoRow icon="business-outline" label="Firm" value={caseData.opposingCounsel.firm} />}
          {caseData.opposingCounsel.phone && <InfoRow icon="call-outline" label="Phone" value={caseData.opposingCounsel.phone} />}
        </InfoCard>
      )}

      {caseData.client && (
        <InfoCard title="Client">
          <InfoRow icon="person-circle-outline" label="Name" value={caseData.client.fullName} />
        </InfoCard>
      )}

      {caseData.notes && (
        <InfoCard title="Notes">
          <Text style={styles.notes}>{caseData.notes}</Text>
        </InfoCard>
      )}

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
          onPress={() => navigation.navigate('CreateCase', { caseData })}
        >
          <Icon name="create-outline" size={18} color={COLORS.white} />
          <Text style={styles.actionBtnText}>Edit Case</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#2563EB' }]}
          onPress={() => navigation.navigate('AddHearing', { caseId: caseData.id, caseTitle: caseData.title })}
        >
          <Icon name="hammer-outline" size={18} color={COLORS.white} />
          <Text style={styles.actionBtnText}>Add Hearing</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHearings = () => (
    <View>
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => navigation.navigate('AddHearing', { caseId: caseData.id, caseTitle: caseData.title })}
      >
        <Icon name="add-circle-outline" size={18} color={COLORS.accent} />
        <Text style={styles.addBtnText}>Schedule New Hearing</Text>
      </TouchableOpacity>
      {caseData.hearings?.length === 0 ? (
        <EmptyState icon="hammer-outline" message="No hearings yet" />
      ) : (
        caseData.hearings?.map((h: any) => (
          <TouchableOpacity
            key={h.id}
            style={styles.hearingCard}
            onPress={() => navigation.navigate('HearingOutcome', { hearingId: h.id, hearingData: h })}
          >
            <View style={styles.hearingLeft}>
              <Text style={styles.hearingDate}>{new Date(h.hearingDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
              {h.judge && <Text style={styles.hearingMeta}>Judge: {h.judge}</Text>}
              {h.courtRoom && <Text style={styles.hearingMeta}>Room: {h.courtRoom}</Text>}
              {h.outcome && <Text style={styles.hearingOutcome} numberOfLines={2}>{h.outcome}</Text>}
            </View>
            <View style={[styles.hearingStatus, { backgroundColor: (HEARING_STATUS_COLOR[h.status] ?? COLORS.textMuted) + '20' }]}>
              <Text style={[styles.hearingStatusText, { color: HEARING_STATUS_COLOR[h.status] ?? COLORS.textMuted }]}>{h.status}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const renderDocuments = () => (
    <View>
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => navigation.navigate('CaseDocuments', { caseId: caseData.id, caseTitle: caseData.title })}
      >
        <Icon name="folder-open-outline" size={18} color={COLORS.accent} />
        <Text style={styles.addBtnText}>Manage Documents</Text>
      </TouchableOpacity>
      {caseData.documents?.length === 0 ? (
        <EmptyState icon="document-outline" message="No documents yet" />
      ) : (
        caseData.documents?.slice(0, 5).map((d: any) => (
          <View key={d.id} style={styles.docItem}>
            <Icon name="document-text-outline" size={20} color={COLORS.accent} />
            <View style={styles.docInfo}>
              <Text style={styles.docTitle} numberOfLines={1}>{d.title}</Text>
              <Text style={styles.docMeta}>{d.category} {d.isSharedWithClient ? '· Shared' : ''}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderTimeline = () => (
    <View>
      {timeline.length === 0 ? (
        <EmptyState icon="time-outline" message="No timeline events yet" />
      ) : (
        timeline.map((event, idx) => (
          <View key={idx} style={styles.timelineItem}>
            <View style={styles.timelineDot}>
              <Icon
                name={event.type === 'HEARING' ? 'hammer-outline' : event.type === 'DOCUMENT' ? 'document-outline' : 'book-outline'}
                size={14}
                color={COLORS.white}
              />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineType}>{event.type}</Text>
              <Text style={styles.timelineTitle}>{event.data.title ?? event.data.outcome ?? 'Event'}</Text>
              <Text style={styles.timelineDate}>{new Date(event.date).toLocaleDateString()}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.caseNumber}>#{caseData.caseNumber}</Text>
          <Text style={styles.caseTitle}>{caseData.title}</Text>
          <View style={styles.countRow}>
            <CountBadge icon="hammer-outline" value={caseData._count?.hearings ?? 0} label="Hearings" />
            <CountBadge icon="document-outline" value={caseData._count?.documents ?? 0} label="Docs" />
            <CountBadge icon="book-outline" value={caseData._count?.diaryEntries ?? 0} label="Notes" />
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabContent}>
          {activeTab === 'Overview' && renderOverview()}
          {activeTab === 'Hearings' && renderHearings()}
          {activeTab === 'Documents' && renderDocuments()}
          {activeTab === 'Timeline' && renderTimeline()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoCardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Icon name={icon} size={15} color={COLORS.accent} style={styles.infoIcon} />
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function CountBadge({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <View style={styles.countBadge}>
      <Icon name={icon} size={14} color={COLORS.accentLight} />
      <Text style={styles.countValue}>{value}</Text>
      <Text style={styles.countLabel}>{label}</Text>
    </View>
  );
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <View style={styles.emptyState}>
      <Icon name={icon} size={40} color={COLORS.textMuted} />
      <Text style={styles.emptyStateText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, padding: 20, paddingTop: 16 },
  caseNumber: { fontSize: 12, color: COLORS.accent, fontWeight: '700', marginBottom: 4 },
  caseTitle: { fontSize: 18, color: COLORS.white, fontWeight: '700', marginBottom: 12 },
  countRow: { flexDirection: 'row', gap: 16 },
  countBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  countValue: { fontSize: 14, color: COLORS.white, fontWeight: '700' },
  countLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  caseType: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600', backgroundColor: COLORS.border, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: COLORS.accent },
  tabBtnText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  tabBtnTextActive: { color: COLORS.text, fontWeight: '700' },
  tabContent: { padding: 16 },
  infoCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  infoCardTitle: { fontSize: 12, fontWeight: '700', color: COLORS.accent, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  infoIcon: { marginRight: 6, marginTop: 1 },
  infoLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600', marginRight: 4, minWidth: 90 },
  infoValue: { fontSize: 13, color: COLORS.text, flex: 1 },
  notes: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10 },
  actionBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: COLORS.accentLight, borderRadius: 10, marginBottom: 12 },
  addBtnText: { color: COLORS.accent, fontWeight: '700', fontSize: 14 },
  hearingCard: { backgroundColor: COLORS.white, borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3 },
  hearingLeft: { flex: 1, marginRight: 8 },
  hearingDate: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  hearingMeta: { fontSize: 12, color: COLORS.textSecondary },
  hearingOutcome: { fontSize: 12, color: COLORS.textMuted, marginTop: 4, fontStyle: 'italic' },
  hearingStatus: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  hearingStatusText: { fontSize: 11, fontWeight: '700' },
  docItem: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.white, borderRadius: 10, padding: 12, marginBottom: 8, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3 },
  docInfo: { flex: 1 },
  docTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  docMeta: { fontSize: 12, color: COLORS.textMuted },
  timelineItem: { flexDirection: 'row', marginBottom: 16 },
  timelineDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 2 },
  timelineContent: { flex: 1, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 12 },
  timelineType: { fontSize: 11, color: COLORS.accent, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  timelineTitle: { fontSize: 14, color: COLORS.text, fontWeight: '600', marginTop: 2 },
  timelineDate: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyStateText: { fontSize: 14, color: COLORS.textMuted },
});
