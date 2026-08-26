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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const google_auth_library_1 = require("google-auth-library");
const axios_1 = __importDefault(require("axios"));
let NotificationsService = NotificationsService_1 = class NotificationsService {
    config;
    logger = new common_1.Logger(NotificationsService_1.name);
    googleAuth = null;
    projectId = null;
    constructor(config) {
        this.config = config;
    }
    onModuleInit() {
        const raw = this.config.get('FIREBASE_SERVICE_ACCOUNT_JSON');
        if (!raw) {
            this.logger.warn('FIREBASE_SERVICE_ACCOUNT_JSON not set — push notifications disabled');
            return;
        }
        try {
            let credentials;
            if (typeof raw === 'object') {
                credentials = raw;
            }
            else {
                let str = String(raw).trim();
                if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
                    str = str.slice(1, -1).trim();
                }
                if (str.startsWith('\\')) {
                    str = str.slice(1);
                }
                try {
                    credentials = JSON.parse(str);
                }
                catch {
                    if (!str.startsWith('{')) {
                        try {
                            const decoded = Buffer.from(str, 'base64').toString('utf8');
                            credentials = JSON.parse(decoded);
                        }
                        catch {
                        }
                    }
                    if (!credentials) {
                        try {
                            const sanitized = str.replace(/\\([^"\\\/bfnrtu])/g, '$1');
                            credentials = JSON.parse(sanitized);
                        }
                        catch {
                        }
                    }
                }
            }
            if (credentials && credentials.project_id && credentials.private_key) {
                this.projectId = credentials.project_id;
                this.googleAuth = new google_auth_library_1.GoogleAuth({
                    credentials,
                    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
                });
                this.logger.log(`✓ FCM initialized successfully for project: ${this.projectId}`);
            }
            else {
                this.logger.warn('FIREBASE_SERVICE_ACCOUNT_JSON invalid or missing required keys — push notifications disabled');
            }
        }
        catch (err) {
            this.logger.warn(`Could not initialize FCM (${err.message}) — push notifications disabled`);
        }
    }
    async getAccessToken() {
        if (!this.googleAuth)
            return null;
        try {
            return (await this.googleAuth.getAccessToken()) ?? null;
        }
        catch (err) {
            this.logger.error(`Failed to get FCM access token: ${err.message}`);
            return null;
        }
    }
    async sendPushNotification(fcmToken, title, body, data) {
        if (!this.googleAuth || !this.projectId)
            return;
        const accessToken = await this.getAccessToken();
        if (!accessToken)
            return;
        try {
            await axios_1.default.post(`https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`, {
                message: {
                    token: fcmToken,
                    notification: { title, body },
                    data,
                    android: { priority: 'high' },
                    apns: { payload: { aps: { sound: 'default' } } },
                },
            }, { headers: { Authorization: `Bearer ${accessToken}` } });
        }
        catch (err) {
            this.logger.error(`FCM send failed: ${err.response?.data?.error?.message ?? err.message}`);
        }
    }
    async sendToMultiple(fcmTokens, title, body, data) {
        if (!this.googleAuth || !this.projectId || !fcmTokens.length)
            return;
        await Promise.allSettled(fcmTokens.map((token) => this.sendPushNotification(token, title, body, data)));
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], NotificationsService);
