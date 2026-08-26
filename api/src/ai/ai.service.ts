import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum AiMode {
  CLIENT = 'CLIENT',
  LAWYER = 'LAWYER',
}

export class AiChatDto {
  @IsString()
  message: string;

  @IsEnum(AiMode)
  mode: AiMode;

  @IsOptional()
  @IsString()
  context?: string;
}

const CLIENT_SYSTEM_PROMPT = `You are a helpful legal information assistant for LegalConnect, a platform connecting clients with lawyers in Pakistan. 

Your role is to:
- Provide general legal information and guidance based on Pakistani law
- Help users understand legal terms and procedures
- Suggest what type of lawyer they might need
- Explain what steps to take in common legal situations

IMPORTANT RULES:
- Always recommend consulting a qualified lawyer for specific legal advice
- Never provide specific legal advice that substitutes professional counsel
- Always add the disclaimer at the end of every response
- Be empathetic and clear in your explanations
- Focus on Pakistani law and legal system`;

const LAWYER_SYSTEM_PROMPT = `You are an AI legal assistant for lawyers on LegalConnect, a platform in Pakistan.

Your role is to:
- Help draft legal notices, letters, and documents
- Summarize legal cases and documents
- Suggest legal arguments and precedents
- Help with legal research
- Format legal documents properly

Context: You are assisting qualified Pakistani lawyers. Provide professional, detailed legal assistance.
Always note that AI-generated content should be reviewed and validated by the lawyer before use.`;

const CLIENT_DISCLAIMER = '\n\n⚠️ *Disclaimer: This information is for general guidance only and does not constitute legal advice. Please consult a qualified lawyer for advice specific to your situation.*';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private readonly logger = new Logger(AiService.name);

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      this.logger.warn('GEMINI_API_KEY not set — AI module disabled');
    }
  }

  async chat(dto: AiChatDto): Promise<{ response: string; disclaimer: string }> {
    if (!this.genAI) {
      return {
        response: 'AI assistant is currently unavailable. Please try again later.',
        disclaimer: CLIENT_DISCLAIMER,
      };
    }

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: dto.mode === AiMode.CLIENT ? CLIENT_SYSTEM_PROMPT : LAWYER_SYSTEM_PROMPT,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });

    const prompt = dto.context
      ? `Context: ${dto.context}\n\nQuestion: ${dto.message}`
      : dto.message;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return {
        response: text,
        disclaimer: dto.mode === AiMode.CLIENT ? CLIENT_DISCLAIMER : '',
      };
    } catch (err: any) {
      if (err?.status === 429) {
        this.logger.warn('Gemini rate limit hit');
        return {
          response: 'The AI assistant is temporarily unavailable due to high demand. Please try again in a few minutes.',
          disclaimer: '',
        };
      }
      throw err;
    }
  }
}
