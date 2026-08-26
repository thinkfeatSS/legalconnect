import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async getOrCreateConversation(clientUserId: number, lawyerProfileId: number) {
    const clientProfile = await this.prisma.clientProfile.findUnique({ where: { userId: clientUserId } });
    if (!clientProfile) throw new NotFoundException('Client profile not found');

    const existing = await this.prisma.conversation.findUnique({
      where: { clientId_lawyerId: { clientId: clientProfile.id, lawyerId: lawyerProfileId } },
    });
    if (existing) return existing;

    return this.prisma.conversation.create({
      data: { clientId: clientProfile.id, lawyerId: lawyerProfileId },
    });
  }

  async getMyConversations(userId: number, role: string) {
    if (role === 'CLIENT') {
      const profile = await this.prisma.clientProfile.findUnique({ where: { userId } });
      if (!profile) return [];
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
    } else {
      const profile = await this.prisma.lawyerProfile.findUnique({ where: { userId } });
      if (!profile) return [];
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

  async getMessages(conversationId: number, page = 1, limit = 30) {
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      include: { sender: { select: { id: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return messages.reverse();
  }

  async saveMessage(conversationId: number, senderId: number, content: string, type = 'TEXT', fileUrl?: string) {
    const message = await this.prisma.message.create({
      data: { conversationId, senderId, content, type: type as any, fileUrl },
      include: { sender: { select: { id: true, role: true } } },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // Push notification to offline recipient
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        client: { include: { user: { select: { id: true, fcmToken: true } } } },
        lawyer: { include: { user: { select: { id: true, fcmToken: true } } } },
      },
    });

    if (conversation) {
      const recipientUser =
        conversation.client.user.id === senderId
          ? conversation.lawyer.user
          : conversation.client.user;

      if (recipientUser?.fcmToken) {
        await this.notifications.sendPushNotification(
          recipientUser.fcmToken,
          'New Message',
          content.length > 60 ? content.substring(0, 60) + '...' : content,
          { type: 'NEW_MESSAGE', conversationId: String(conversationId) },
        );
      }
    }

    return message;
  }

  async markRead(conversationId: number, userId: number) {
    await this.prisma.message.updateMany({
      where: { conversationId, isRead: false, senderId: { not: userId } },
      data: { isRead: true },
    });
  }
}
