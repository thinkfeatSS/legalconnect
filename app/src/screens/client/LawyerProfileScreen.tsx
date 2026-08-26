import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { lawyersApi, chatApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../theme/colors';

export default function LawyerProfileScreen({ navigation, route }: any) {
  const { lawyerId } = route.params;
  const [lawyer, setLawyer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    lawyersApi.getProfile(lawyerId).then((r) => setLawyer(r.data)).catch(() => Alert.alert('Error', 'Failed to load profile')).finally(() => setLoading(false));
  }, [lawyerId]);

  const handleBook = () => navigation.navigate('BookAppointment', { lawyerId, lawyerName: lawyer.fullName });

  const handleChat = async () => {
    try {
      const res = await chatApi.getOrCreateConversation(lawyerId);
      navigation.navigate('Chat', { conversationId: res.data.id, recipientName: lawyer.fullName });
    } catch {
      Alert.alert('Error', 'Could not open chat');
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={COLORS.primary} />;
  if (!lawyer) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{lawyer.fullName?.[0] ?? '⚖'}</Text></View>
          <Text style={styles.name}>{lawyer.fullName}</Text>
          {lawyer.barCouncilNumber && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>✅ Verified Lawyer</Text>
            </View>
          )}
          <Text style={styles.specs}>{(lawyer.specializations ?? []).map((s: any) => s.specialization?.name ?? s).join(' • ')}</Text>
          <Text style={styles.cities}>📍 {(lawyer.cities as string[] ?? []).join(', ')}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}><Text style={styles.statVal}>⭐ {lawyer.avgRating?.toFixed(1)}</Text><Text style={styles.statLabel}>Rating</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.stat}><Text style={styles.statVal}>{lawyer.totalReviews}</Text><Text style={styles.statLabel}>Reviews</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.stat}><Text style={styles.statVal}>{lawyer.experienceYears}y</Text><Text style={styles.statLabel}>Experience</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.stat}><Text style={styles.statVal}>PKR {Number(lawyer.consultationFee).toLocaleString()}</Text><Text style={styles.statLabel}>Fee</Text></View>
        </View>

        {lawyer.barCouncilNumber && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bar Council Number</Text>
            <Text style={styles.barCouncil}>🏛️ {lawyer.barCouncilNumber}</Text>
          </View>
        )}

        {lawyer.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bio}>{lawyer.bio}</Text>
          </View>
        )}

        {lawyer.reviewsReceived?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Reviews</Text>
            {lawyer.reviewsReceived.slice(0, 3).map((r: any) => (
              <View key={r.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewName}>{r.client?.fullName ?? 'Client'}</Text>
                  <Text style={styles.reviewRating}>{'⭐'.repeat(r.rating)}</Text>
                </View>
                {r.comment && <Text style={styles.reviewComment}>{r.comment}</Text>}
              </View>
            ))}
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.bookBtn} onPress={handleBook}>
            <Text style={styles.bookBtnText}>📅 Book Appointment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chatBtn} onPress={handleChat}>
            <Text style={styles.chatBtnText}>💬 Chat</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { paddingBottom: 32 },
  heroCard: {
    backgroundColor: COLORS.primary, paddingTop: 28, paddingBottom: 28,
    paddingHorizontal: 20, alignItems: 'center', marginBottom: 12,
  },
  avatar: {
    width: 86, height: 86, borderRadius: 43,
    borderWidth: 2, borderColor: COLORS.accent,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  avatarText: { fontSize: 36, color: COLORS.white, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', color: COLORS.white, textAlign: 'center', letterSpacing: -0.3 },
  badge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginTop: 8, backgroundColor: 'rgba(255,255,255,0.15)' },
  badgeText: { fontSize: 13, fontWeight: '600', color: COLORS.white },
  specs: { fontSize: 13, color: COLORS.accent, marginTop: 10, textAlign: 'center', fontWeight: '600' },
  cities: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  statsRow: {
    flexDirection: 'row', backgroundColor: COLORS.white, marginHorizontal: 16, borderRadius: 16,
    padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 3 },
  statDivider: { width: 1, height: 32, backgroundColor: COLORS.border },
  section: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16,
    marginBottom: 10, marginHorizontal: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  barCouncil: { fontSize: 14, color: COLORS.textSecondary },
  bio: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  reviewCard: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10, marginTop: 10 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  reviewName: { fontWeight: '700', color: COLORS.text, fontSize: 13 },
  reviewRating: { fontSize: 12 },
  reviewComment: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  actions: { gap: 10, marginTop: 8, marginHorizontal: 16, marginBottom: 16 },
  bookBtn: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 17, alignItems: 'center' },
  bookBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  chatBtn: { borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 14, padding: 15, alignItems: 'center' },
  chatBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },
});
