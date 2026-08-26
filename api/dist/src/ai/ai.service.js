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
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = exports.AiChatDto = exports.AiMode = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const generative_ai_1 = require("@google/generative-ai");
const class_validator_1 = require("class-validator");
var AiMode;
(function (AiMode) {
    AiMode["CLIENT"] = "CLIENT";
    AiMode["LAWYER"] = "LAWYER";
})(AiMode || (exports.AiMode = AiMode = {}));
class AiChatDto {
    message;
    mode;
    context;
}
exports.AiChatDto = AiChatDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AiChatDto.prototype, "message", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(AiMode),
    __metadata("design:type", String)
], AiChatDto.prototype, "mode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AiChatDto.prototype, "context", void 0);
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
let AiService = AiService_1 = class AiService {
    config;
    genAI;
    logger = new common_1.Logger(AiService_1.name);
    constructor(config) {
        this.config = config;
        const apiKey = this.config.get('GEMINI_API_KEY');
        if (apiKey) {
            this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        }
        else {
            this.logger.warn('GEMINI_API_KEY not set — AI module disabled');
        }
    }
    async chat(dto) {
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
                { category: generative_ai_1.HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: generative_ai_1.HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
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
        }
        catch (err) {
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
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AiService);
