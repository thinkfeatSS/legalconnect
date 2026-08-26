import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { UploadsModule } from './uploads/uploads.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuthModule } from './auth/auth.module';
import { LawyersModule } from './lawyers/lawyers.module';
import { ClientsModule } from './clients/clients.module';
import { SearchModule } from './search/search.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ChatModule } from './chat/chat.module';
import { DiaryModule } from './diary/diary.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AiModule } from './ai/ai.module';
import { CasesModule } from './cases/cases.module';
import { HearingsModule } from './hearings/hearings.module';
import { DocumentsModule } from './documents/documents.module';
import { FirmModule } from './firm/firm.module';
import { CalendarModule } from './calendar/calendar.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    UploadsModule,
    NotificationsModule,
    AuthModule,
    LawyersModule,
    ClientsModule,
    SearchModule,
    AppointmentsModule,
    ChatModule,
    DiaryModule,
    ReviewsModule,
    AiModule,
    CasesModule,
    HearingsModule,
    DocumentsModule,
    FirmModule,
    CalendarModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
