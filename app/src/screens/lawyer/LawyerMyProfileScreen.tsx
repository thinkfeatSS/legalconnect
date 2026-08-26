import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { lawyersApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../theme/colors';

const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Hyderabad'];

export default function LawyerMyProfileScreen({ navigation }: any) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bio, setBio] = useState('');
  const [consultationFee, setConsultationFee] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const load = () => {
    lawyersApi.getMyProfile().then((r) => {
      setProfile(r.data);
      setBio(r.data.bio ?? '');
      setConsultationFee(String(r.data.consultationFee ?? ''));
      setCities(r.data.cities ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleSave = async () => {
    setSaving(true);
    try {
      await lawyersApi.updateProfile({ bio, consultationFee: Number(consultationFee), cities });
      Alert.alert('Saved!', 'Profile updated');
      load();
    } catch {
      Alert.alert('Error', 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  const toggleCity = (c: string) => setCities((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

  if (loading || !profile) return <ActivityIndicator style={{ flex: 1 }} color={COLORS.primary} />;

  const specNames = (profile.specializations ?? []).map((s: any) => s.specialization?.name ?? s).join(' · ');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerBg}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
            <Icon name="chevron-back-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile.fullName?.[0] ?? '⚖'}</Text>
            </View>
          </View>
          <Text style={styles.name}>{profile.fullName}</Text>
          <Text style={styles.specText}>{specNames}</Text>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{profile.experienceYears ?? 0}</Text>
              <Text style={styles.statLbl}>Yrs Exp</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statVal}>PKR {Number(profile.consultationFee ?? 0).toLocaleString()}</Text>
              <Text style={styles.statLbl}>Consultation</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statVal}>{(profile.cities ?? []).length}</Text>
              <Text style={styles.statLbl}>Cities</Text>
            </View>
          </View>
        </View>

        {/* Quick links */}
        <View style={styles.card}>
          {[
            { icon: 'calendar-outline', label: 'My Appointments', color: '#2563EB', screen: 'LawyerAppointments' },
            { icon: 'book-outline',     label: 'My Diary',         color: COLORS.success, screen: 'Diary' },
            { icon: 'briefcase-outline',label: 'Cases',            color: COLORS.primary, screen: 'Cases' },
          ].map(({ icon, label, color, screen }) => (
            <TouchableOpacity key={label} style={styles.row} onPress={() => navigation?.navigate(screen)} activeOpacity={0.7}>
              <View style={[styles.rowIcon, { backgroundColor: color + '15' }]}>
                <Icon name={icon} size={18} color={color} />
              </View>
              <Text style={styles.rowText}>{label}</Text>
              <Icon name="chevron-forward-outline" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Edit section */}
        <View style={styles.editCard}>
          <Text style={styles.editCardTitle}>Edit Profile</Text>

          <Text style={styles.fieldLabel}>Bio</Text>
          <TextInput style={[styles.input, styles.textArea]} value={bio} onChangeText={setBio} placeholder="Describe your expertise..." placeholderTextColor={COLORS.textMuted} multiline numberOfLines={4} />

          <Text style={styles.fieldLabel}>Consultation Fee (PKR)</Text>
          <TextInput style={styles.input} value={consultationFee} onChangeText={setConsultationFee} keyboardType="numeric" placeholder="e.g. 3000" placeholderTextColor={COLORS.textMuted} />

          <Text style={styles.fieldLabel}>Cities</Text>
          <View style={styles.chips}>
            {CITIES.map((c) => (
              <TouchableOpacity key={c} style={[styles.chip, cities.includes(c) && styles.chipActive]} onPress={() => toggleCity(c)}>
                <Text style={[styles.chipText, cities.includes(c) && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Bar Council Number</Text>
          <Text style={styles.readOnly}>{profile.barCouncilNumber ?? 'Not provided'}</Text>

          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={() => Alert.alert('Logout', 'Are you sure?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Logout', style: 'destructive', onPress: () => clearAuth() }])} activeOpacity={0.7}>
            <View style={[styles.rowIcon, { backgroundColor: COLORS.error + '15' }]}>
              <Icon name="log-out-outline" size={18} color={COLORS.error} />
            </View>
            <Text style={[styles.rowText, { color: COLORS.error }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0EDE8' },
  container: { paddingBottom: 60 },

  headerBg: {
    backgroundColor: COLORS.primary, paddingTop: 16, paddingBottom: 28,
    alignItems: 'center',
  },
  backBtn: { alignSelf: 'flex-start', marginLeft: 16, marginBottom: 16, padding: 4 },
  avatarRing: {
    width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: COLORS.accent,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#2C2C2C', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 32, color: COLORS.white, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', color: COLORS.white, letterSpacing: -0.3, marginBottom: 4 },
  specText: { fontSize: 12, color: COLORS.accent, fontWeight: '600', marginBottom: 10 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  badgeText: { fontWeight: '700', fontSize: 12 },
  pendingNote: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 12, textAlign: 'center', paddingHorizontal: 24 },
  statRow: { flexDirection: 'row', marginTop: 14, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 20, gap: 0 },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 13, fontWeight: '800', color: COLORS.white },
  statLbl: { fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 3, textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.12)' },

  card: {
    backgroundColor: COLORS.white, borderRadius: 18, marginHorizontal: 16, marginTop: 14, paddingVertical: 4,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0EDE8',
  },
  rowIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  rowText: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text },

  editCard: {
    backgroundColor: COLORS.white, borderRadius: 18, marginHorizontal: 16, marginTop: 14, padding: 18,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  editCardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 16, letterSpacing: -0.2 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, marginTop: 12 },
  input: { borderWidth: 1.5, borderColor: '#E5E3DF', borderRadius: 12, padding: 13, fontSize: 14, color: COLORS.text, backgroundColor: COLORS.background },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  readOnly: { fontSize: 14, color: COLORS.textSecondary, padding: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#E5E3DF', backgroundColor: COLORS.background },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.white, fontWeight: '700' },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 18 },
  saveBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
});
