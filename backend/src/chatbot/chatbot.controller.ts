import { Controller, Post, Body } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { IsString, IsNotEmpty, IsArray, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

class ChatHistoryMessageDto {
  @IsString()
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsString()
  @IsNotEmpty()
  content: string;
}

class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  customer_code: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryMessageDto)
  history: ChatHistoryMessageDto[];
}

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  async sendMessage(@Body() dto: SendMessageDto) {
    const reply = await this.chatbotService.sendMessage(
      dto.message,
      dto.customer_code,
      dto.history,
    );
    return { reply };
  }
}
