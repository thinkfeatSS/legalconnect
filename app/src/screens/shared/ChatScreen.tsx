import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { chatApi } from '../../services/api';
import { socketService } from '../../services/socket';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { COLORS } from '../../theme/colors';

export default function ChatScreen({ route, navigation }: any) {
  const { conversationId, recipientName } = route.params;
  const user = useAuthStore((s) => s.user);
  const { messages, appendMessage, setMessages, setTyping } = useChatStore();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const flatRef = useRef<FlatList>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const convMessages = messages[conversationId] ?? [];

  useEffect(() => {
    navigation.setOptions({ title: recipientName });

    chatApi.getMessages(conversationId).then((r) => {
      setMessages(conversationId, r.data);
      socketService.markRead(conversationId);
    }).catch(() => {}).finally(() => setLoading(false));

    socketService.joinConversation(conversationId);

    const cleanupMsg = socketService.onMessage((msg) => {
      if (msg.conversationId === conversationId) {
        appendMessage(msg);
        socketService.markRead(conversationId);
        flatRef.current?.scrollToEnd({ animated: true });
      }
    });

    const cleanupTyping = socketService.onTyping(({ userId, conversationId: cid, isTyping: t }) => {
      if (cid === conversationId && userId !== user?.id) setIsTyping(t);
    });

    return () => { cleanupMsg(); cleanupTyping(); };
  }, [conversationId]);

  const handleSend = useCallback(() => {
    const content = text.trim();
    if (!content) return;
    socketService.sendMessage(conversationId, content, 'TEXT');
    setText('');
  }, [conversationId, text]);

  const handleTyping = useCallback((val: string) => {
    setText(val);
    socketService.sendTyping(conversationId, true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socketService.sendTyping(conversationId, false), 1500);
  }, [conversationId]);

  const keyExtractor = useCallback((item: any) => String(item.id), []);

  const renderItem = useCallback(({ item }: any) => {
    const isMe = item.senderId === user?.id;
    return (
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
        <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item.content}</Text>
        <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  }, [user?.id]);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ flex: 1 }} />
        ) : (
          <FlatList
            ref={flatRef}
            data={convMessages}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.messages}
            onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
            renderItem={renderItem}
            removeClippedSubviews
            windowSize={10}
            maxToRenderPerBatch={15}
          />
        )}

        {isTyping && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>{recipientName} is typing...</Text>
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={handleTyping}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]} onPress={handleSend} disabled={!text.trim()}>
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  messages: { padding: 14, paddingBottom: 8, gap: 8 },
  bubble: { maxWidth: '78%', borderRadius: 18, padding: 12, marginVertical: 2 },
  bubbleMe: { backgroundColor: COLORS.primary, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleThem: {
    backgroundColor: COLORS.white, alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  bubbleText: { fontSize: 15, color: COLORS.text, lineHeight: 21 },
  bubbleTextMe: { color: COLORS.white },
  bubbleTime: { fontSize: 10, color: COLORS.textMuted, marginTop: 4, alignSelf: 'flex-end' },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.6)' },
  typingIndicator: { paddingHorizontal: 16, paddingVertical: 6 },
  typingText: { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' },
  inputRow: {
    flexDirection: 'row', padding: 10, backgroundColor: COLORS.white,
    borderTopWidth: 1, borderTopColor: COLORS.border, gap: 8, alignItems: 'flex-end',
  },
  input: {
    flex: 1, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: COLORS.text,
    maxHeight: 120, backgroundColor: COLORS.background,
  },
  sendBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.35 },
  sendIcon: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
