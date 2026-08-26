import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TextInput, TouchableOpacity, Alert, ActivityIndicator,
  FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { firmApi } from '../../services/api';
import { COLORS } from '../../theme/colors';

const MEMBER_ROLES = ['PARTNER', 'ASSOCIATE', 'PARALEGAL', 'CLERK'];
const PROVINCES = ['PUNJAB', 'SINDH', 'KPK', 'BALOCHISTAN', 'FEDERAL', 'AJK', 'GILGIT_BALTISTAN'];

const ROLE_COLOR: Record<string, string> = {
  OWNER: COLORS.primary,
  PARTNER: '#2563EB',
  ASSOCIATE: COLORS.success,
  PARALEGAL: COLORS.warning,
  CLERK: COLORS.textMuted,
};

export default function FirmScreen() {
  const [firm, setFirm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: '',
    registrationNumber: '',
    address: '',
    city: '',
    province: 'PUNJAB',
    phone: '',
  });

  const [inviteId, setInviteId] = useState('');
  const [inviteRole, setInviteRole] = useState('ASSOCIATE');
  const [inviting, setInviting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await firmApi.getMyFirm();
      setFirm(res.data);
    } catch (e: any) {
      if (e?.response?.status === 404) {
        setFirm(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleCreateFirm = async () => {
    if (!createForm.name.trim()) {
      Alert.alert('Validation', 'Firm name is required');
      return;
    }
    setCreating(true);
    try {
      await firmApi.create(createForm);
      Alert.alert('Success', 'Law firm created!');
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to create firm');
    } finally {
      setCreating(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteId.trim()) {
      Alert.alert('Validation', 'Lawyer profile ID is required');
      return;
    }
    setInviting(true);
    try {
      await firmApi.inviteMember({ lawyerProfileId: parseInt(inviteId), role: inviteRole });
      Alert.alert('Success', 'Member invited!');
      setInviteId('');
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to invite');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    Alert.alert('Remove Member', 'Remove this member from the firm?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            await firmApi.removeMember(memberId);
            load();
          } catch {
            Alert.alert('Error', 'Failed to remove');
          }
        },
      },
    ]);
  };

  const handleUpdateRole = async (memberId: number, currentRole: string) => {
    const roles = MEMBER_ROLES.filter((r) => r !== currentRole);
    Alert.alert('Change Role', 'Select new role', roles.map((r) => ({
      text: r,
      onPress: async () => {
        try {
          await firmApi.updateMemberRole(memberId, { role: r });
          load();
        } catch {
          Alert.alert('Error', 'Failed to update role');
        }
      },
    })));
  };

  const set = (key: keyof typeof createForm, value: string) =>
    setCreateForm((prev) => ({ ...prev, [key]: value }));

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={COLORS.primary} />;

  if (!firm) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.noFirmBox}>
            <Icon name="business-outline" size={60} color={COLORS.textMuted} />
            <Text style={styles.noFirmTitle}>No Firm Yet</Text>
            <Text style={styles.noFirmSub}>Create your law firm to manage team and cases together</Text>
            <TouchableOpacity
              style={styles.createFirmBtn}
              onPress={() => setShowCreateForm(!showCreateForm)}
            >
              <Icon name="add-circle-outline" size={20} color={COLORS.white} />
              <Text style={styles.createFirmBtnText}>{showCreateForm ? 'Cancel' : 'Create Law Firm'}</Text>
            </TouchableOpacity>
          </View>

          {showCreateForm && (
            <View style={styles.createForm}>
              <Text style={styles.formTitle}>New Law Firm</Text>

              {[
                { label: 'Firm Name *', key: 'name', placeholder: 'e.g. Hassan & Associates' },
                { label: 'Registration Number', key: 'registrationNumber', placeholder: 'e.g. PBA-LHR-2026-001' },
                { label: 'Address', key: 'address', placeholder: 'Full address' },
                { label: 'City', key: 'city', placeholder: 'e.g. Lahore' },
                { label: 'Phone', key: 'phone', placeholder: '+92 42 XXXXXXX' },
              ].map((f) => (
                <View key={f.key} style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={f.placeholder}
                    placeholderTextColor={COLORS.textMuted}
                    value={(createForm as any)[f.key]}
                    onChangeText={(v) => set(f.key as keyof typeof createForm, v)}
                  />
                </View>
              ))}

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Province</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {PROVINCES.map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.chip, createForm.province === p && styles.chipActive]}
                      onPress={() => set('province', p)}
                    >
                      <Text style={[styles.chipText, createForm.province === p && styles.chipTextActive]}>
                        {p.replace(/_/g, ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, creating && { opacity: 0.6 }]}
                onPress={handleCreateFirm}
                disabled={creating}
              >
                {creating
                  ? <ActivityIndicator color={COLORS.white} />
                  : <Text style={styles.submitBtnText}>Create Firm</Text>}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Firm Header */}
        <View style={styles.firmHeader}>
          <View style={styles.firmLogo}>
            <Icon name="business" size={30} color={COLORS.white} />
          </View>
          <View style={styles.firmInfo}>
            <Text style={styles.firmName}>{firm.name}</Text>
            {firm.registrationNumber && <Text style={styles.firmMeta}>Reg: {firm.registrationNumber}</Text>}
            {firm.city && <Text style={styles.firmMeta}>{firm.city}{firm.province ? `, ${firm.province}` : ''}</Text>}
            {firm.phone && <Text style={styles.firmMeta}>{firm.phone}</Text>}
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{firm.members?.length ?? 0}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{firm.cases?.length ?? 0}</Text>
            <Text style={styles.statLabel}>Cases</Text>
          </View>
        </View>

        {/* Invite Member */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invite Member</Text>
          <TextInput
            style={styles.input}
            placeholder="Lawyer Profile ID"
            placeholderTextColor={COLORS.textMuted}
            value={inviteId}
            onChangeText={setInviteId}
            keyboardType="number-pad"
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            {MEMBER_ROLES.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.chip, inviteRole === r && styles.chipActive]}
                onPress={() => setInviteRole(r)}
              >
                <Text style={[styles.chipText, inviteRole === r && styles.chipTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={[styles.inviteBtn, inviting && { opacity: 0.6 }]}
            onPress={handleInvite}
            disabled={inviting}
          >
            {inviting
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.inviteBtnText}>Send Invite</Text>}
          </TouchableOpacity>
        </View>

        {/* Members */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team Members ({firm.members?.length ?? 0})</Text>
          {(firm.members ?? []).map((member: any) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberAvatar}>
                <Icon name="person" size={18} color={COLORS.white} />
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.lawyer?.fullName ?? 'Member'}</Text>
                <View style={[styles.roleBadge, { backgroundColor: (ROLE_COLOR[member.role] ?? COLORS.textMuted) + '20' }]}>
                  <Text style={[styles.roleText, { color: ROLE_COLOR[member.role] ?? COLORS.textMuted }]}>{member.role}</Text>
                </View>
              </View>
              {member.role !== 'OWNER' && (
                <View style={styles.memberActions}>
                  <TouchableOpacity onPress={() => handleUpdateRole(member.id, member.role)} style={styles.memberActionBtn}>
                    <Icon name="create-outline" size={16} color={COLORS.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleRemoveMember(member.id)} style={styles.memberActionBtn}>
                    <Icon name="trash-outline" size={16} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 16, paddingBottom: 40 },
  noFirmBox: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  noFirmTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  noFirmSub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 20 },
  createFirmBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, marginTop: 10 },
  createFirmBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  createForm: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginTop: 8, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 5 },
  formTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 14 },
  fieldWrap: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  input: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 14, color: COLORS.text },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white, marginRight: 6 },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  chipTextActive: { color: COLORS.white },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  firmHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 5 },
  firmLogo: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  firmInfo: { flex: 1 },
  firmName: { fontSize: 17, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  firmMeta: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 2 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: COLORS.white, borderRadius: 10, padding: 14, alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3 },
  statValue: { fontSize: 24, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  section: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.accent, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  inviteBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  inviteBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  memberCard: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  memberAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 3 },
  roleBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  roleText: { fontSize: 11, fontWeight: '700' },
  memberActions: { flexDirection: 'row', gap: 8 },
  memberActionBtn: { padding: 4 },
});
