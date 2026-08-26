import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../theme/colors';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('ahmed.khan@legalconnect.pk');
  const [password, setPassword] = useState('Lawyer@123!');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.login(email.trim().toLowerCase(), password);
      const { accessToken, userId, role } = res.data;
      await setAuth({ id: userId, email: email.trim().toLowerCase(), role }, accessToken);
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (err.message === 'Network Error'
          ? 'Network Error: Cannot connect to server at ' + require('../../config').API_BASE_URL
          : err.message || 'Invalid credentials');
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <View style={styles.logoWrap}>
          <Text style={styles.logoEmoji}>⚖️</Text>
        </View>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={COLORS.textMuted}
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            placeholderTextColor={COLORS.textMuted}
          />

          <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnText}>Login</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.link}>
            <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkBold}>Register</Text></Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  container: { flex: 1, padding: 28, justifyContent: 'center' },
  logoWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.primary, justifyContent: 'center',
    alignItems: 'center', marginBottom: 28,
  },
  logoEmoji: { fontSize: 28 },
  title: { fontSize: 30, fontWeight: '800', color: COLORS.text, marginBottom: 4, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 32 },
  form: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 4, marginTop: 10 },
  input: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12,
    padding: 15, fontSize: 15, color: COLORS.text, backgroundColor: COLORS.background,
  },
  btn: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 17, alignItems: 'center', marginTop: 20 },
  btnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  link: { alignItems: 'center', marginTop: 18 },
  linkText: { color: COLORS.textSecondary, fontSize: 14 },
  linkBold: { color: COLORS.primary, fontWeight: '700' },
});
