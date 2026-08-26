import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DocumentPicker from 'react-native-document-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import { documentsApi } from '../../services/api';
import { COLORS } from '../../theme/colors';

const CATEGORIES = ['PETITION', 'AFFIDAVIT', 'EVIDENCE', 'CONTRACT', 'COURT_ORDER', 'FIR', 'BAIL_ORDER', 'JUDGMENT', 'POWER_OF_ATTORNEY', 'VAKALATNAMA', 'OTHER'];

const CATEGORY_COLOR: Record<string, string> = {
  PETITION: '#2563EB',
  AFFIDAVIT: '#7C3AED',
  EVIDENCE: COLORS.error,
  CONTRACT: COLORS.success,
  COURT_ORDER: COLORS.warning,
  FIR: '#DC2626',
  BAIL_ORDER: '#D97706',
  JUDGMENT: '#111111',
  POWER_OF_ATTORNEY: '#0891B2',
  VAKALATNAMA: '#059669',
  OTHER: COLORS.textMuted,
};

export default function CaseDocumentsScreen({ navigation, route }: any) {
  const { caseId, caseTitle } = route.params;
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('OTHER');
  const [sigReqModalVisible, setSigReqModalVisible] = useState(false);
  const [sigReqDocId, setSigReqDocId] = useState<number | null>(null);
  const [sigReqUserId, setSigReqUserId] = useState('');
  const [sigReqSubmitting, setSigReqSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await documentsApi.getByCaseId(caseId);
      setDocs(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { load(); }, [caseId]));

  const handleUpload = async () => {
    try {
      const res = await DocumentPicker.pickSingle({ type: [DocumentPicker.types.allFiles] });
      setUploading(true);

      const formData = new FormData();
      formData.append('file', { uri: res.uri, name: res.name, type: res.type ?? 'application/octet-stream' } as any);

      await documentsApi.upload(caseId, res.name ?? 'Document', selectedCategory, formData);
      Alert.alert('Success', 'Document uploaded');
      load();
    } catch (e: any) {
      if (!DocumentPicker.isCancel(e)) {
        Alert.alert('Error', e?.response?.data?.message ?? 'Upload failed');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleToggleShare = async (docId: number, currentShared: boolean) => {
    try {
      await documentsApi.toggleShare(docId);
      setDocs((prev) => prev.map((d) => d.id === docId ? { ...d, isSharedWithClient: !currentShared } : d));
    } catch {
      Alert.alert('Error', 'Failed to toggle share');
    }
  };

  const handleRequestSignature = (docId: number) => {
    setSigReqDocId(docId);
    setSigReqUserId('');
    setSigReqModalVisible(true);
  };

  const handleSubmitSignatureRequest = async () => {
    const uid = parseInt(sigReqUserId, 10);
    if (!sigReqUserId.trim() || isNaN(uid)) {
      Alert.alert('Validation', 'Please enter a valid numeric User ID');
      return;
    }
    setSigReqSubmitting(true);
    try {
      await documentsApi.requestSignature(sigReqDocId!, { requestedToUserId: uid });
      setSigReqModalVisible(false);
      Alert.alert('Success', 'Signature request sent');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to send request');
    } finally {
      setSigReqSubmitting(false);
    }
  };

  const handleDelete = async (docId: number) => {
    Alert.alert('Delete', 'Remove this document?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await documentsApi.remove(docId);
            setDocs((prev) => prev.filter((d) => d.id !== docId));
          } catch {
            Alert.alert('Error', 'Delete failed');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Category picker */}
      <View style={styles.topBar}>
        <Text style={styles.topBarLabel}>Upload as:</Text>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(c) => c}
          style={styles.categoryList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.catChip, selectedCategory === item && styles.catChipActive]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text style={[styles.catChipText, selectedCategory === item && styles.catChipTextActive]}>
                {item.replace(/_/g, ' ')}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1, marginTop: 40 }} color={COLORS.primary} />
      ) : (
        <FlatList
          data={docs}
          keyExtractor={(d) => String(d.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="folder-open-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No documents yet</Text>
              <Text style={styles.emptySubText}>Tap + to upload</Text>
            </View>
          }
          renderItem={({ item: doc }) => (
            <View style={styles.docCard}>
              <View style={[styles.categoryBadge, { backgroundColor: (CATEGORY_COLOR[doc.category] ?? COLORS.textMuted) + '20' }]}>
                <Text style={[styles.categoryText, { color: CATEGORY_COLOR[doc.category] ?? COLORS.textMuted }]}>
                  {doc.category.replace(/_/g, ' ')}
                </Text>
              </View>
              <Text style={styles.docTitle}>{doc.title}</Text>
              {doc.description && <Text style={styles.docDesc} numberOfLines={2}>{doc.description}</Text>}
              <Text style={styles.docMeta}>
                {doc.fileType} · {doc.fileSizeBytes ? `${Math.round(doc.fileSizeBytes / 1024)} KB` : 'Unknown size'}
              </Text>

              <View style={styles.docActions}>
                <TouchableOpacity
                  style={[styles.docBtn, { backgroundColor: doc.isSharedWithClient ? COLORS.success + '20' : COLORS.border }]}
                  onPress={() => handleToggleShare(doc.id, doc.isSharedWithClient)}
                >
                  <Icon name={doc.isSharedWithClient ? 'eye' : 'eye-off-outline'} size={14} color={doc.isSharedWithClient ? COLORS.success : COLORS.textSecondary} />
                  <Text style={[styles.docBtnText, { color: doc.isSharedWithClient ? COLORS.success : COLORS.textSecondary }]}>
                    {doc.isSharedWithClient ? 'Shared' : 'Private'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.docBtn, { backgroundColor: COLORS.accent + '20' }]}
                  onPress={() => handleRequestSignature(doc.id)}
                >
                  <Icon name="pencil-outline" size={14} color={COLORS.accent} />
                  <Text style={[styles.docBtnText, { color: COLORS.accent }]}>Sign</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.docBtn, { backgroundColor: COLORS.error + '15' }]}
                  onPress={() => handleDelete(doc.id)}
                >
                  <Icon name="trash-outline" size={14} color={COLORS.error} />
                  <Text style={[styles.docBtnText, { color: COLORS.error }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Upload FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleUpload} disabled={uploading}>
        {uploading
          ? <ActivityIndicator color={COLORS.white} />
          : <Icon name="cloud-upload-outline" size={24} color={COLORS.white} />}
      </TouchableOpacity>

      {/* Signature Request Modal */}
      <Modal
        visible={sigReqModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSigReqModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Request Signature</Text>
            <Text style={styles.modalLabel}>Enter the User ID of the person to sign:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="User ID (number)"
              placeholderTextColor={COLORS.textMuted}
              value={sigReqUserId}
              onChangeText={setSigReqUserId}
              keyboardType="numeric"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => { setSigReqModalVisible(false); setSigReqUserId(''); }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, sigReqSubmitting && { opacity: 0.6 }]}
                onPress={handleSubmitSignatureRequest}
                disabled={sigReqSubmitting}
              >
                {sigReqSubmitting
                  ? <ActivityIndicator color={COLORS.white} size="small" />
                  : <Text style={styles.modalConfirmText}>Send Request</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  topBarLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, marginBottom: 6, textTransform: 'uppercase' },
  categoryList: { maxHeight: 40 },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.border,
    marginRight: 6,
  },
  catChipActive: { backgroundColor: COLORS.primary },
  catChipText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  catChipTextActive: { color: COLORS.white },
  list: { padding: 12, paddingBottom: 90 },
  docCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 5,
  },
  categoryBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 6 },
  categoryText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  docTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  docDesc: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  docMeta: { fontSize: 11, color: COLORS.textMuted, marginBottom: 10 },
  docActions: { flexDirection: 'row', gap: 8 },
  docBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  docBtnText: { fontSize: 12, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  emptySubText: { fontSize: 13, color: COLORS.textMuted },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalBox: { backgroundColor: COLORS.white, borderRadius: 16, padding: 20, width: '100%' },
  modalTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  modalLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 },
  modalInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 15, color: COLORS.text, marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  modalCancelText: { color: COLORS.textSecondary, fontWeight: '600' },
  modalConfirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center' },
  modalConfirmText: { color: COLORS.white, fontWeight: '700' },
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
