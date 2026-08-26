import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../theme/colors';

export default function RegisterScreen({ navigation }: any) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register({ fullName, email: email.trim().toLowerCase(), phone, password, role: 'CLIENT' });
      const { accessToken, userId, role } = res.data;
      await setAuth({ id: userId, email: email.trim().toLowerCase(), role }, accessToken);
    } catch (err: any) {
      Alert.alert('Registration Failed', err.response?.data?.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join as a client</Text>

        <Text style={styles.label}>Full Name *</Text>
        <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Ali Khan" placeholderTextColor={COLORS.textMuted} />

        <Text style={styles.label}>Email *</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" placeholderTextColor={COLORS.textMuted} />

        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+92 300 0000000" keyboardType="phone-pad" placeholderTextColor={COLORS.textMuted} />

        <Text style={styles.label}>Password *</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Min 8 characters" secureTextEntry placeholderTextColor={COLORS.textMuted} />

        <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnText}>Create Account</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.lawyerBtn} onPress={() => navigation.navigate('LawyerRegister')}>
          <Text style={styles.lawyerBtnText}>⚖️ Register as a Lawyer instead</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.link}>
          <Text style={styles.linkText}>Already have an account? <Text style={styles.linkBold}>Login</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  container: { padding: 28, paddingBottom: 48 },
  title: { fontSize: 30, fontWeight: '800', color: COLORS.text, marginBottom: 4, marginTop: 20, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 4, marginTop: 12 },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 15, fontSize: 15, color: COLORS.text, backgroundColor: COLORS.background },
  btn: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 17, alignItems: 'center', marginTop: 24 },
  btnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  lawyerBtn: { borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 12 },
  lawyerBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },
  link: { alignItems: 'center', marginTop: 18 },
  linkText: { color: COLORS.textSecondary, fontSize: 14 },
  linkBold: { color: COLORS.primary, fontWeight: '700' },
});
