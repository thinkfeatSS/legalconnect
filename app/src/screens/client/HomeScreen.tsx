import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, ActivityIndicator, ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { lawyersApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../theme/colors';

const SPECIALIZATIONS = ['Criminal', 'Civil', 'Family', 'Corporate', 'Property', 'Labor', 'Tax', 'IP'];

const SPEC_ICONS: Record<string, string> = {
  Criminal: 'shield-outline', Civil: 'document-text-outline', Family: 'people-outline',
  Corporate: 'business-outline', Property: 'home-outline', Labor: 'construct-outline',
  Tax: 'calculator-outline', IP: 'bulb-outline',
};

export default function HomeScreen({ navigation }: any) {
  const [featured, setFeatured] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    lawyersApi.search({ limit: 6 })
      .then((r) => setFeatured(r.data.hits))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const renderCard = useCallback(({ item }: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('LawyerProfile', { lawyerId: item.id })}
      activeOpacity={0.85}
    >
      <View style={styles.cardAvatarWrap}>
        <View style={styles.cardAvatar}>
          <Text style={styles.cardAvatarText}>{item.fullName?.[0] ?? '⚖'}</Text>
        </View>
        {item.barCouncilNumber && (
          <View style={styles.verifiedBadge}>
            <Icon name="checkmark" size={9} color={COLORS.white} />
          </View>
        )}
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>{item.fullName}</Text>
        <Text style={styles.cardSpec} numberOfLines={1}>{(item.specializations ?? []).join(' · ')}</Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          <Icon name="location-outline" size={11} color={COLORS.textMuted} /> {(item.cities ?? []).slice(0, 2).join(', ')}
          {'  ·  '}{item.experienceYears}y exp
        </Text>
        <View style={styles.cardFooter}>
          <View style={styles.ratingRow}>
            <Icon name="star" size={12} color="#F59E0B" />
            <Text style={styles.cardRating}> {item.avgRating?.toFixed(1) ?? '0.0'}</Text>
            <Text style={styles.cardReviews}> ({item.totalReviews})</Text>
          </View>
          <Text style={styles.cardFee}>PKR {Number(item.consultationFee).toLocaleString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  ), [navigation]);

  const ListHeader = (
    <View>
      {/* Hero */}
      <View style={styles.hero}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.openDrawer()}>
          <Icon name="menu-outline" size={26} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.heroText}>
          <View style={styles.brandRow}>
            <Icon name="scale-outline" size={22} color={COLORS.accent} />
            <Text style={styles.brand}>  LegalConnect</Text>
          </View>
          <Text style={styles.heroTitle}>Find your{'\n'}right lawyer</Text>
          <Text style={styles.heroSub}>Verified lawyers · Instant booking</Text>
        </View>
        {/* Search bar */}
        <View style={styles.searchBox}>
          <Icon name="search-outline" size={18} color={COLORS.textMuted} style={{ marginLeft: 14 }} />
          <TextInput
            style={styles.searchInput}
            value={searchQ}
            onChangeText={setSearchQ}
            placeholder="Search by name, specialization..."
            placeholderTextColor={COLORS.textMuted}
            onSubmitEditing={() => navigation.navigate('Search', { q: searchQ })}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={() => navigation.navigate('Search', { q: searchQ })}>
            <Text style={styles.searchBtnText}>Go</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Specializations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Browse by Practice Area</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {SPECIALIZATIONS.map((s) => (
            <TouchableOpacity key={s} style={styles.chip} onPress={() => navigation.navigate('Search', { specialization: s })} activeOpacity={0.8}>
              <Icon name={SPEC_ICONS[s] ?? 'scale-outline'} size={16} color={COLORS.accent} />
              <Text style={styles.chipText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Section header */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Verified Lawyers</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Search', {})}>
          <Text style={styles.seeAll}>See all →</Text>
        </TouchableOpacity>
      </View>
      {loading && <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={loading ? [] : featured}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderCard}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        windowSize={5}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { paddingBottom: 110 },

  /* Hero */
  hero: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32,
  },
  menuBtn: { width: 40, height: 40, justifyContent: 'center', marginBottom: 12 },
  heroText: { marginBottom: 22 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  brand: { fontSize: 14, fontWeight: '700', color: COLORS.accent, letterSpacing: 1 },
  heroTitle: { fontSize: 32, fontWeight: '900', color: COLORS.white, lineHeight: 38, letterSpacing: -0.8 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 8 },

  /* Search */
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  searchInput: {
    flex: 1, paddingHorizontal: 10, paddingVertical: 14,
    fontSize: 14, color: COLORS.text,
  },
  searchBtn: {
    backgroundColor: COLORS.accent, borderRadius: 12,
    margin: 5, paddingHorizontal: 18, paddingVertical: 9,
  },
  searchBtnText: { color: COLORS.primary, fontWeight: '800', fontSize: 13 },

  /* Sections */
  section: { paddingHorizontal: 16, paddingTop: 22 },
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 22, paddingBottom: 4,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text, letterSpacing: -0.2 },
  seeAll: { fontSize: 13, color: COLORS.accent, fontWeight: '700' },

  /* Chips */
  chipRow: { marginTop: 12, marginBottom: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.white, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 9, marginRight: 8,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  chipText: { color: COLORS.text, fontWeight: '600', fontSize: 13 },

  /* Cards */
  card: {
    flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 18,
    padding: 14, marginHorizontal: 16, marginBottom: 12,
    borderLeftWidth: 3, borderLeftColor: COLORS.accent,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  cardAvatarWrap: { marginRight: 14, position: 'relative' },
  cardAvatar: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
  },
  cardAvatarText: { fontSize: 22, color: COLORS.white, fontWeight: '700' },
  verifiedBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: COLORS.success,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.white,
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: COLORS.text, letterSpacing: -0.1 },
  cardSpec: { fontSize: 12, color: COLORS.accent, marginTop: 2, fontWeight: '600' },
  cardMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  cardRating: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  cardReviews: { fontSize: 11, color: COLORS.textMuted },
  cardFee: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
});
