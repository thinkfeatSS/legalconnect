import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TextInput, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { hearingsApi } from '../../services/api';
import { COLORS } from '../../theme/colors';
import Icon from 'react-native-vector-icons/Ionicons';

export default function AddHearingScreen({ navigation, route }: any) {
  const { caseId, caseTitle } = route.params;

  const [form, setForm] = useState({
    hearingDate: '',
    hearingTime: '10:00',
    courtRoom: '',
    judge: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.hearingDate.trim()) {
      Alert.alert('Validation', 'Hearing date is required (YYYY-MM-DD)');
      return;
    }

    const dateTimeStr = `${form.hearingDate}T${form.hearingTime}:00.000Z`;

    setSaving(true);
    try {
      await hearingsApi.create({
        caseId,
        hearingDate: dateTimeStr,
        courtRoom: form.courtRoom || undefined,
        judge: form.judge || undefined,
      });
      Alert.alert('Success', 'Hearing scheduled successfully');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to schedule hearing');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.caseBox}>
          <Icon name="briefcase-outline" size={16} color={COLORS.accent} />
          <Text style={styles.caseName} numberOfLines={1}>{caseTitle}</Text>
        </View>

        <Text style={styles.label}>Hearing Date * (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 2026-06-15"
          placeholderTextColor={COLORS.textMuted}
          value={form.hearingDate}
          onChangeText={(v) => set('hearingDate', v)}
        />

        <Text style={styles.label}>Time (HH:MM)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 10:30"
          placeholderTextColor={COLORS.textMuted}
          value={form.hearingTime}
          onChangeText={(v) => set('hearingTime', v)}
        />

        <Text style={styles.label}>Court Room</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Room 4 / Court Hall 2"
          placeholderTextColor={COLORS.textMuted}
          value={form.courtRoom}
          onChangeText={(v) => set('courtRoom', v)}
        />

        <Text style={styles.label}>Judge Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Honourable Justice Imran Shah"
          placeholderTextColor={COLORS.textMuted}
          value={form.judge}
          onChangeText={(v) => set('judge', v)}
        />

        <TouchableOpacity
          style={[styles.submitBtn, saving && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.submitText}>Schedule Hearing</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 20, paddingBottom: 40 },
  caseBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.accentLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  caseName: { fontSize: 14, color: COLORS.accent, fontWeight: '700', flex: 1 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 14,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  submitText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
});
