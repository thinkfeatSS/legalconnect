import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { documentsApi } from '../../services/api';
import { COLORS } from '../../theme/colors';

export default function ESignatureRequestScreen({ navigation }: any) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [declineReason, setDeclineReason] = useState('');
  const [declineId, setDeclineId] = useState<number | null>(null);
  const [signingId, setSigningId] = useState<number | null>(null);
  const [signatureName, setSignatureName] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await documentsApi.getMySignatureRequests();
      setRequests(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleSign = async (requestId: number) => {
    if (!signatureName.trim()) {
      Alert.alert('Validation', 'Please type your full name to sign');
      return;
    }
    try {
      await documentsApi.sign(requestId, signatureName.trim());
      setSigningId(null);
      setSignatureName('');
      Alert.alert('Signed', 'Document signed successfully');
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to sign');
    }
  };

  const handleDecline = async (requestId: number) => {
    if (!declineReason.trim()) {
      Alert.alert('Validation', 'Please provide a reason for declining');
      return;
    }
    try {
      await documentsApi.decline(requestId, { reason: declineReason });
      setDeclineId(null);
      setDeclineReason('');
      Alert.alert('Done', 'Document signing declined');
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to decline');
    }
  };

  const STATUS_COLOR: Record<string, string> = {
    PENDING: COLORS.warning,
    SIGNED: COLORS.success,
    DECLINED: COLORS.error,
  };

  return (
    <SafeAreaView style={styles.safe}>
      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={COLORS.primary} />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="pencil-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No signature requests</Text>
            </View>
          }
          renderItem={({ item: req }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.docTitle}>{req.document?.title ?? 'Document'}</Text>
                  <Text style={styles.docCategory}>{req.document?.category?.replace(/_/g, ' ')}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLOR[req.status] ?? COLORS.textMuted) + '20' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLOR[req.status] ?? COLORS.textMuted }]}>{req.status}</Text>
                </View>
              </View>

              <Text style={styles.requestedBy}>
                <Icon name="person-outline" size={12} color={COLORS.textMuted} />
                {' '}Requested by: {req.requestedBy?.email ?? 'Unknown'}
              </Text>

              {req.status === 'PENDING' && (
                <>
                  {declineId === req.id ? (
                    <View style={styles.declineBox}>
                      <TextInput
                        style={styles.declineInput}
                        placeholder="Reason for declining..."
                        placeholderTextColor={COLORS.textMuted}
                        value={declineReason}
                        onChangeText={setDeclineReason}
                        multiline
                      />
                      <View style={styles.declineActions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => { setDeclineId(null); setDeclineReason(''); }}>
                          <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmDeclineBtn} onPress={() => handleDecline(req.id)}>
                          <Text style={styles.confirmDeclineBtnText}>Confirm Decline</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : signingId === req.id ? (
                    <View style={styles.declineBox}>
                      <Text style={styles.signNameLabel}>Type your full name as signature:</Text>
                      <TextInput
                        style={styles.declineInput}
                        placeholder="Full name (e.g. Ali Hassan)"
                        placeholderTextColor={COLORS.textMuted}
                        value={signatureName}
                        onChangeText={setSignatureName}
                        autoCapitalize="words"
                        autoFocus
                      />
                      <View style={styles.declineActions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => { setSigningId(null); setSignatureName(''); }}>
                          <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmDeclineBtn} onPress={() => handleSign(req.id)}
                          accessible accessibilityLabel="Confirm signature">
                          <Text style={styles.confirmDeclineBtnText}>Confirm Sign</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.signBtn}
                        onPress={() => { setDeclineId(null); setSigningId(req.id); }}
                      >
                        <Icon name="checkmark-circle-outline" size={18} color={COLORS.white} />
                        <Text style={styles.signBtnText}>Sign Document</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.declineBtn} onPress={() => setDeclineId(req.id)}>
                        <Icon name="close-circle-outline" size={18} color={COLORS.error} />
                        <Text style={styles.declineBtnText}>Decline</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}

              {req.status === 'SIGNED' && req.signedAt && (
                <Text style={styles.signedAt}>Signed on {new Date(req.signedAt).toLocaleDateString()}</Text>
              )}
              {req.status === 'DECLINED' && req.declinedReason && (
                <Text style={styles.declinedReason}>Reason: {req.declinedReason}</Text>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 12, paddingBottom: 40 },
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  docTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  docCategory: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  requestedBy: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 12 },
  actionRow: { flexDirection: 'row', gap: 10 },
  signBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.success,
    borderRadius: 10,
    paddingVertical: 10,
  },
  signBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  declineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.error + '60',
    backgroundColor: COLORS.error + '10',
  },
  declineBtnText: { color: COLORS.error, fontWeight: '700', fontSize: 14 },
  declineBox: { marginTop: 8 },
  declineInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: COLORS.text,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  declineActions: { flexDirection: 'row', gap: 8 },
  cancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cancelBtnText: { color: COLORS.textSecondary, fontWeight: '600' },
  confirmDeclineBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: COLORS.error, alignItems: 'center' },
  confirmDeclineBtnText: { color: COLORS.white, fontWeight: '700' },
  signedAt: { fontSize: 12, color: COLORS.success, fontWeight: '600', marginTop: 6 },
  declinedReason: { fontSize: 12, color: COLORS.error, fontStyle: 'italic', marginTop: 6 },
  signNameLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600', marginBottom: 6 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '700', color: COLORS.text },
});
