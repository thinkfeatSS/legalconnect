import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { aiApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../theme/colors';

type Message = { role: 'user' | 'ai'; content: string; disclaimer?: string };

export default function AIAssistantScreen() {
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatRef = useRef<FlatList>(null);
  const mode = user?.role === 'LAWYER' ? 'LAWYER' : 'CLIENT';

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || loading) return;
    const userMsg: Message = { role: 'user', content };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await aiApi.chat({ message: content, mode });
      const aiMsg: Message = { role: 'ai', content: res.data.response, disclaimer: res.data.disclaimer };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', content: 'Sorry, I could not process your request. Please try again.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const renderItem = useCallback(({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        {!isUser && <Text style={styles.aiLabel}>⚖️ AI Legal Assistant</Text>}
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{item.content}</Text>
        {item.disclaimer && (
          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerText}>⚠️ {item.disclaimer}</Text>
          </View>
        )}
      </View>
    );
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      {mode === 'CLIENT' && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>⚠️ AI responses are for general guidance only and do not constitute legal advice. Consult a qualified lawyer.</Text>
        </View>
      )}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.list}
          removeClippedSubviews
          windowSize={5}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Text style={styles.emptyIcon}>⚖️</Text>
              </View>
              <Text style={styles.emptyTitle}>AI Legal Assistant</Text>
              <Text style={styles.emptySubtitle}>{mode === 'CLIENT' ? 'Ask general legal questions about Pakistan law' : 'Get help drafting documents and summarizing cases'}</Text>
            </View>
          }
          renderItem={renderItem}
        />
        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={COLORS.primary} size="small" />
            <Text style={styles.loadingText}>AI is thinking...</Text>
          </View>
        )}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={mode === 'CLIENT' ? 'Ask a legal question...' : 'Ask for document help...'}
            placeholderTextColor={COLORS.textMuted}
            multiline
            maxLength={800}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]} onPress={sendMessage} disabled={!input.trim() || loading}>
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  banner: { backgroundColor: COLORS.primary, padding: 11, borderBottomWidth: 0 },
  bannerText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 17 },
  list: { padding: 14, gap: 10, paddingBottom: 8, flexGrow: 1 },
  bubble: { borderRadius: 18, padding: 14, maxWidth: '90%' },
  bubbleUser: { backgroundColor: COLORS.primary, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleAI: {
    backgroundColor: COLORS.white, alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  aiLabel: { fontSize: 11, color: COLORS.accent, fontWeight: '700', marginBottom: 6, letterSpacing: 0.5 },
  bubbleText: { fontSize: 14, color: COLORS.text, lineHeight: 22 },
  bubbleTextUser: { color: COLORS.white },
  disclaimerBox: { marginTop: 10, backgroundColor: COLORS.accentLight, borderRadius: 8, padding: 9 },
  disclaimerText: { fontSize: 11, color: '#7A5C00', lineHeight: 16 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: 60 },
  emptyIconWrap: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  emptyIcon: { fontSize: 42 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginTop: 4, letterSpacing: -0.3 },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 10, lineHeight: 21 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 6 },
  loadingText: { fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic' },
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
