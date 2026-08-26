import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('conversations')
  getMyConversations(@CurrentUser() user: any) {
    return this.chatService.getMyConversations(user.id, user.role);
  }

  @Post('conversations')
  getOrCreateConversation(@CurrentUser() user: any, @Body() body: { lawyerProfileId: number }) {
    return this.chatService.getOrCreateConversation(user.id, body.lawyerProfileId);
  }

  @Get('conversations/:id/messages')
  getMessages(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page = 1,
    @Query('limit') limit = 30,
  ) {
    return this.chatService.getMessages(id, Number(page), Number(limit));
  }
}
