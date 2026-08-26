import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../config';

// In-memory token cache — avoids an AsyncStorage disk read on every request
let _cachedToken: string | null = null;
export function setCachedToken(token: string | null) {
  _cachedToken = token;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request — uses memory cache, no disk I/O per request
api.interceptors.request.use((config) => {
  if (_cachedToken) config.headers.Authorization = `Bearer ${_cachedToken}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error.response?.status === 401) {
      setCachedToken(null);
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  },
);

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  updateFcmToken: (fcmToken: string) => api.patch('/auth/fcm-token', { fcmToken }),
};

// ─── Lawyers ───────────────────────────────────────────────────────────────
export const lawyersApi = {
  search: (params: any) => api.get('/lawyers/search', { params }),
  getProfile: (id: number) => api.get(`/lawyers/${id}`),
  getMyProfile: () => api.get('/lawyers/me'),
  updateProfile: (data: any) => api.patch('/lawyers/me', data),
  getAvailability: (id: number) => api.get(`/lawyers/${id}/availability`),
  setAvailability: (slots: any[]) => api.post('/lawyers/me/availability', { slots }),
  uploadPhoto: (form: FormData) =>
    api.post('/lawyers/me/photo', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadBarCouncilDoc: (form: FormData) =>
    api.post('/lawyers/me/bar-council-doc', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getSpecializations: () => api.get('/lawyers/specializations'),
};

// ─── Clients ───────────────────────────────────────────────────────────────
export const clientsApi = {
  getMyProfile: () => api.get('/clients/me'),
  updateProfile: (data: any) => api.patch('/clients/me', data),
  uploadPhoto: (form: FormData) =>
    api.post('/clients/me/photo', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// ─── Appointments ──────────────────────────────────────────────────────────
export const appointmentsApi = {
  getAvailableSlots: (lawyerId: number, date: string) =>
    api.get('/appointments/available-slots', { params: { lawyerId, date } }),
  book: (data: any) => api.post('/appointments', data),
  getMyAppointments: () => api.get('/appointments/my'),
  getLawyerAppointments: () => api.get('/appointments/lawyer'),
  updateStatus: (id: number, data: any) => api.patch(`/appointments/${id}/status`, data),
};

// ─── Chat ──────────────────────────────────────────────────────────────────
export const chatApi = {
  getConversations: () => api.get('/chat/conversations'),
  getOrCreateConversation: (lawyerProfileId: number) =>
    api.post('/chat/conversations', { lawyerProfileId }),
  getMessages: (conversationId: number, page = 1) =>
    api.get(`/chat/conversations/${conversationId}/messages`, { params: { page } }),
};

// ─── Diary ─────────────────────────────────────────────────────────────────
export const diaryApi = {
  getEntries: (type?: string) => api.get('/diary', { params: type ? { type } : undefined }),
  getEntry: (id: number) => api.get(`/diary/${id}`),
  createEntry: (data: any) => api.post('/diary', data),
  updateEntry: (id: number, data: any) => api.patch(`/diary/${id}`, data),
  deleteEntry: (id: number) => api.delete(`/diary/${id}`),
};

// ─── Reviews ───────────────────────────────────────────────────────────────
export const reviewsApi = {
  create: (data: any) => api.post('/reviews', data),
  getLawyerReviews: (lawyerId: number, page = 1) =>
    api.get(`/reviews/lawyer/${lawyerId}`, { params: { page } }),
};

// ─── AI ────────────────────────────────────────────────────────────────────
export const aiApi = {
  chat: (data: { message: string; mode: 'CLIENT' | 'LAWYER'; context?: string }) =>
    api.post('/ai/chat', data),
};

// ─── Cases ─────────────────────────────────────────────────────────────────
export const casesApi = {
  create: (data: any) => api.post('/cases', data),
  getAll: (params?: any) => api.get('/cases', { params }),
  getMyCases: () => api.get('/cases/my'), // CLIENT
  getOne: (id: number) => api.get(`/cases/${id}`),
  getTimeline: (id: number) => api.get(`/cases/${id}/timeline`),
  update: (id: number, data: any) => api.patch(`/cases/${id}`, data),
  close: (id: number) => api.delete(`/cases/${id}`),
};

// ─── Hearings ──────────────────────────────────────────────────────────────
export const hearingsApi = {
  create: (data: any) => api.post('/hearings', data),
  getByCaseId: (caseId: number) => api.get(`/hearings/case/${caseId}`),
  getUpcoming: (days?: number) => api.get('/hearings/upcoming', { params: days ? { days } : undefined }),
  update: (id: number, data: any) => api.patch(`/hearings/${id}`, data),
  adjourn: (id: number, data: any) => api.post(`/hearings/${id}/adjourn`, data),
  remove: (id: number) => api.delete(`/hearings/${id}`),
};

// ─── Documents ─────────────────────────────────────────────────────────────
export const documentsApi = {
  upload: (caseId: number, title: string, category: string, form: FormData) =>
    api.post('/documents/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { caseId, title, category },
    }),
  getByCaseId: (caseId: number) => api.get(`/documents/case/${caseId}`),
  update: (id: number, data: any) => api.patch(`/documents/${id}`, data),
  toggleShare: (id: number) => api.post(`/documents/${id}/share`),
  remove: (id: number) => api.delete(`/documents/${id}`),
  requestSignature: (id: number, requestedToUserId: number) =>
    api.post(`/documents/${id}/sign-request`, { requestedToUserId }),
  getMySignatureRequests: () => api.get('/documents/signature-requests/my'),
  sign: (requestId: number, signatureImageUrl: string) =>
    api.post(`/documents/signature-requests/${requestId}/sign`, { signatureImageUrl }),
  decline: (requestId: number, reason?: string) =>
    api.post(`/documents/signature-requests/${requestId}/decline`, { reason }),
};

// ─── Firm ──────────────────────────────────────────────────────────────────
export const firmApi = {
  create: (data: any) => api.post('/firm', data),
  getMyFirm: () => api.get('/firm/my'),
  update: (data: any) => api.patch('/firm', data),
  inviteMember: (data: any) => api.post('/firm/invite', data),
  removeMember: (memberId: number) => api.delete(`/firm/members/${memberId}`),
  updateMemberRole: (memberId: number, role: string) =>
    api.patch(`/firm/members/${memberId}/role`, { role }),
};

// ─── Calendar ──────────────────────────────────────────────────────────────
export const calendarApi = {
  getEvents: (startDate: string, endDate: string) =>
    api.get('/calendar', { params: { startDate, endDate } }),
};

// ─── Analytics ─────────────────────────────────────────────────────────────
export const analyticsApi = {
  getOverview: () => api.get('/analytics/overview'),
  getCasesByType: () => api.get('/analytics/cases-by-type'),
  getCaseStatusDistribution: () => api.get('/analytics/case-status-distribution'),
  getHearingsThisMonth: () => api.get('/analytics/hearings-this-month'),
  getRecentActivity: (limit?: number) =>
    api.get('/analytics/recent-activity', { params: limit ? { limit } : undefined }),
};

export default api;
