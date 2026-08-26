import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOCKET_BASE_URL } from '../config';


class SocketService {
  private socket: Socket | null = null;

  async connect() {
    if (this.socket?.connected) return;
    const token = await AsyncStorage.getItem('accessToken');
    this.socket = io(`${SOCKET_BASE_URL}/chat`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => console.log('[Socket] Connected'));
    this.socket.on('disconnect', (reason) => console.log('[Socket] Disconnected:', reason));
    this.socket.on('connect_error', (err) => console.log('[Socket] Error:', err.message));
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  joinConversation(conversationId: number) {
    this.socket?.emit('join_conversation', { conversationId });
  }

  sendMessage(conversationId: number, content: string, type = 'TEXT') {
    this.socket?.emit('send_message', { conversationId, content, type });
  }

  sendTyping(conversationId: number, isTyping: boolean) {
    this.socket?.emit('typing', { conversationId, isTyping });
  }

  markRead(conversationId: number) {
    this.socket?.emit('mark_read', { conversationId });
  }

  onMessage(callback: (msg: any) => void) {
    this.socket?.on('message', callback);
    return () => this.socket?.off('message', callback);
  }

  onTyping(callback: (data: any) => void) {
    this.socket?.on('typing_indicator', callback);
    return () => this.socket?.off('typing_indicator', callback);
  }

  onMessageRead(callback: (data: any) => void) {
    this.socket?.on('message_read', callback);
    return () => this.socket?.off('message_read', callback);
  }

  isConnected() {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
