import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { lawyersApi } from '../../services/api';
import { COLORS } from '../../theme/colors';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

type Slot = { dayOfWeek: string; startTime: string; endTime: string };

export default function AvailabilityScreen() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useFocusEffect(useCallback(() => {
    lawyersApi.getMyProfile().then((r) => {
      setSlots(r.data.availabilitySlots ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []));

  const isSelected = (day: string, time: string) =>
    slots.some((s) => s.dayOfWeek === day && s.startTime === time);

  const toggleSlot = (day: string, time: string) => {
    const exists = isSelected(day, time);
    if (exists) {
      setSlots((prev) => prev.filter((s) => !(s.dayOfWeek === day && s.startTime === time)));
    } else {
      const [h, m] = time.split(':').map(Number);
      const endHour = h + 1;
      const endTime = `${String(endHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      setSlots((prev) => [...prev, { dayOfWeek: day, startTime: time, endTime }]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await lawyersApi.setAvailability(slots);
      Alert.alert('Saved!', 'Availability updated successfully');
    } catch {
      Alert.alert('Error', 'Could not save availability');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={COLORS.primary} />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Set Availability</Text>
        <Text style={styles.subtitle}>Tap to toggle available 1-hour slots</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Header row */}
            <View style={styles.row}>
              <View style={styles.timeLabel} />
              {DAYS.map((d) => (
                <View key={d} style={styles.dayHeader}>
                  <Text style={styles.dayHeaderText}>{d}</Text>
                </View>
              ))}
            </View>
            {/* Time rows */}
            {TIME_SLOTS.map((time) => (
              <View key={time} style={styles.row}>
                <View style={styles.timeLabel}>
                  <Text style={styles.timeLabelText}>{time}</Text>
                </View>
                {DAYS.map((day) => {
                  const active = isSelected(day, time);
                  return (
                    <TouchableOpacity
                      key={day}
                      style={[styles.cell, active && styles.cellActive]}
                      onPress={() => toggleSlot(day, time)}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.countText}>{slots.length} slot{slots.length !== 1 ? 's' : ''} selected</Text>

        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveBtnText}>Save Availability</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const CELL_SIZE = 40;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center' },
  timeLabel: { width: 52 },
  timeLabelText: { fontSize: 11, color: COLORS.textMuted, textAlign: 'right', paddingRight: 6 },
  dayHeader: { width: CELL_SIZE + 4, alignItems: 'center', marginBottom: 4 },
  dayHeaderText: { fontSize: 11, fontWeight: '700', color: COLORS.text },
  cell: { width: CELL_SIZE, height: CELL_SIZE - 4, margin: 2, borderRadius: 6, backgroundColor: COLORS.border },
  cellActive: { backgroundColor: COLORS.primary },
  countText: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 16, fontSize: 13 },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 12 },
  saveBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
});
