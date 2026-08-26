import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { appointmentsApi, analyticsApi, hearingsApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../theme/colors';

export default function LawyerDashboardScreen({ navigation }: any) {
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, completed: 0 });
  const [overview, setOverview] = useState<any>(null);
  const [upcomingHearings, setUpcomingHearings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);

  const load = async () => {
    setLoading(true);
    try {
      const [apptRes, overviewRes, hearingsRes] = await Promise.all([
        appointmentsApi.getLawyerAppointments(),
        analyticsApi.getOverview().catch(() => ({ data: null })),
        hearingsApi.getUpcoming(7).catch(() => ({ data: [] })),
      ]);
      const all: any[] = apptRes.data;
      const today = new Date().toISOString().split('T')[0];
      setTodayAppointments(all.filter((a) => a.appointmentDate?.startsWith(today)));
      setStats({
        total: all.length,
        pending: all.filter((a) => a.status === 'PENDING').length,
        confirmed: all.filter((a) => a.status === 'CONFIRMED').length,
        completed: all.filter((a) => a.status === 'COMPLETED').length,
      });
      setOverview(overviewRes.data);
      setUpcomingHearings(hearingsRes.data ?? []);
    } catch {}
    finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={COLORS.primary} />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.openDrawer()}>
            <Icon name="menu-outline" size={26} color={COLORS.white} />
          </TouchableOpacity>
          <View>
            <Text style={styles.greeting}>Good {getTimeOfDay()}, {user?.email?.split('@')[0] ?? 'Counselor'} 👋</Text>
            <Text style={styles.subText}>Here's your dashboard overview</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          {[
            { label: 'Total',     value: stats.total,     color: COLORS.primaryLight, icon: 'calendar-outline'     },
            { label: 'Pending',   value: stats.pending,   color: COLORS.warning,      icon: 'time-outline'         },
            { label: 'Confirmed', value: stats.confirmed, color: '#2563EB',            icon: 'checkmark-circle-outline' },
            { label: 'Completed', value: stats.completed, color: COLORS.success,      icon: 'trophy-outline'       },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: s.color + '18' }]}>
                <Icon name={s.icon} size={20} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Today's Appointments</Text>
        {todayAppointments.length === 0 ? (
          <Text style={styles.empty}>No appointments today 🎉</Text>
        ) : (
          todayAppointments.map((appt) => (
            <View key={appt.id} style={styles.apptCard}>
              <View style={styles.apptTime}>
                <Text style={styles.apptTimeText}>{appt.startTime}</Text>
              </View>
              <View style={styles.apptInfo}>
                <Text style={styles.apptName}>{appt.client?.fullName ?? 'Client'}</Text>
                <Text style={styles.apptType}>{appt.type === 'ONLINE' ? '💻 Online' : '🏢 Physical'}</Text>
              </View>
              <View style={[styles.apptStatus, { backgroundColor: appt.status === 'CONFIRMED' ? COLORS.success + '20' : COLORS.warning + '20' }]}>
                <Text style={[styles.apptStatusText, { color: appt.status === 'CONFIRMED' ? COLORS.success : COLORS.warning }]}>{appt.status}</Text>
              </View>
            </View>
          ))
        )}

        <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation.navigate('LawyerAppointments')}>
          <Text style={styles.viewAllText}>View All Appointments →</Text>
        </TouchableOpacity>

        {/* Quick Nav */}
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.quickRow}>
          {[
            { label: 'Cases',    icon: 'briefcase-outline', screen: 'Cases',    color: COLORS.primary },
            { label: 'Calendar', icon: 'calendar-outline',  screen: 'Calendar', color: '#2563EB'       },
            { label: 'Diary',    icon: 'book-outline',      screen: 'Diary',    color: COLORS.success  },
            { label: 'Firm',     icon: 'business-outline',  screen: 'FirmManagement', color: COLORS.accent },
          ].map((q) => (
            <TouchableOpacity
              key={q.label}
              style={[styles.quickBtn, { borderTopColor: q.color }]}
              onPress={() => navigation.navigate(q.screen)}
            >
              <Icon name={q.icon} size={22} color={q.color} />
              <Text style={styles.quickLabel}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Analytics Overview */}
        {overview && (
          <>
            <Text style={styles.sectionTitle}>Case Analytics</Text>
        <View style={styles.statsGrid}>
              {[
                { label: 'Total Cases',         value: overview.totalCases,        color: COLORS.primaryLight, icon: 'briefcase-outline'        },
                { label: 'Open',                value: overview.openCases,         color: COLORS.success,      icon: 'folder-open-outline'      },
                { label: 'Upcoming Hearings',   value: overview.upcomingHearings,  color: '#2563EB',           icon: 'megaphone-outline'        },
                { label: 'Pending Signatures',  value: overview.pendingSignatures, color: COLORS.warning,      icon: 'pencil-outline'           },
              ].map((s) => (
                <View key={s.label} style={styles.statCard}>
                  <View style={[styles.statIconBox, { backgroundColor: s.color + '18' }]}>
                    <Icon name={s.icon} size={20} color={s.color} />
                  </View>
                  <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Upcoming Hearings */}
        {upcomingHearings.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Upcoming Hearings (7 days)</Text>
            {upcomingHearings.slice(0, 3).map((h: any) => (
              <TouchableOpacity
                key={h.id}
                style={styles.hearingCard}
                onPress={() => navigation.navigate('CaseDetail', { caseId: h.caseId, caseTitle: h.case?.title ?? '' })}
              >
                <View style={styles.hearingDateBox}>
                  <Text style={styles.hearingDay}>{new Date(h.hearingDate).getDate()}</Text>
                  <Text style={styles.hearingMonth}>{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][new Date(h.hearingDate).getMonth()]}</Text>
                </View>
                <View style={styles.hearingInfo}>
                  <Text style={styles.hearingTitle} numberOfLines={1}>{h.case?.title ?? 'Case'}</Text>
                  {h.courtRoom && <Text style={styles.hearingMeta}>Room: {h.courtRoom}</Text>}
                  {h.judge && <Text style={styles.hearingMeta}>Judge: {h.judge}</Text>}
                </View>
                <Icon name="chevron-forward" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation.navigate('Calendar')}>
              <Text style={styles.viewAllText}>View Calendar →</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { paddingBottom: 110 },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24,
    marginBottom: 0,
  },
  menuBtn: { width: 40, height: 40, justifyContent: 'center', marginBottom: 10 },
  greeting: { fontSize: 20, fontWeight: '800', color: COLORS.white, letterSpacing: -0.3 },
  subText: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 16, paddingBottom: 4 },
  statCard: {
    flex: 1, minWidth: '44%', backgroundColor: COLORS.white, borderRadius: 16,
    padding: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  statIconBox: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statValue: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12, paddingHorizontal: 16, marginTop: 20 },
  apptCard: {
    flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 14,
    padding: 14, marginBottom: 10, alignItems: 'center', marginHorizontal: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  apptTime: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 10, marginRight: 14 },
  apptTimeText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  apptInfo: { flex: 1 },
  apptName: { fontWeight: '700', fontSize: 15, color: COLORS.text },
  apptType: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  apptStatus: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16 },
  apptStatusText: { fontSize: 11, fontWeight: '700' },
  empty: { textAlign: 'center', color: COLORS.textMuted, paddingVertical: 28, fontSize: 15, paddingHorizontal: 16 },
  viewAllBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, padding: 14,
    alignItems: 'center', marginTop: 8, marginBottom: 4, marginHorizontal: 16,
  },
  viewAllText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 8, paddingHorizontal: 16 },
  quickBtn: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 14, padding: 14, alignItems: 'center', gap: 6,
    borderTopWidth: 3, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4,
  },
  quickLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary },
  hearingCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 14,
    padding: 12, marginBottom: 8, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
  },
  hearingDateBox: {
    width: 46, height: 46, borderRadius: 12, backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  hearingDay: { fontSize: 18, fontWeight: '800', color: '#2563EB', lineHeight: 20 },
  hearingMonth: { fontSize: 10, color: '#2563EB', fontWeight: '600', textTransform: 'uppercase' },
  hearingInfo: { flex: 1 },
  hearingTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  hearingMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
});
