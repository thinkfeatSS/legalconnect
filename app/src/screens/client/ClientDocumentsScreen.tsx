import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { documentsApi } from '../../services/api';
import { COLORS } from '../../theme/colors';

const TABS = ['Documents', 'Signature Requests'] as const;

export default function ClientDocumentsScreen({ navigation, route }: any) {
  const { caseId } = route.params ?? {};
  const [activeTab, setActiveTab] = useState<'Documents' | 'Signature Requests'>('Documents');
  const [docs, setDocs] = useState<any[]>([]);
  const [signRequests, setSignRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [docsRes, sigRes] = await Promise.all([
        caseId ? documentsApi.getByCaseId(caseId) : Promise.resolve({ data: [] }),
        documentsApi.getMySignatureRequests(),
      ]);
      setDocs(docsRes.data);
      setSignRequests(sigRes.data);
    } catch {}
    finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { load(); }, [caseId]));

  const STATUS_COLOR: Record<string, string> = {
    PENDING: COLORS.warning,
    SIGNED: COLORS.success,
    DECLINED: COLORS.error,
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={COLORS.primary} />
      ) : activeTab === 'Documents' ? (
        <FlatList
          data={docs}
          keyExtractor={(d) => String(d.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="document-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No shared documents</Text>
            </View>
          }
          renderItem={({ item: doc }) => (
            <TouchableOpacity
              style={styles.docCard}
              onPress={() => doc.fileUrl && Linking.openURL(doc.fileUrl)}
              activeOpacity={0.7}
            >
              <Icon name="document-text-outline" size={24} color={COLORS.accent} />
              <View style={styles.docInfo}>
                <Text style={styles.docTitle}>{doc.title}</Text>
                <Text style={styles.docMeta}>{doc.category?.replace(/_/g, ' ')} · {doc.fileType}</Text>
              </View>
              <Icon name="open-outline" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={signRequests}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="pencil-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No signature requests</Text>
            </View>
          }
          renderItem={({ item: req }) => (
            <TouchableOpacity
              style={styles.signCard}
              onPress={() => navigation.navigate('ESignatureRequest')}
              disabled={req.status !== 'PENDING'}
            >
              <View style={styles.signCardLeft}>
                <Text style={styles.signDocTitle}>{req.document?.title ?? 'Document'}</Text>
                <Text style={styles.signDocMeta}>{req.document?.category?.replace(/_/g, ' ')}</Text>
                <Text style={styles.signFrom}>From: {req.requestedBy?.email ?? 'Lawyer'}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLOR[req.status] ?? COLORS.textMuted) + '20' }]}>
                <Text style={[styles.statusText, { color: STATUS_COLOR[req.status] ?? COLORS.textMuted }]}>{req.status}</Text>
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
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.accent },
  tabText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  tabTextActive: { color: COLORS.text, fontWeight: '700' },
  list: { padding: 12, paddingBottom: 40 },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  docInfo: { flex: 1 },
  docTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  docMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  signCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  signCardLeft: { flex: 1, marginRight: 8 },
  signDocTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  signDocMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  signFrom: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 14, color: COLORS.textMuted },
});
