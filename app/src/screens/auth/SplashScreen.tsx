import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../theme/colors';

export default function SplashScreen({ navigation }: any) {
  useEffect(() => {
    const timer = setTimeout(() => navigation.replace('Onboarding'), 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.ring}>
        <Text style={styles.icon}>⚖️</Text>
      </View>
      <Text style={styles.title}>LegalConnect</Text>
      <View style={styles.divider} />
      <Text style={styles.subtitle}>YOUR LEGAL PARTNER IN PAKISTAN</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary },
  ring: {
    width: 112, height: 112, borderRadius: 56,
    borderWidth: 1.5, borderColor: COLORS.accent,
    justifyContent: 'center', alignItems: 'center', marginBottom: 28,
  },
  icon: { fontSize: 50 },
  title: { fontSize: 30, fontWeight: '800', color: COLORS.white, letterSpacing: 3, textTransform: 'uppercase' },
  divider: { width: 36, height: 2, backgroundColor: COLORS.accent, borderRadius: 1, marginVertical: 14 },
  subtitle: { fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase' },
});
