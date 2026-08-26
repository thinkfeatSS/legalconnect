import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { clientsApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../theme/colors';

export default function ClientProfileScreen({ navigation }: any) {
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useFocusEffect(useCallback(() => {
    clientsApi.getMyProfile().then((r) => {
      setProfile(r.data);
      setFullName(r.data.fullName);
    }).catch(() => {});
  }, []));

  const handleSave = async () => {
    setLoading(true);
    try {
      await clientsApi.updateProfile({ fullName });
      setEditing(false);
      Alert.alert('Saved!', 'Profile updated successfully');
    } catch {
      Alert.alert('Error', 'Could not update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => clearAuth() },
    ]);
  };

  if (!profile) return <ActivityIndicator style={{ flex: 1 }} color={COLORS.primary} />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Premium dark header */}
        <View style={styles.headerBg}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
            <Icon name="chevron-back-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile.fullName?.[0] ?? 'U'}</Text>
            </View>
          </View>
          {editing ? (
            <TextInput
              style={styles.nameInput}
              value={fullName}
              onChangeText={setFullName}
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          ) : (
            <Text style={styles.name}>{profile.fullName}</Text>
          )}
          <Text style={styles.email}>{profile.user?.email}</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>CLIENT</Text></View>
        </View>

        {/* Action rows */}
        <View style={styles.card}>
          {!editing ? (
            <TouchableOpacity style={styles.row} onPress={() => setEditing(true)} activeOpacity={0.7}>
              <View style={[styles.rowIcon, { backgroundColor: COLORS.primary + '15' }]}>
                <Icon name="create-outline" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.rowText}>Edit Profile</Text>
              <Icon name="chevron-forward-outline" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : (
            <View style={{ gap: 10 }}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
                {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.card}>
          {[
            { icon: 'calendar-outline', label: 'My Appointments', color: '#2563EB', screen: 'Appointments' },
            { icon: 'document-text-outline', label: 'My Cases', color: COLORS.success, screen: 'MyCases' },
            { icon: 'chatbubble-outline', label: 'Messages', color: '#7C3AED', screen: 'Messages' },
          ].map(({ icon, label, color, screen }) => (
            <TouchableOpacity key={label} style={styles.row} onPress={() => navigation?.navigate(screen)} activeOpacity={0.7}>
              <View style={[styles.rowIcon, { backgroundColor: color + '15' }]}>
                <Icon name={icon} size={18} color={color} />
              </View>
              <Text style={styles.rowText}>{label}</Text>
              <Icon name="chevron-forward-outline" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleLogout} activeOpacity={0.7}>
            <View style={[styles.rowIcon, { backgroundColor: COLORS.error + '15' }]}>
              <Icon name="log-out-outline" size={18} color={COLORS.error} />
            </View>
            <Text style={[styles.rowText, { color: COLORS.error }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0EDE8' },
  container: { paddingBottom: 60 },

  headerBg: {
    backgroundColor: COLORS.primary, paddingTop: 16, paddingBottom: 32,
    alignItems: 'center',
  },
  backBtn: { alignSelf: 'flex-start', marginLeft: 16, marginBottom: 20, padding: 4 },
  avatarRing: {
    width: 92, height: 92, borderRadius: 46, borderWidth: 3, borderColor: COLORS.accent,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  avatar: {
    width: 82, height: 82, borderRadius: 41,
    backgroundColor: '#2C2C2C', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 34, color: COLORS.white, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', color: COLORS.white, letterSpacing: -0.3 },
  nameInput: {
    fontSize: 20, fontWeight: '700', color: COLORS.white,
    borderBottomWidth: 1.5, borderBottomColor: COLORS.accent,
    paddingVertical: 6, paddingHorizontal: 24, minWidth: 200, textAlign: 'center', marginBottom: 4,
  },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4, marginBottom: 12 },
  badge: { backgroundColor: 'rgba(201,168,76,0.15)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4 },
  badgeText: { color: COLORS.accent, fontWeight: '800', fontSize: 11, letterSpacing: 1.5 },

  card: {
    backgroundColor: COLORS.white, borderRadius: 18, marginHorizontal: 16, marginTop: 14,
    paddingVertical: 4,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0EDE8',
  },
  rowIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  rowText: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text },

  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginHorizontal: 12 },
  saveBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  cancelBtn: { borderRadius: 12, padding: 10, alignItems: 'center' },
  cancelBtnText: { color: COLORS.textSecondary, fontWeight: '600' },
});
