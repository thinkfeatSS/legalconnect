import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AiChatDto, AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('chat')
  chat(@Body() dto: AiChatDto) {
    return this.aiService.chat(dto);
  }
}
