import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { calendarApi } from '../../services/api';
import { COLORS } from '../../theme/colors';

const EVENT_COLORS: Record<string, string> = {
  HEARING: '#DC2626',
  APPOINTMENT: '#2563EB',
  TASK: '#16A34A',
  REMINDER: '#D97706',
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function LegalCalendarScreen({ navigation }: any) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  const load = async (y: number, m: number) => {
    setLoading(true);
    try {
      const startDate = new Date(y, m, 1).toISOString();
      const endDate = new Date(y, m + 1, 0, 23, 59, 59).toISOString();
      const res = await calendarApi.getEvents(startDate, endDate);
      setEvents(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { load(year, month); }, [year, month]));

  const navigateMonth = (dir: 1 | -1) => {
    let newMonth = month + dir;
    let newYear = year;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }
    setMonth(newMonth);
    setYear(newYear);
    setSelectedDay(null);
  };

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  // Events indexed by day
  const eventsByDay: Record<number, any[]> = {};
  events.forEach((ev) => {
    const d = new Date(ev.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!eventsByDay[day]) eventsByDay[day] = [];
      eventsByDay[day].push(ev);
    }
  });

  const selectedEvents = selectedDay ? (eventsByDay[selectedDay] ?? []) : [];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.navBtn}>
            <Icon name="chevron-back" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{MONTH_NAMES[month]} {year}</Text>
          <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.navBtn}>
            <Icon name="chevron-forward" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Day labels */}
        <View style={styles.weekRow}>
          {DAY_NAMES.map((d) => (
            <Text key={d} style={styles.dayLabel}>{d}</Text>
          ))}
        </View>

        {/* Calendar grid */}
        {loading
          ? <ActivityIndicator style={{ marginTop: 30 }} color={COLORS.primary} />
          : (
            <View style={styles.grid}>
              {cells.map((day, idx) => {
                const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                const isSelected = day === selectedDay;
                const dayEvents = day ? (eventsByDay[day] ?? []) : [];
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.dayCell,
                      isToday && styles.dayCellToday,
                      isSelected && styles.dayCellSelected,
                    ]}
                    disabled={!day}
                    onPress={() => day && setSelectedDay(day)}
                  >
                    {day && (
                      <>
                        <Text style={[
                          styles.dayNum,
                          isToday && styles.dayNumToday,
                          isSelected && styles.dayNumSelected,
                        ]}>{day}</Text>
                        <View style={styles.dotRow}>
                          {dayEvents.slice(0, 3).map((ev, i) => (
                            <View key={i} style={[styles.dot, { backgroundColor: EVENT_COLORS[ev.type] ?? COLORS.textMuted }]} />
                          ))}
                        </View>
                      </>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

        {/* Legend */}
        <View style={styles.legend}>
          {Object.entries(EVENT_COLORS).map(([type, color]) => (
            <View key={type} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={styles.legendText}>{type.charAt(0) + type.slice(1).toLowerCase()}</Text>
            </View>
          ))}
        </View>

        {/* Selected day events */}
        {selectedDay !== null && (
          <View style={styles.eventsSection}>
            <Text style={styles.eventsSectionTitle}>
              {selectedDay} {MONTH_NAMES[month]} {year}
            </Text>
            {selectedEvents.length === 0 ? (
              <Text style={styles.noEvents}>No events on this day</Text>
            ) : (
              selectedEvents.map((ev, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.eventCard, { borderLeftColor: EVENT_COLORS[ev.type] ?? COLORS.textMuted }]}
                  onPress={() => {
                    if (ev.type === 'HEARING' && ev.meta?.caseId) {
                      navigation.navigate('CaseDetail', { caseId: ev.meta.caseId, caseTitle: ev.meta.caseTitle ?? '' });
                    } else if (ev.type === 'APPOINTMENT') {
                      navigation.navigate('LawyerAppointments');
                    }
                  }}
                >
                  <View style={[styles.eventTypeBadge, { backgroundColor: (EVENT_COLORS[ev.type] ?? COLORS.textMuted) + '20' }]}>
                    <Text style={[styles.eventTypeText, { color: EVENT_COLORS[ev.type] ?? COLORS.textMuted }]}>{ev.type}</Text>
                  </View>
                  <Text style={styles.eventTitle}>{ev.title}</Text>
                  <Text style={styles.eventTime}>
                    {new Date(ev.date).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                    {ev.status && <Text style={styles.eventStatus}> · {ev.status}</Text>}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: COLORS.white, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  navBtn: { padding: 6 },
  monthTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  weekRow: { flexDirection: 'row', backgroundColor: COLORS.white, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: COLORS.white },
  dayCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: COLORS.border + '80' },
  dayCellToday: { backgroundColor: COLORS.accentLight },
  dayCellSelected: { backgroundColor: COLORS.primary },
  dayNum: { fontSize: 14, color: COLORS.text, fontWeight: '500' },
  dayNumToday: { color: COLORS.accent, fontWeight: '700' },
  dayNumSelected: { color: COLORS.white, fontWeight: '700' },
  dotRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, padding: 12, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  eventsSection: { padding: 16 },
  eventsSectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  noEvents: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', paddingVertical: 20 },
  eventCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  eventTypeBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4 },
  eventTypeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  eventTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  eventTime: { fontSize: 12, color: COLORS.textSecondary },
  eventStatus: { color: COLORS.textMuted },
});
