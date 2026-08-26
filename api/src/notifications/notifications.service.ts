import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleAuth } from 'google-auth-library';
import axios from 'axios';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private googleAuth: GoogleAuth | null = null;
  private projectId: string | null = null;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const raw = this.config.get<any>('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (!raw) {
      this.logger.warn('FIREBASE_SERVICE_ACCOUNT_JSON not set — push notifications disabled');
      return;
    }

    try {
      let credentials: any;

      if (typeof raw === 'object') {
        credentials = raw;
      } else {
        let str = String(raw).trim();

        // Strip leading/trailing quotes if passed as "..." or '...'
        if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
          str = str.slice(1, -1).trim();
        }

        // Strip stray leading backslash
        if (str.startsWith('\\')) {
          str = str.slice(1);
        }

        // Try direct JSON.parse first
        try {
          credentials = JSON.parse(str);
        } catch {
          // If direct parse fails and doesn't look like raw JSON, attempt Base64 decode
          if (!str.startsWith('{')) {
            try {
              const decoded = Buffer.from(str, 'base64').toString('utf8');
              credentials = JSON.parse(decoded);
            } catch {
              // continue to sanitize
            }
          }

          // If still not parsed, attempt sanitizing bad escaped characters
          if (!credentials) {
            try {
              const sanitized = str.replace(/\\([^"\\\/bfnrtu])/g, '$1');
              credentials = JSON.parse(sanitized);
            } catch {
              // ignore
            }
          }
        }
      }

      if (credentials && credentials.project_id && credentials.private_key) {
        this.projectId = credentials.project_id;
        this.googleAuth = new GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
        });
        this.logger.log(`✓ FCM initialized successfully for project: ${this.projectId}`);
      } else {
        this.logger.warn('FIREBASE_SERVICE_ACCOUNT_JSON invalid or missing required keys — push notifications disabled');
      }
    } catch (err: any) {
      this.logger.warn(`Could not initialize FCM (${err.message}) — push notifications disabled`);
    }
  }

  private async getAccessToken(): Promise<string | null> {
    if (!this.googleAuth) return null;
    try {
      return (await this.googleAuth.getAccessToken()) ?? null;
    } catch (err) {
      this.logger.error(`Failed to get FCM access token: ${err.message}`);
      return null;
    }
  }

  async sendPushNotification(
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!this.googleAuth || !this.projectId) return;
    const accessToken = await this.getAccessToken();
    if (!accessToken) return;
    try {
      await axios.post(
        `https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`,
        {
          message: {
            token: fcmToken,
            notification: { title, body },
            data,
            android: { priority: 'high' },
            apns: { payload: { aps: { sound: 'default' } } },
          },
        },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
    } catch (err) {
      this.logger.error(`FCM send failed: ${err.response?.data?.error?.message ?? err.message}`);
    }
  }

  async sendToMultiple(fcmTokens: string[], title: string, body: string, data?: Record<string, string>): Promise<void> {
    if (!this.googleAuth || !this.projectId || !fcmTokens.length) return;
    await Promise.allSettled(
      fcmTokens.map((token) => this.sendPushNotification(token, title, body, data)),
    );
  }
}
