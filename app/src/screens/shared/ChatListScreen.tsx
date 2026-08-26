import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { chatApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../theme/colors';

export default function ChatListScreen({ navigation }: any) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);

  useFocusEffect(useCallback(() => {
    chatApi.getConversations().then((r) => setConversations(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []));

  const getRecipient = useCallback((conv: any) => {
    if (user?.role === 'CLIENT') return conv.lawyer;
    return conv.client;
  }, [user?.role]);

  const lastMsg = useCallback((conv: any) => {
    const m = conv.messages?.[0];
    if (!m) return 'No messages yet';
    if (m.type === 'FILE') return '📎 File';
    return m.content?.length > 60 ? m.content.slice(0, 60) + '...' : m.content;
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Messages</Text>
      {loading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 48 }} /> : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={<Text style={styles.empty}>No conversations yet</Text>}
          removeClippedSubviews
          windowSize={7}
          maxToRenderPerBatch={8}
          initialNumToRender={8}
          renderItem={({ item }) => {
            const recipient = getRecipient(item);
            const unread = item.unreadCount ?? 0;
            return (
              <TouchableOpacity
                style={styles.row}
                onPress={() => navigation.navigate('Chat', { conversationId: item.id, recipientName: recipient?.fullName })}
              >
                <View style={styles.avatar}><Text style={styles.avatarText}>{recipient?.fullName?.[0] ?? '?'}</Text></View>
                <View style={styles.info}>
                  <View style={styles.infoTop}>
                    <Text style={styles.name}>{recipient?.fullName ?? 'Unknown'}</Text>
                    {item.messages?.[0] && <Text style={styles.time}>{new Date(item.messages[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>}
                  </View>
                  <View style={styles.infoBottom}>
                    <Text style={styles.lastMsg} numberOfLines={1}>{lastMsg(item)}</Text>
                    {unread > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unread}</Text></View>}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text, padding: 16, paddingBottom: 12, letterSpacing: -0.3 },
  row: {
    flexDirection: 'row', padding: 16, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.primary, justifyContent: 'center',
    alignItems: 'center', marginRight: 14,
  },
  avatarText: { color: COLORS.white, fontWeight: '800', fontSize: 20 },
  info: { flex: 1, justifyContent: 'center' },
  infoTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  name: { fontWeight: '700', fontSize: 15, color: COLORS.text },
  time: { fontSize: 12, color: COLORS.textMuted },
  infoBottom: { flexDirection: 'row', alignItems: 'center' },
  lastMsg: { flex: 1, fontSize: 13, color: COLORS.textSecondary },
  badge: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5,
  },
  badgeText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 60, fontSize: 15 },
});
