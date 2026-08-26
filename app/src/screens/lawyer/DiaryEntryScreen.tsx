import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert, ActivityIndicator, Switch } from 'react-native';
import { diaryApi } from '../../services/api';
import { COLORS } from '../../theme/colors';

const TYPES = ['CASE', 'HEARING', 'TASK', 'REMINDER'];
const STATUSES = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'ADJOURNED'];

export default function DiaryEntryScreen({ navigation, route }: any) {
  const existing = route.params?.entry;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [type, setType] = useState(existing?.type ?? 'CASE');
  const [status, setStatus] = useState(existing?.status ?? 'OPEN');
  const [content, setContent] = useState(existing?.content ?? '');
  const [clientName, setClientName] = useState(existing?.clientName ?? '');
  const [courtName, setCourtName] = useState(existing?.courtName ?? '');
  const [hearingDate, setHearingDate] = useState(existing?.hearingDate ? existing.hearingDate.split('T')[0] : '');
  const [dueDate, setDueDate] = useState(existing?.dueDate ? existing.dueDate.split('T')[0] : '');
  const [syncCalendar, setSyncCalendar] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Validation', 'Title is required'); return; }
    setLoading(true);
    try {
      const payload = {
        title: title.trim(), type, status, content: content.trim(),
        clientName: clientName.trim() || undefined,
        courtName: courtName.trim() || undefined,
        hearingDate: hearingDate || undefined,
        dueDate: dueDate || undefined,
        syncCalendar,
      };
      if (existing) {
        await diaryApi.updateEntry(existing.id, payload);
      } else {
        await diaryApi.createEntry(payload);
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message ?? 'Could not save entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete', 'Delete this diary entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await diaryApi.deleteEntry(existing.id);
        navigation.goBack();
      }},
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <TextInput style={styles.titleInput} value={title} onChangeText={setTitle} placeholder="Entry title..." placeholderTextColor={COLORS.textMuted} />

        <Text style={styles.label}>Type</Text>
        <View style={styles.chips}>
          {TYPES.map((t) => (
            <TouchableOpacity key={t} style={[styles.chip, type === t && styles.chipActive]} onPress={() => setType(t)}>
              <Text style={[styles.chipText, type === t && styles.chipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Status</Text>
        <View style={styles.chips}>
          {STATUSES.map((s) => (
            <TouchableOpacity key={s} style={[styles.chip, status === s && styles.chipActive]} onPress={() => setStatus(s)}>
              <Text style={[styles.chipText, status === s && styles.chipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Client Name (optional)</Text>
        <TextInput style={styles.input} value={clientName} onChangeText={setClientName} placeholder="Client name" placeholderTextColor={COLORS.textMuted} />

        {type === 'HEARING' && (
          <>
            <Text style={styles.label}>Court Name</Text>
            <TextInput style={styles.input} value={courtName} onChangeText={setCourtName} placeholder="Court name" placeholderTextColor={COLORS.textMuted} />
            <Text style={styles.label}>Hearing Date (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={hearingDate} onChangeText={setHearingDate} placeholder="2025-07-10" placeholderTextColor={COLORS.textMuted} />
            <View style={styles.switchRow}>
              <Text style={styles.label}>Sync with Google Calendar</Text>
              <Switch value={syncCalendar} onValueChange={setSyncCalendar} trackColor={{ true: COLORS.primary }} />
            </View>
          </>
        )}

        {(type === 'TASK' || type === 'REMINDER') && (
          <>
            <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={dueDate} onChangeText={setDueDate} placeholder="2025-07-15" placeholderTextColor={COLORS.textMuted} />
          </>
        )}

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={content} onChangeText={setContent}
          placeholder="Case notes, details..."
          placeholderTextColor={COLORS.textMuted}
          multiline
          numberOfLines={5}
        />

        <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveBtnText}>{existing ? 'Update Entry' : 'Create Entry'}</Text>}
        </TouchableOpacity>

        {existing && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>Delete Entry</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 16, paddingBottom: 40 },
  titleInput: { fontSize: 20, fontWeight: '700', color: COLORS.text, borderBottomWidth: 2, borderBottomColor: COLORS.primary, paddingVertical: 10, marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.white, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 14, color: COLORS.text, backgroundColor: COLORS.white },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  deleteBtn: { borderWidth: 1, borderColor: COLORS.error, borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 10 },
  deleteBtnText: { color: COLORS.error, fontWeight: '700', fontSize: 14 },
});
