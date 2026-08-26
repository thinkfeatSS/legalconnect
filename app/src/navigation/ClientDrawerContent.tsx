import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuthStore } from '../store/authStore';
import { COLORS } from '../theme/colors';

type NavItem = {
  label: string;
  icon: string;
  screen: string;
  tabTarget?: string;
};

const TAB_ITEMS: NavItem[] = [
  { label: 'Home',     icon: 'home-outline',        screen: 'MainTabs', tabTarget: 'Home'     },
  { label: 'Search',   icon: 'search-outline',      screen: 'MainTabs', tabTarget: 'Search'   },
  { label: 'My Cases', icon: 'folder-outline',      screen: 'MainTabs', tabTarget: 'MyCases'  },
  { label: 'Messages', icon: 'chatbubble-outline',  screen: 'MainTabs', tabTarget: 'Messages' },
];

const MORE_ITEMS: NavItem[] = [
  { label: 'My Appointments',     icon: 'calendar-outline',      screen: 'Appointments'    },
  { label: 'AI Legal Help',       icon: 'sparkles-outline',      screen: 'AIAssistant'     },
  { label: 'Signature Requests',  icon: 'pencil-outline',        screen: 'ESignatureRequest' },
  { label: 'My Profile',          icon: 'person-circle-outline', screen: 'ClientProfile'   },
];

export function ClientDrawerContent(props: DrawerContentComponentProps) {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const active = props.state.routes[props.state.index]?.name;
  const initial = (user?.email?.[0] ?? 'U').toUpperCase();

  const go = (item: NavItem) => {
    if (item.tabTarget) {
      props.navigation.navigate(item.screen, { screen: item.tabTarget });
    } else {
      props.navigation.navigate(item.screen);
    }
  };

  return (
    <View style={styles.root}>
      {/* ── Header ─────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.userName} numberOfLines={1}>
          {user?.email?.split('@')[0] ?? 'User'}
        </Text>
        <Text style={styles.userEmail} numberOfLines={1}>{user?.email}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>CLIENT</Text>
        </View>
      </View>

      {/* ── Menu ───────────────────────────────── */}
      <ScrollView contentContainerStyle={styles.menu} showsVerticalScrollIndicator={false}>
        <Text style={styles.groupLabel}>NAVIGATION</Text>
        {TAB_ITEMS.map((item) => {
          const isActive = active === 'MainTabs';
          return (
            <TouchableOpacity key={item.label} style={[styles.item, isActive && styles.itemActive]} onPress={() => go(item)} activeOpacity={0.7}>
              <Icon name={item.icon} size={20} color={COLORS.accent} />
              <Text style={styles.itemText}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}

        <View style={styles.divider} />

        <Text style={styles.groupLabel}>MORE</Text>
        {MORE_ITEMS.map((item) => {
          const isActive = active === item.screen;
          return (
            <TouchableOpacity key={item.label} style={[styles.item, isActive && styles.itemActive]} onPress={() => go(item)} activeOpacity={0.7}>
              <Icon name={item.icon} size={20} color={isActive ? COLORS.accent : COLORS.textMuted} />
              <Text style={[styles.itemText, isActive && styles.itemTextActive]}>{item.label}</Text>
              {isActive && <View style={styles.dot} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Logout ─────────────────────────────── */}
      <TouchableOpacity style={styles.logoutBtn} onPress={() => clearAuth()} activeOpacity={0.8}>
        <Icon name="log-out-outline" size={20} color={COLORS.error} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.primary },

  /* header */
  header: {
    paddingTop: 64, paddingBottom: 24, paddingHorizontal: 22,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  avatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: COLORS.accent,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
    shadowColor: COLORS.accent, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 3 },
  },
  avatarText: { fontSize: 26, fontWeight: '800', color: COLORS.primary },
  userName: { fontSize: 17, fontWeight: '800', color: COLORS.white, letterSpacing: -0.2 },
  userEmail: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  badge: {
    marginTop: 10, alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(201,168,76,0.25)',
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: COLORS.accent, letterSpacing: 1.4 },

  /* menu */
  menu: { paddingTop: 18, paddingBottom: 24, paddingHorizontal: 14 },
  groupLabel: {
    fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1.5, marginBottom: 8, marginLeft: 6,
  },
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 13,
    borderRadius: 14, marginBottom: 2, gap: 13,
  },
  itemActive: { backgroundColor: 'rgba(201,168,76,0.09)' },
  itemText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.7)', flex: 1 },
  itemTextActive: { color: COLORS.accent },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accent },
  divider: {
    height: 1, backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 14, marginHorizontal: 4,
  },

  /* logout */
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    margin: 16, marginBottom: 34,
    paddingHorizontal: 14, paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(220,38,38,0.25)',
    backgroundColor: 'rgba(220,38,38,0.05)',
  },
  logoutText: { fontSize: 14, fontWeight: '700', color: COLORS.error },
});

export default React.memo(ClientDrawerContent);
