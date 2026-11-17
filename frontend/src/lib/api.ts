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
  const response = await fetch(`/api${path}`, {
    method: options.method ?? 'GET',
    credentials: 'include',
    headers: options.body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const hasBody = response.status !== 204;
  const payload = hasBody ? await response.json().catch(() => ({})) : {};

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null && 'message' in payload
        ? String((payload as { message: unknown }).message)
        : 'The request could not be completed.';
    const errors =
      typeof payload === 'object' && payload !== null && 'errors' in payload
        ? ((payload as { errors?: Record<string, string> }).errors ?? undefined)
        : undefined;
    throw new ApiError(message, response.status, errors);
  }

  return payload as T;
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
