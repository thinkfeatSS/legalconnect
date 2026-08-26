"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ChatGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const chat_service_1 = require("./chat.service");
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
let ChatGateway = ChatGateway_1 = class ChatGateway {
    chatService;
    jwt;
    config;
    server;
    logger = new common_1.Logger(ChatGateway_1.name);
    userSocketMap = new Map();
    constructor(chatService, jwt, config) {
        this.chatService = chatService;
        this.jwt = jwt;
        this.config = config;
    }
    async afterInit(server) {
        const redisUrl = this.config.get('REDIS_URL');
        if (!redisUrl) {
            this.logger.warn('REDIS_URL not set — using in-memory Socket.io adapter');
            return;
        }
        try {
            const [{ createAdapter }, { default: Redis }] = await Promise.all([
                import('@socket.io/redis-adapter'),
                import('ioredis'),
            ]);
            const pubClient = new Redis(redisUrl, { lazyConnect: true, enableOfflineQueue: false });
            const subClient = pubClient.duplicate();
            pubClient.on('error', (err) => this.logger.warn(`Redis pub error: ${err.message}`));
            subClient.on('error', (err) => this.logger.warn(`Redis sub error: ${err.message}`));
            await pubClient.connect();
            await subClient.connect();
            const rootServer = server.server ?? server;
            rootServer.adapter(createAdapter(pubClient, subClient));
            this.logger.log('Socket.io Redis adapter connected');
        }
        catch (err) {
            this.logger.warn(`Redis not available — falling back to in-memory: ${err.message}`);
        }
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
            const payload = this.jwt.verify(token);
            client.data.userId = payload.sub;
            client.data.role = payload.role;
            this.userSocketMap.set(payload.sub, client.id);
            this.logger.log(`Client connected: userId=${payload.sub}`);
        }
        catch {
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        if (client.data.userId) {
            this.userSocketMap.delete(client.data.userId);
        }
    }
    async joinConversation(client, data) {
        await client.join(`conversation_${data.conversationId}`);
        return { joined: true };
    }
    async handleMessage(client, data) {
        const message = await this.chatService.saveMessage(data.conversationId, client.data.userId, data.content, data.type, data.fileUrl);
        this.server.to(`conversation_${data.conversationId}`).emit('message', message);
        return message;
    }
    handleTyping(client, data) {
        client.to(`conversation_${data.conversationId}`).emit('typing_indicator', {
            userId: client.data.userId,
            conversationId: data.conversationId,
            isTyping: data.isTyping,
        });
    }
    async handleMarkRead(client, data) {
        await this.chatService.markRead(data.conversationId, client.data.userId);
        client.to(`conversation_${data.conversationId}`).emit('message_read', {
            conversationId: data.conversationId,
            readBy: client.data.userId,
        });
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_conversation'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "joinConversation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send_message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleTyping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('mark_read'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMarkRead", null);
exports.ChatGateway = ChatGateway = ChatGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: '*' },
        namespace: '/chat',
    }),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        jwt_1.JwtService,
        config_1.ConfigService])
], ChatGateway);
