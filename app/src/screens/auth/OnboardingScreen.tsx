import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { COLORS } from '../../theme/colors';

const slides = [
  { emoji: '🔍', title: 'Find Verified Lawyers', desc: 'Search by city, specialization & ratings across Pakistan' },
  { emoji: '📅', title: 'Book Appointments', desc: 'Schedule online or physical consultations instantly' },
  { emoji: '🤖', title: 'AI Legal Assistant', desc: 'Get instant answers powered by Google Gemini AI' },
];

export default function OnboardingScreen({ navigation }: any) {
  const [page, setPage] = React.useState(0);
  const slide = slides[page];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={styles.emoji}>{slide.emoji}</Text>
        </View>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.desc}>{slide.desc}</Text>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
          ))}
        </View>
      </View>
      <View style={styles.buttons}>
        {page < slides.length - 1 ? (
          <>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => setPage(page + 1)}>
              <Text style={styles.btnPrimaryText}>Next</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.skip}>Skip</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('Register')}>
              <Text style={styles.btnPrimaryText}>Get Started</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.skip}>Already have an account? Login</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 36 },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.primary, justifyContent: 'center',
    alignItems: 'center', marginBottom: 32,
  },
  emoji: { fontSize: 44 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: 14, letterSpacing: -0.3 },
  desc: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 26 },
  dots: { flexDirection: 'row', marginTop: 36, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border },
  dotActive: { backgroundColor: COLORS.primary, width: 28, borderRadius: 4 },
  buttons: { padding: 28, paddingBottom: 40, gap: 14 },
  btnPrimary: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 17, alignItems: 'center' },
  btnPrimaryText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  skip: { textAlign: 'center', color: COLORS.textMuted, fontSize: 14, padding: 8 },
});
