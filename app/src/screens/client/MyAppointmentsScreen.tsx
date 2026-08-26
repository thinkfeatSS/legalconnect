import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { appointmentsApi, reviewsApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../theme/colors';

const STATUS_COLORS: Record<string, string> = {
  PENDING: COLORS.warning, CONFIRMED: COLORS.primaryLight,
  COMPLETED: COLORS.success, CANCELLED: COLORS.textMuted,
};

export default function MyAppointmentsScreen() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewApptId, setReviewApptId] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = user?.role === 'CLIENT'
        ? await appointmentsApi.getMyAppointments()
        : await appointmentsApi.getLawyerAppointments();
      setAppointments(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleCancel = async (id: number) => {
    Alert.alert('Cancel Appointment', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
        try {
          await appointmentsApi.updateStatus(id, { status: 'CANCELLED' });
          load();
        } catch {}
      }},
    ]);
  };

  const handleLeaveReview = (apptId: number) => {
    setReviewApptId(apptId);
    setReviewRating(5);
    setReviewComment('');
    setReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewApptId) return;
    setReviewSubmitting(true);
    try {
      await reviewsApi.create({ appointmentId: reviewApptId, rating: reviewRating, comment: reviewComment.trim() || undefined });
      setReviewModal(false);
      Alert.alert('Thank you!', 'Your review has been submitted.');
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>My Appointments</Text>
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No appointments yet</Text>}
          refreshing={loading}
          onRefresh={load}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardName}>
                  {user?.role === 'CLIENT' ? item.lawyer?.fullName : item.client?.fullName}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] ?? COLORS.textMuted) + '20' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] ?? COLORS.textMuted }]}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.cardDate}>📅 {new Date(item.appointmentDate).toDateString()} at {item.startTime}</Text>
              <Text style={styles.cardType}>{item.type === 'ONLINE' ? '💻 Online' : '🏢 Physical'}</Text>
              {item.meetingLink && <Text style={styles.cardLink}>🔗 {item.meetingLink}</Text>}
              {item.status === 'PENDING' && (
                <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item.id)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              )}
              {item.status === 'COMPLETED' && !item.review && user?.role === 'CLIENT' && (
                <TouchableOpacity style={styles.reviewBtn} onPress={() => handleLeaveReview(item.id)}>
                  <Text style={styles.reviewBtnText}>⭐ Leave Review</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}

      <Modal visible={reviewModal} transparent animationType="slide" onRequestClose={() => setReviewModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Leave a Review</Text>
            <Text style={styles.modalLabel}>Rating</Text>
            <View style={styles.starsRow}>
              {[1,2,3,4,5].map((star) => (
                <TouchableOpacity key={star} style={styles.starBtn} onPress={() => setReviewRating(star)}>
                  <Text style={{ fontSize: 28, color: star <= reviewRating ? '#F59E0B' : COLORS.border }}>{star <= reviewRating ? '★' : '☆'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.modalLabel}>Comment (optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Share your experience..."
              placeholderTextColor={COLORS.textMuted}
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setReviewModal(false)} disabled={reviewSubmitting}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, reviewSubmitting && { opacity: 0.6 }]}
                onPress={handleSubmitReview}
                disabled={reviewSubmitting}
              >
                {reviewSubmitting
                  ? <ActivityIndicator color={COLORS.white} size="small" />
                  : <Text style={styles.modalConfirmText}>Submit</Text>}
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
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text, padding: 16, letterSpacing: -0.3 },
  list: { padding: 14, gap: 12, paddingBottom: 32 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardName: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
  cardDate: { fontSize: 13, color: COLORS.textSecondary },
  cardType: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  cardLink: { fontSize: 13, color: COLORS.accent, marginTop: 4, fontWeight: '600' },
  cancelBtn: { marginTop: 12, borderWidth: 1.5, borderColor: COLORS.error, borderRadius: 10, padding: 9, alignSelf: 'flex-start' },
  cancelBtnText: { color: COLORS.error, fontWeight: '700', fontSize: 13 },
  reviewBtn: { marginTop: 10, backgroundColor: COLORS.primary + '15', borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 10, padding: 9, alignSelf: 'flex-start' },
  reviewBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 60, fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 16, textAlign: 'center' },
  modalLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600', marginBottom: 8 },
  starsRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  starBtn: { padding: 2 },
  modalInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, fontSize: 14, color: COLORS.text, minHeight: 80, textAlignVertical: 'top', marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center' },
  modalCancelText: { color: COLORS.textSecondary, fontWeight: '700' },
  modalConfirmBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center' },
  modalConfirmText: { color: COLORS.white, fontWeight: '700' },
});
