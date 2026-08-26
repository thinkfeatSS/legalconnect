import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { OnGatewayInit } from '@nestjs/websockets';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private userSocketMap = new Map<number, string>(); // userId -> socketId

  constructor(
    private chatService: ChatService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async afterInit(server: Server) {
    const redisUrl = this.config.get<string>('REDIS_URL');
    if (!redisUrl) {
      this.logger.warn('REDIS_URL not set — using in-memory Socket.io adapter');
      return;
    }
    try {
      const [{ createAdapter }, { default: Redis }] = await Promise.all([
        import('@socket.io/redis-adapter'),
        import('ioredis'),
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pubClient = new (Redis as any)(redisUrl, { lazyConnect: true, enableOfflineQueue: false });
      const subClient = pubClient.duplicate();
      pubClient.on('error', (err) => this.logger.warn(`Redis pub error: ${err.message}`));
      subClient.on('error', (err) => this.logger.warn(`Redis sub error: ${err.message}`));
      await pubClient.connect();
      await subClient.connect();
      const rootServer = (server as any).server ?? server;
      rootServer.adapter(createAdapter(pubClient, subClient));
      this.logger.log('Socket.io Redis adapter connected');
    } catch (err) {
      this.logger.warn(`Redis not available — falling back to in-memory: ${err.message}`);
    }
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      const payload = this.jwt.verify(token);
      client.data.userId = payload.sub;
      client.data.role = payload.role;
      this.userSocketMap.set(payload.sub, client.id);
      this.logger.log(`Client connected: userId=${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.userId) {
      this.userSocketMap.delete(client.data.userId);
    }
  }

  @SubscribeMessage('join_conversation')
  async joinConversation(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: number }) {
    await client.join(`conversation_${data.conversationId}`);
    return { joined: true };
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number; content: string; type?: string; fileUrl?: string },
  ) {
    const message = await this.chatService.saveMessage(
      data.conversationId,
      client.data.userId,
      data.content,
      data.type,
      data.fileUrl,
    );

    this.server.to(`conversation_${data.conversationId}`).emit('message', message);
    return message;
  }

  @SubscribeMessage('typing')
  handleTyping(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: number; isTyping: boolean }) {
    client.to(`conversation_${data.conversationId}`).emit('typing_indicator', {
      userId: client.data.userId,
      conversationId: data.conversationId,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: number }) {
    await this.chatService.markRead(data.conversationId, client.data.userId);
    client.to(`conversation_${data.conversationId}`).emit('message_read', {
      conversationId: data.conversationId,
      readBy: client.data.userId,
    });
  }
}
