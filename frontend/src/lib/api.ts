import axios from 'axios';
import type {
  AdminSurveySummary,
  Answers,
  SurveyHistoryEntry,
  SurveyAnalytics,
  SurveyDetail,
  SurveyInput,
  SurveyStatus,
  User,
  UserSurvey,
  UserSurveySummary,
} from './types';

const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL ?? '').replace(/\/+$/, '');
const API_ROOT = API_BASE_URL ? (API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`) : '/api';

const apiClient = axios.create({
  baseURL: API_ROOT,
  withCredentials: true,
});

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string>;

  constructor(message: string, status: number, errors?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    const response = await apiClient.request<T>({
      url: path,
      method: options.method ?? 'GET',
      data: options.body,
      headers: options.body === undefined ? undefined : { 'Content-Type': 'application/json' },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const payload = (error.response?.data ?? {}) as Record<string, unknown>;
      const message =
        typeof payload === 'object' && payload !== null && 'message' in payload
          ? String(payload.message)
          : error.message || 'The request could not be completed.';
      const errors =
        typeof payload === 'object' && payload !== null && 'errors' in payload
          ? ((payload.errors as Record<string, string>) ?? undefined)
          : undefined;

      throw new ApiError(message, error.response?.status ?? 500, errors);
    }

    throw error;
  }
}

export const api = {
  login(email: string, password: string) {
    return request<{ user: User }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },
  register(name: string, email: string, password: string) {
    return request<{ user: User }>('/auth/register', {
      method: 'POST',
      body: { name, email, password },
    });
  },
  logout() {
    return request<{ ok: boolean }>('/auth/logout', { method: 'POST' });
  },
  me() {
    return request<{ user: User }>('/auth/me');
  },
  listSurveys() {
    return request<{ surveys: AdminSurveySummary[] }>('/surveys');
  },
  getSurvey(id: string) {
    return request<{ survey: SurveyDetail }>(`/surveys/${id}`);
  },
  createSurvey(input: SurveyInput) {
    return request<{ survey: SurveyDetail }>('/surveys', { method: 'POST', body: input });
  },
  updateSurvey(id: string, input: SurveyInput) {
    return request<{ survey: SurveyDetail }>(`/surveys/${id}`, { method: 'PUT', body: input });
  },
  setSurveyStatus(id: string, published: boolean) {
    return request<{ survey: { id: string; status: SurveyStatus } }>(`/surveys/${id}/status`, {
      method: 'PATCH',
      body: { published },
    });
  },
  deleteSurvey(id: string) {
    return request<{ ok: boolean }>(`/surveys/${id}`, { method: 'DELETE' });
  },
  getAnalytics(id: string) {
    return request<SurveyAnalytics>(`/surveys/${id}/analytics`);
  },
  listUserSurveys() {
    return request<{ surveys: UserSurveySummary[] }>('/user/surveys');
  },
  getUserSurvey(id: string) {
    return request<{ survey: UserSurvey }>(`/user/surveys/${id}`);
  },
  submitResponse(id: string, answers: Answers) {
    return request<{ response: { id: string; submittedAt: string } }>(
      `/user/surveys/${id}/responses`,
      { method: 'POST', body: { answers } },
    );
  },
  getHistory() {
    return request<{ history: SurveyHistoryEntry[] }>('/user/history');
  },
};
