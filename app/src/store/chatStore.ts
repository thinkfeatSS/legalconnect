import { create } from 'zustand';

interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface ChatState {
  conversations: any[];
  messages: Record<number, Message[]>;
  typingUsers: Record<number, boolean>;
  setConversations: (conversations: any[]) => void;
  setMessages: (conversationId: number, messages: Message[]) => void;
  appendMessage: (message: Message) => void;
  setTyping: (conversationId: number, isTyping: boolean) => void;
  markConversationRead: (conversationId: number, myUserId: number) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  messages: {},
  typingUsers: {},

  setConversations: (conversations) => set({ conversations }),

  setMessages: (conversationId, messages) =>
    set((state) => ({ messages: { ...state.messages, [conversationId]: messages } })),

  appendMessage: (message) =>
    set((state) => {
      const existing = state.messages[message.conversationId] ?? [];
      const updated = [...existing, message];
      const conversations = state.conversations.map((c) =>
        c.id === message.conversationId
          ? { ...c, lastMessageAt: message.createdAt, messages: [message] }
          : c,
      );
      return { messages: { ...state.messages, [message.conversationId]: updated }, conversations };
    }),

  setTyping: (conversationId, isTyping) =>
    set((state) => ({ typingUsers: { ...state.typingUsers, [conversationId]: isTyping } })),

  markConversationRead: (conversationId, myUserId) =>
    set((state) => {
      const msgs = state.messages[conversationId]?.map((m) =>
        m.senderId !== myUserId ? { ...m, isRead: true } : m,
      );
      return msgs ? { messages: { ...state.messages, [conversationId]: msgs } } : state;
    }),
}));
