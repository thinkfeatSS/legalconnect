import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { appointmentsApi } from '../../services/api';
import { COLORS } from '../../theme/colors';

const STATUS_COLORS: Record<string, string> = {
  PENDING: COLORS.warning, CONFIRMED: COLORS.primaryLight,
  COMPLETED: COLORS.success, CANCELLED: COLORS.textMuted,
};

export default function LawyerAppointmentsScreen({ navigation }: any) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await appointmentsApi.getLawyerAppointments();
      setAppointments(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleAction = (id: number, status: 'CONFIRMED' | 'CANCELLED') => {
    const label = status === 'CONFIRMED' ? 'Confirm' : 'Cancel';
    Alert.alert(`${label} Appointment`, `Are you sure?`, [
      { text: 'No', style: 'cancel' },
      { text: label, style: status === 'CANCELLED' ? 'destructive' : 'default', onPress: async () => {
        try {
          await appointmentsApi.updateStatus(id, { status });
          load();
        } catch {}
      }},
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Appointments</Text>
      {loading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 48 }} /> : (
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
                <Text style={styles.clientName}>{item.client?.fullName ?? 'Client'}</Text>
                <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] ?? COLORS.textMuted) + '25' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] ?? COLORS.textMuted }]}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.meta}>📅 {new Date(item.appointmentDate).toDateString()} at {item.startTime}</Text>
              <Text style={styles.meta}>{item.type === 'ONLINE' ? '💻 Online' : '🏢 Physical'}</Text>
              {item.status === 'PENDING' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.confirmBtn} onPress={() => handleAction(item.id, 'CONFIRMED')}>
                    <Text style={styles.confirmBtnText}>✓ Confirm</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleAction(item.id, 'CANCELLED')}>
                    <Text style={styles.rejectBtnText}>✗ Cancel</Text>
                  </TouchableOpacity>
                </View>
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
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text, padding: 16, letterSpacing: -0.3 },
  list: { padding: 14, gap: 12, paddingBottom: 32 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  clientName: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
  meta: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  confirmBtn: { flex: 1, backgroundColor: COLORS.success + '15', borderRadius: 12, padding: 11, alignItems: 'center', borderWidth: 1, borderColor: COLORS.success },
  confirmBtnText: { color: COLORS.success, fontWeight: '700' },
  rejectBtn: { flex: 1, backgroundColor: COLORS.error + '10', borderRadius: 12, padding: 11, alignItems: 'center', borderWidth: 1, borderColor: COLORS.error },
  rejectBtnText: { color: COLORS.error, fontWeight: '700' },
  empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 60, fontSize: 15 },
});
