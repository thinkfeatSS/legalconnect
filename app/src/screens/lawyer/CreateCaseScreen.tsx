import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TextInput, TouchableOpacity, Alert, ActivityIndicator,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { casesApi } from '../../services/api';
import { COLORS } from '../../theme/colors';

const CASE_TYPES = ['CIVIL', 'CRIMINAL', 'FAMILY', 'CORPORATE', 'CONSTITUTIONAL', 'PROPERTY', 'LABOUR', 'ANTI_TERRORISM', 'ACCOUNTABILITY', 'OTHER'];
const COURT_TYPES = ['DISTRICT', 'HIGH', 'SUPREME', 'FEDERAL_SHARIAT', 'SPECIAL', 'REVENUE', 'LABOUR', 'FAMILY', 'ACCOUNTABILITY', 'OTHER'];
const PROVINCES = ['PUNJAB', 'SINDH', 'KPK', 'BALOCHISTAN', 'FEDERAL', 'AJK', 'GILGIT_BALTISTAN'];

export default function CreateCaseScreen({ navigation, route }: any) {
  const editCase = route?.params?.caseData;
  const isEdit = !!editCase;

  const [form, setForm] = useState({
    caseNumber: editCase?.caseNumber ?? '',
    title: editCase?.title ?? '',
    description: editCase?.description ?? '',
    caseType: editCase?.caseType ?? 'CIVIL',
    courtName: editCase?.courtName ?? '',
    courtCity: editCase?.courtCity ?? '',
    courtProvince: editCase?.courtProvince ?? 'PUNJAB',
    courtType: editCase?.courtType ?? 'DISTRICT',
    firNumber: editCase?.firNumber ?? '',
    filingDate: editCase?.filingDate ? editCase.filingDate.split('T')[0] : '',
    plaintiffName: editCase?.plaintiff?.name ?? '',
    plaintiffCnic: editCase?.plaintiff?.cnic ?? '',
    defendantName: editCase?.defendant?.name ?? '',
    defendantCnic: editCase?.defendant?.cnic ?? '',
    opposingCounselName: editCase?.opposingCounsel?.name ?? '',
    opposingCounselFirm: editCase?.opposingCounsel?.firm ?? '',
    opposingCounselPhone: editCase?.opposingCounsel?.phone ?? '',
    retainerAmount: editCase?.retainerAmount ? String(editCase.retainerAmount) : '',
    notes: editCase?.notes ?? '',
  });

  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.caseNumber.trim() || !form.title.trim()) {
      Alert.alert('Validation', 'Case number and title are required');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        caseNumber: form.caseNumber.trim(),
        title: form.title.trim(),
        description: form.description || undefined,
        caseType: form.caseType,
        courtName: form.courtName || undefined,
        courtCity: form.courtCity || undefined,
        courtProvince: form.courtProvince,
        courtType: form.courtType,
        firNumber: form.caseType === 'CRIMINAL' && form.firNumber ? form.firNumber : undefined,
        filingDate: form.filingDate || undefined,
        plaintiff: form.plaintiffName ? { name: form.plaintiffName, cnic: form.plaintiffCnic || undefined } : undefined,
        defendant: form.defendantName ? { name: form.defendantName, cnic: form.defendantCnic || undefined } : undefined,
        opposingCounsel: form.opposingCounselName
          ? { name: form.opposingCounselName, firm: form.opposingCounselFirm || undefined, phone: form.opposingCounselPhone || undefined }
          : undefined,
        retainerAmount: form.retainerAmount ? form.retainerAmount : undefined,
        notes: form.notes || undefined,
      };

      if (isEdit) {
        await casesApi.update(editCase.id, payload);
        Alert.alert('Success', 'Case updated successfully');
      } else {
        await casesApi.create(payload);
        Alert.alert('Success', 'Case created successfully');
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to save case');
    } finally {
      setSaving(false);
    }
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  const Field = ({
    label, value, onChangeText, placeholder, multiline = false, keyboardType = 'default',
  }: any) => (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType}
      />
    </View>
  );

  const Picker = ({ label, value, options, onSelect }: { label: string; value: string; options: string[]; onSelect: (v: string) => void }) => (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, value === opt && styles.chipActive]}
            onPress={() => onSelect(opt)}
          >
            <Text style={[styles.chipText, value === opt && styles.chipTextActive]}>
              {opt.replace(/_/g, ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <SectionHeader title="Case Basics" />
        <Field label="Case Number *" value={form.caseNumber} onChangeText={(v: string) => set('caseNumber', v)} placeholder="e.g. 2026/DC/LHR/001" />
        <Field label="Case Title *" value={form.title} onChangeText={(v: string) => set('title', v)} placeholder="Brief description of the case" />
        <Field label="Description" value={form.description} onChangeText={(v: string) => set('description', v)} placeholder="Detailed case background..." multiline />
        <Field label="Filing Date" value={form.filingDate} onChangeText={(v: string) => set('filingDate', v)} placeholder="YYYY-MM-DD" />

        <Picker label="Case Type" value={form.caseType} options={CASE_TYPES} onSelect={(v) => set('caseType', v)} />

        {form.caseType === 'CRIMINAL' && (
          <Field label="FIR Number" value={form.firNumber} onChangeText={(v: string) => set('firNumber', v)} placeholder="e.g. 123/2026 P.S. Johar Town" />
        )}

        <SectionHeader title="Court Details" />
        <Field label="Court Name" value={form.courtName} onChangeText={(v: string) => set('courtName', v)} placeholder="e.g. District Courts Lahore" />
        <Field label="Court City" value={form.courtCity} onChangeText={(v: string) => set('courtCity', v)} placeholder="e.g. Lahore" />
        <Picker label="Province / Territory" value={form.courtProvince} options={PROVINCES} onSelect={(v) => set('courtProvince', v)} />
        <Picker label="Court Type" value={form.courtType} options={COURT_TYPES} onSelect={(v) => set('courtType', v)} />

        <SectionHeader title="Parties" />
        <Field label="Plaintiff Name" value={form.plaintiffName} onChangeText={(v: string) => set('plaintiffName', v)} placeholder="Full name" />
        <Field label="Plaintiff CNIC (optional)" value={form.plaintiffCnic} onChangeText={(v: string) => set('plaintiffCnic', v)} placeholder="XXXXX-XXXXXXX-X" />
        <Field label="Defendant Name" value={form.defendantName} onChangeText={(v: string) => set('defendantName', v)} placeholder="Full name" />
        <Field label="Defendant CNIC (optional)" value={form.defendantCnic} onChangeText={(v: string) => set('defendantCnic', v)} placeholder="XXXXX-XXXXXXX-X" />

        <SectionHeader title="Opposing Counsel" />
        <Field label="Counsel Name" value={form.opposingCounselName} onChangeText={(v: string) => set('opposingCounselName', v)} placeholder="Opposing lawyer's name" />
        <Field label="Law Firm" value={form.opposingCounselFirm} onChangeText={(v: string) => set('opposingCounselFirm', v)} placeholder="Firm name (optional)" />
        <Field label="Phone" value={form.opposingCounselPhone} onChangeText={(v: string) => set('opposingCounselPhone', v)} placeholder="+92 3XX XXXXXXX" keyboardType="phone-pad" />

        <SectionHeader title="Financial" />
        <Field label="Retainer Amount (PKR)" value={form.retainerAmount} onChangeText={(v: string) => set('retainerAmount', v)} placeholder="0.00" keyboardType="decimal-pad" />

        <SectionHeader title="Notes" />
        <Field label="Internal Notes" value={form.notes} onChangeText={(v: string) => set('notes', v)} placeholder="Any internal notes about this case..." multiline />

        <TouchableOpacity style={[styles.submitBtn, saving && { opacity: 0.6 }]} onPress={handleSubmit} disabled={saving}>
          {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitText}>{isEdit ? 'Update Case' : 'Create Case'}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 16, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 4,
  },
  fieldWrap: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  chipScroll: { marginTop: 2 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    marginRight: 8,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  chipTextActive: { color: COLORS.white },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
});
