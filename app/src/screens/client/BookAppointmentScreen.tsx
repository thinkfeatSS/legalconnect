import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { appointmentsApi } from '../../services/api';
import { COLORS } from '../../theme/colors';

const TIMES = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

export default function BookAppointmentScreen({ navigation, route }: any) {
  const { lawyerId, lawyerName } = route.params;
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [type, setType] = useState<'ONLINE' | 'PHYSICAL'>('PHYSICAL');
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Generate next 14 days
  const dates = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d.toISOString().split('T')[0];
  }), []);

  const loadSlots = async (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setLoading(true);
    try {
      const res = await appointmentsApi.getAvailableSlots(lawyerId, date);
      setAvailableSlots(res.data);
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedDate || !selectedSlot) {
      Alert.alert('Error', 'Please select a date and time slot');
      return;
    }
    setBookingLoading(true);
    try {
      await appointmentsApi.book({
        lawyerId,
        appointmentDate: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        type,
      });
      Alert.alert('Success! 🎉', 'Appointment request sent. The lawyer will confirm shortly.', [
        { text: 'View Appointments', onPress: () => navigation.navigate('Appointments') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message ?? 'Could not book appointment');
    } finally {
      setBookingLoading(false);
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return { day: date.toLocaleDateString('en', { weekday: 'short' }), date: date.getDate(), month: date.toLocaleDateString('en', { month: 'short' }) };
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
          {dates.map((d) => {
            const { day, date, month } = formatDate(d);
            const isSelected = d === selectedDate;
            return (
              <TouchableOpacity key={d} style={[styles.dateCard, isSelected && styles.dateCardActive]} onPress={() => loadSlots(d)}>
                <Text style={[styles.dateDay, isSelected && styles.dateTextActive]}>{day}</Text>
                <Text style={[styles.dateNum, isSelected && styles.dateTextActive]}>{date}</Text>
                <Text style={[styles.dateMon, isSelected && styles.dateTextActive]}>{month}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {selectedDate && (
          <>
            <Text style={styles.sectionTitle}>Available Slots</Text>
            {loading ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : availableSlots.length === 0 ? (
              <Text style={styles.noSlots}>No slots available for this date</Text>
            ) : (
              <View style={styles.slotsGrid}>
                {availableSlots.map((slot) => (
                  <TouchableOpacity key={slot.id} style={[styles.slot, selectedSlot?.id === slot.id && styles.slotActive]} onPress={() => setSelectedSlot(slot)}>
                    <Text style={[styles.slotText, selectedSlot?.id === slot.id && styles.slotTextActive]}>{slot.startTime}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.sectionTitle}>Appointment Type</Text>
            <View style={styles.typeRow}>
              {(['PHYSICAL', 'ONLINE'] as const).map((t) => (
                <TouchableOpacity key={t} style={[styles.typeBtn, type === t && styles.typeBtnActive]} onPress={() => setType(t)}>
                  <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>{t === 'PHYSICAL' ? '🏢 Physical' : '💻 Online'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.bookBtn, (!selectedSlot || bookingLoading) && styles.bookBtnDisabled]} onPress={handleBook} disabled={!selectedSlot || bookingLoading}>
              {bookingLoading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.bookBtnText}>Confirm Booking</Text>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 20, marginBottom: 12 },
  dateScroll: { marginBottom: 8 },
  dateCard: {
    width: 58, alignItems: 'center', padding: 12, borderRadius: 14,
    backgroundColor: COLORS.white, marginRight: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  dateCardActive: { backgroundColor: COLORS.primary },
  dateDay: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  dateNum: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginVertical: 2 },
  dateMon: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  dateTextActive: { color: COLORS.white },
  noSlots: { color: COLORS.textMuted, textAlign: 'center', padding: 20, fontSize: 14 },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slot: {
    paddingHorizontal: 20, paddingVertical: 11, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white,
  },
  slotActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  slotText: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  slotTextActive: { color: COLORS.white },
  typeRow: { flexDirection: 'row', gap: 12 },
  typeBtn: {
    flex: 1, padding: 15, borderRadius: 14,
    borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', backgroundColor: COLORS.white,
  },
  typeBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  typeBtnText: { fontWeight: '700', color: COLORS.textSecondary, fontSize: 14 },
  typeBtnTextActive: { color: COLORS.white },
  bookBtn: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 17, alignItems: 'center', marginTop: 28 },
  bookBtnDisabled: { opacity: 0.4 },
  bookBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
});
