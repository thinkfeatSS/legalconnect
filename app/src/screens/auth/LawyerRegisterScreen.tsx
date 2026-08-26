import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { authApi, lawyersApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../theme/colors';

const PAKISTAN_CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala', 'Hyderabad', 'Bahawalpur'];

export default function LawyerRegisterScreen({ navigation }: any) {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', barCouncilNumber: '', bio: '', experienceYears: '', consultationFee: '' });
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedSpecs, setSelectedSpecs] = useState<number[]>([]);
  const [specializations, setSpecializations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  useEffect(() => {
    lawyersApi.getSpecializations().then((r) => setSpecializations(r.data)).catch(() => {});
  }, []);

  const toggleCity = (city: string) =>
    setSelectedCities((prev) => prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]);

  const toggleSpec = (id: number) =>
    setSelectedSpecs((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const handleRegister = async () => {
    if (!form.fullName || !form.email || !form.password || !form.barCouncilNumber) {
      Alert.alert('Error', 'Full name, email, password, and bar council number are required');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register({
        ...form,
        role: 'LAWYER',
        experienceYears: Number(form.experienceYears) || 0,
        consultationFee: Number(form.consultationFee) || 0,
        cities: selectedCities,
        specializationIds: selectedSpecs,
      });
      const { accessToken, userId, role } = res.data;
      await setAuth({ id: userId, email: form.email.trim().toLowerCase(), role }, accessToken);
    } catch (err: any) {
      Alert.alert('Registration Failed', err.response?.data?.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const f = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Register as Lawyer</Text>
        <Text style={styles.subtitle}>Profile will be reviewed for verification</Text>

        {[
          ['Full Name *', 'fullName', 'Ali Hassan, Advocate'],
          ['Email *', 'email', 'lawyer@example.com'],
          ['Phone', 'phone', '+92 300 0000000'],
          ['Password *', 'password', 'Min 8 characters', true],
          ['Bar Council Number *', 'barCouncilNumber', 'e.g. PBC-12345'],
          ['Experience (years)', 'experienceYears', '5', false, 'numeric'],
          ['Consultation Fee (PKR)', 'consultationFee', '2000', false, 'numeric'],
        ].map(([label, field, placeholder, secure, keyboard]: any) => (
          <View key={field}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              style={styles.input} value={(form as any)[field]} onChangeText={(v) => f(field, v)}
              placeholder={placeholder} placeholderTextColor={COLORS.textMuted}
              secureTextEntry={secure} keyboardType={keyboard ?? 'default'}
              autoCapitalize={field === 'email' ? 'none' : 'words'}
            />
          </View>
        ))}

        <Text style={styles.label}>Bio</Text>
        <TextInput style={[styles.input, { height: 80 }]} value={form.bio} onChangeText={(v) => f('bio', v)} placeholder="Brief description of your practice..." multiline placeholderTextColor={COLORS.textMuted} />

        <Text style={styles.label}>Cities (select all applicable)</Text>
        <View style={styles.chips}>
          {PAKISTAN_CITIES.map((city) => (
            <TouchableOpacity key={city} style={[styles.chip, selectedCities.includes(city) && styles.chipActive]} onPress={() => toggleCity(city)}>
              <Text style={[styles.chipText, selectedCities.includes(city) && styles.chipTextActive]}>{city}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {specializations.length > 0 && (
          <>
            <Text style={styles.label}>Specializations</Text>
            <View style={styles.chips}>
              {specializations.map((s) => (
                <TouchableOpacity key={s.id} style={[styles.chip, selectedSpecs.includes(s.id) && styles.chipActive]} onPress={() => toggleSpec(s.id)}>
                  <Text style={[styles.chipText, selectedSpecs.includes(s.id) && styles.chipTextActive]}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnText}>Register as Lawyer</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.link}>
          <Text style={styles.linkText}>← Back to client registration</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  container: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.text, marginBottom: 4, marginTop: 8 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 4, marginTop: 12 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14, fontSize: 15, color: COLORS.text, backgroundColor: COLORS.background },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.white, fontWeight: '600' },
  btn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 28 },
  btnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  link: { alignItems: 'center', marginTop: 16 },
  linkText: { color: COLORS.primary, fontSize: 14 },
});
