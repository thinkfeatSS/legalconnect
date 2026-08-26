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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
let ChatService = class ChatService {
    prisma;
    notifications;
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    async getOrCreateConversation(clientUserId, lawyerProfileId) {
        const clientProfile = await this.prisma.clientProfile.findUnique({ where: { userId: clientUserId } });
        if (!clientProfile)
            throw new common_1.NotFoundException('Client profile not found');
        const existing = await this.prisma.conversation.findUnique({
            where: { clientId_lawyerId: { clientId: clientProfile.id, lawyerId: lawyerProfileId } },
        });
        if (existing)
            return existing;
        return this.prisma.conversation.create({
            data: { clientId: clientProfile.id, lawyerId: lawyerProfileId },
        });
    }
    async getMyConversations(userId, role) {
        if (role === 'CLIENT') {
            const profile = await this.prisma.clientProfile.findUnique({ where: { userId } });
            if (!profile)
                return [];
            const conversations = await this.prisma.conversation.findMany({
                where: { clientId: profile.id },
                include: {
                    lawyer: { select: { fullName: true, photoUrl: true } },
                    messages: { orderBy: { createdAt: 'desc' }, take: 1 },
                    _count: { select: { messages: { where: { isRead: false, senderId: { not: userId } } } } },
                },
                orderBy: { lastMessageAt: 'desc' },
            });
            return conversations.map((c) => ({ ...c, unreadCount: c._count.messages, _count: undefined }));
        }
        else {
            const profile = await this.prisma.lawyerProfile.findUnique({ where: { userId } });
            if (!profile)
                return [];
            const conversations = await this.prisma.conversation.findMany({
                where: { lawyerId: profile.id },
                include: {
                    client: { select: { fullName: true, photoUrl: true } },
                    messages: { orderBy: { createdAt: 'desc' }, take: 1 },
                    _count: { select: { messages: { where: { isRead: false, senderId: { not: userId } } } } },
                },
                orderBy: { lastMessageAt: 'desc' },
            });
            return conversations.map((c) => ({ ...c, unreadCount: c._count.messages, _count: undefined }));
        }
    }
    async getMessages(conversationId, page = 1, limit = 30) {
        const messages = await this.prisma.message.findMany({
            where: { conversationId },
            include: { sender: { select: { id: true, role: true } } },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return messages.reverse();
    }
    async saveMessage(conversationId, senderId, content, type = 'TEXT', fileUrl) {
        const message = await this.prisma.message.create({
            data: { conversationId, senderId, content, type: type, fileUrl },
            include: { sender: { select: { id: true, role: true } } },
        });
        await this.prisma.conversation.update({
            where: { id: conversationId },
            data: { lastMessageAt: new Date() },
        });
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                client: { include: { user: { select: { id: true, fcmToken: true } } } },
                lawyer: { include: { user: { select: { id: true, fcmToken: true } } } },
            },
        });
        if (conversation) {
            const recipientUser = conversation.client.user.id === senderId
                ? conversation.lawyer.user
                : conversation.client.user;
            if (recipientUser?.fcmToken) {
                await this.notifications.sendPushNotification(recipientUser.fcmToken, 'New Message', content.length > 60 ? content.substring(0, 60) + '...' : content, { type: 'NEW_MESSAGE', conversationId: String(conversationId) });
            }
        }
        return message;
    }
    async markRead(conversationId, userId) {
        await this.prisma.message.updateMany({
            where: { conversationId, isRead: false, senderId: { not: userId } },
            data: { isRead: true },
        });
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], ChatService);
