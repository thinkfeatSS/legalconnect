import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TextInput, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { hearingsApi } from '../../services/api';
import { COLORS } from '../../theme/colors';

export default function HearingOutcomeScreen({ navigation, route }: any) {
  const { hearingId, hearingData } = route.params;

  const [outcome, setOutcome] = useState(hearingData?.outcome ?? '');
  const [orderText, setOrderText] = useState(hearingData?.orderText ?? '');
  const [nextHearingDate, setNextHearingDate] = useState('');
  const [nextCourtRoom, setNextCourtRoom] = useState(hearingData?.courtRoom ?? '');
  const [nextJudge, setNextJudge] = useState(hearingData?.judge ?? '');
  const [saving, setSaving] = useState(false);

  const hearingDate = hearingData?.hearingDate
    ? new Date(hearingData.hearingDate).toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : 'N/A';

  const handleMarkHeld = async () => {
    setSaving(true);
    try {
      await hearingsApi.update(hearingId, {
        status: 'HELD',
        outcome: outcome || undefined,
        orderText: orderText || undefined,
      });
      Alert.alert('Success', 'Hearing marked as held');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleAdjourn = async () => {
    if (!nextHearingDate.trim()) {
      Alert.alert('Validation', 'Next hearing date is required to adjourn (YYYY-MM-DD)');
      return;
    }
    setSaving(true);
    try {
      await hearingsApi.adjourn(hearingId, {
        nextHearingDate: `${nextHearingDate}T00:00:00.000Z`,
        outcome: outcome || undefined,
        courtRoom: nextCourtRoom || undefined,
        judge: nextJudge || undefined,
      });
      Alert.alert('Success', 'Hearing adjourned and next hearing scheduled');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to adjourn');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Hearing Info */}
        <View style={styles.hearingBox}>
          <Icon name="hammer-outline" size={20} color={COLORS.accent} />
          <View style={styles.hearingBoxInfo}>
            <Text style={styles.hearingBoxDate}>{hearingDate}</Text>
            {hearingData?.judge && <Text style={styles.hearingBoxMeta}>Judge: {hearingData.judge}</Text>}
            {hearingData?.courtRoom && <Text style={styles.hearingBoxMeta}>Room: {hearingData.courtRoom}</Text>}
          </View>
        </View>

        {/* Outcome */}
        <Text style={styles.label}>Hearing Outcome / Order Summary</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          placeholder="What was decided today? Any orders passed?"
          placeholderTextColor={COLORS.textMuted}
          value={outcome}
          onChangeText={setOutcome}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Court Order Text (optional)</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          placeholder="Full text of the court order if available..."
          placeholderTextColor={COLORS.textMuted}
          value={orderText}
          onChangeText={setOrderText}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Mark Held Button */}
        <TouchableOpacity
          style={[styles.heldBtn, saving && { opacity: 0.6 }]}
          onPress={handleMarkHeld}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color={COLORS.white} />
            : <>
                <Icon name="checkmark-circle-outline" size={20} color={COLORS.white} />
                <Text style={styles.btnText}>Mark as Held</Text>
              </>}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR ADJOURN</Text>
          <View style={styles.dividerLine} />
        </View>

        <Text style={styles.label}>Next Hearing Date * (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 2026-07-20"
          placeholderTextColor={COLORS.textMuted}
          value={nextHearingDate}
          onChangeText={setNextHearingDate}
        />

        <Text style={styles.label}>Next Court Room</Text>
        <TextInput
          style={styles.input}
          placeholder="Room for the next hearing"
          placeholderTextColor={COLORS.textMuted}
          value={nextCourtRoom}
          onChangeText={setNextCourtRoom}
        />

        <Text style={styles.label}>Next Judge</Text>
        <TextInput
          style={styles.input}
          placeholder="Judge for next hearing (if known)"
          placeholderTextColor={COLORS.textMuted}
          value={nextJudge}
          onChangeText={setNextJudge}
        />

        <TouchableOpacity
          style={[styles.adjournBtn, saving && { opacity: 0.6 }]}
          onPress={handleAdjourn}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color={COLORS.white} />
            : <>
                <Icon name="calendar-outline" size={20} color={COLORS.white} />
                <Text style={styles.btnText}>Adjourn & Schedule Next</Text>
              </>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 20, paddingBottom: 40 },
  hearingBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: COLORS.accentLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  hearingBoxInfo: { flex: 1 },
  hearingBoxDate: { fontSize: 15, fontWeight: '700', color: COLORS.accent },
  hearingBoxMeta: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
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
  inputMulti: { minHeight: 90, textAlignVertical: 'top' },
  heldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.success,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  adjournBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.warning,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  btnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '700' },
});
