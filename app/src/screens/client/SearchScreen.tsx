import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Modal,
} from 'react-native';
import { lawyersApi } from '../../services/api';
import { COLORS } from '../../theme/colors';

const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Hyderabad'];
const SPECIALIZATIONS = ['Criminal', 'Civil', 'Family', 'Corporate', 'Property', 'Labor', 'Tax', 'IP'];

export default function SearchScreen({ navigation, route }: any) {
  const [q, setQ] = useState(route.params?.q ?? '');
  const [city, setCity] = useState('');
  const [specialization, setSpecialization] = useState(route.params?.specialization ?? '');
  const [minExperience, setMinExperience] = useState('');
  const [maxFee, setMaxFee] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const doSearch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await lawyersApi.search({ q, city, specialization, minExperience: minExperience || undefined, maxFee: maxFee || undefined });
      setResults(res.data.hits);
    } catch {}
    finally { setLoading(false); }
  }, [q, city, specialization, minExperience, maxFee]);

  useEffect(() => { doSearch(); }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <TextInput style={styles.input} value={q} onChangeText={setQ} placeholder="Search lawyers..." placeholderTextColor="rgba(255,255,255,0.45)" returnKeyType="search" onSubmitEditing={doSearch} />
          <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilters(true)}>
            <Text style={styles.filterBtnText}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.searchBtn} onPress={doSearch}>
            <Text style={styles.searchBtnText}>Search</Text>
          </TouchableOpacity>
        </View>
        {(city || specialization) && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeFilters}>
            {city ? <View style={styles.activeFilter}><Text style={styles.activeFilterText}>📍 {city}</Text></View> : null}
            {specialization ? <View style={styles.activeFilter}><Text style={styles.activeFilterText}>⚖️ {specialization}</Text></View> : null}
          </ScrollView>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No lawyers found. Try adjusting filters.</Text>}
          removeClippedSubviews
          windowSize={7}
          maxToRenderPerBatch={10}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('LawyerProfile', { lawyerId: item.id })}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{item.fullName?.[0] ?? '⚖'}</Text></View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.fullName}</Text>
                <Text style={styles.spec}>{(item.specializations ?? []).join(' • ')}</Text>
                <Text style={styles.meta}>📍 {(item.cities ?? []).join(', ')} • {item.experienceYears}y exp</Text>
                <View style={styles.bottom}>
                  <Text style={styles.rating}>⭐ {item.avgRating?.toFixed(1) ?? '0.0'}</Text>
                  <Text style={styles.fee}>PKR {Number(item.consultationFee).toLocaleString()}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Filter Modal */}
      <Modal visible={showFilters} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => { setCity(''); setSpecialization(''); setMinExperience(''); setMaxFee(''); }}>
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
            <Text style={styles.filterLabel}>City</Text>
            <View style={styles.chips}>
              {CITIES.map((c) => (
                <TouchableOpacity key={c} style={[styles.chip, city === c && styles.chipActive]} onPress={() => setCity(city === c ? '' : c)}>
                  <Text style={[styles.chipText, city === c && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.filterLabel}>Specialization</Text>
            <View style={styles.chips}>
              {SPECIALIZATIONS.map((s) => (
                <TouchableOpacity key={s} style={[styles.chip, specialization === s && styles.chipActive]} onPress={() => setSpecialization(specialization === s ? '' : s)}>
                  <Text style={[styles.chipText, specialization === s && styles.chipTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.filterLabel}>Min Experience (years)</Text>
            <TextInput style={styles.filterInput} value={minExperience} onChangeText={setMinExperience} keyboardType="numeric" placeholder="e.g. 3" placeholderTextColor={COLORS.textMuted} />
            <Text style={styles.filterLabel}>Max Fee (PKR)</Text>
            <TextInput style={styles.filterInput} value={maxFee} onChangeText={setMaxFee} keyboardType="numeric" placeholder="e.g. 5000" placeholderTextColor={COLORS.textMuted} />
          </ScrollView>
          <View style={{ padding: 16, gap: 8 }}>
            <TouchableOpacity style={styles.applyBtn} onPress={() => { setShowFilters(false); doSearch(); }}>
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowFilters(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, padding: 14, paddingBottom: 16 },
  searchRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1, borderWidth: 0, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: COLORS.white,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  filterBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12,
    paddingHorizontal: 14, justifyContent: 'center',
  },
  filterBtnText: { fontSize: 18 },
  searchBtn: { backgroundColor: COLORS.accent, borderRadius: 12, paddingHorizontal: 14, justifyContent: 'center' },
  searchBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  activeFilters: { marginTop: 10 },
  activeFilter: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16,
    paddingHorizontal: 12, paddingVertical: 5, marginRight: 8,
  },
  activeFilterText: { fontSize: 12, color: COLORS.white, fontWeight: '600' },
  list: { padding: 12, gap: 10, paddingBottom: 32 },
  card: {
    flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 16,
    padding: 15, shadowColor: '#000', shadowOpacity: 0.06,
    shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.primary, justifyContent: 'center',
    alignItems: 'center', marginRight: 14,
  },
  avatarText: { fontSize: 20, color: COLORS.white, fontWeight: '700' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  spec: { fontSize: 12, color: COLORS.accent, marginTop: 2, fontWeight: '600' },
  meta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 3 },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  rating: { fontSize: 13, color: COLORS.text },
  fee: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 60, fontSize: 15 },
  modal: { flex: 1, backgroundColor: COLORS.white },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  clearText: { color: COLORS.error, fontWeight: '600' },
  filterLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  filterInput: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12,
    padding: 12, fontSize: 14, color: COLORS.text, backgroundColor: COLORS.background,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.background,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.white, fontWeight: '600' },
  applyBtn: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  applyBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  cancelBtn: { borderRadius: 12, padding: 12, alignItems: 'center' },
  cancelBtnText: { color: COLORS.textSecondary, fontSize: 14 },
});
