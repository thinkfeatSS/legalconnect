"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const prisma_module_1 = require("./prisma/prisma.module");
const uploads_module_1 = require("./uploads/uploads.module");
const notifications_module_1 = require("./notifications/notifications.module");
const auth_module_1 = require("./auth/auth.module");
const lawyers_module_1 = require("./lawyers/lawyers.module");
const clients_module_1 = require("./clients/clients.module");
const search_module_1 = require("./search/search.module");
const appointments_module_1 = require("./appointments/appointments.module");
const chat_module_1 = require("./chat/chat.module");
const diary_module_1 = require("./diary/diary.module");
const reviews_module_1 = require("./reviews/reviews.module");
const ai_module_1 = require("./ai/ai.module");
const cases_module_1 = require("./cases/cases.module");
const hearings_module_1 = require("./hearings/hearings.module");
const documents_module_1 = require("./documents/documents.module");
const firm_module_1 = require("./firm/firm.module");
const calendar_module_1 = require("./calendar/calendar.module");
const analytics_module_1 = require("./analytics/analytics.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            uploads_module_1.UploadsModule,
            notifications_module_1.NotificationsModule,
            auth_module_1.AuthModule,
            lawyers_module_1.LawyersModule,
            clients_module_1.ClientsModule,
            search_module_1.SearchModule,
            appointments_module_1.AppointmentsModule,
            chat_module_1.ChatModule,
            diary_module_1.DiaryModule,
            reviews_module_1.ReviewsModule,
            ai_module_1.AiModule,
            cases_module_1.CasesModule,
            hearings_module_1.HearingsModule,
            documents_module_1.DocumentsModule,
            firm_module_1.FirmModule,
            calendar_module_1.CalendarModule,
            analytics_module_1.AnalyticsModule,
        ],
    })
], AppModule);
