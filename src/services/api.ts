import type { AuthSession, AuthUser } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const TOKEN_STORAGE_KEY = 'cvba_api_token';
const USER_STORAGE_KEY = 'cvba_api_user';

export interface ApiEnvelope<T> {
  data: T;
}

export interface ApiListEnvelope<T> {
  data: T[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

interface LoginResponse {
  token_type: 'Bearer';
  access_token: string;
  user: AuthUser;
}

interface ApiErrorBody {
  message?: string;
  errors?: Record<string, string[]>;
}

export class ApiRequestError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.errors = errors;
  }
}

const readErrorMessage = async (response: Response) => {
  try {
    const body = (await response.json()) as ApiErrorBody;
    const firstFieldError = body.errors ? Object.values(body.errors)[0]?.[0] : undefined;

    return {
      message: firstFieldError || body.message || 'Permintaan API gagal.',
      errors: body.errors,
    };
  } catch {
    return {
      message: 'Permintaan API gagal.',
      errors: undefined,
    };
  }
};

export const authStorage = {
  getToken() {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  },
  getUser() {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },
  setSession(session: AuthSession) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, session.token);
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(session.user));
  },
  clear() {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(USER_STORAGE_KEY);
  },
};

export const apiClient = {
  async request<T>(path: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers);
    headers.set('Accept', 'application/json');

    if (!(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const token = authStorage.getToken();

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      authStorage.clear();
      throw new ApiRequestError('Sesi berakhir. Silakan masuk ulang.', response.status);
    }

    if (response.status === 403) {
      throw new ApiRequestError('Akses ditolak untuk role akun ini.', response.status);
    }

    if (!response.ok) {
      const error = await readErrorMessage(response);
      throw new ApiRequestError(error.message, response.status, error.errors);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  },
};

export const authApi = {
  async login(email: string, password: string): Promise<AuthSession> {
    const response = await apiClient.request<ApiEnvelope<LoginResponse>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const session = {
      token: response.data.access_token,
      user: response.data.user,
    };

    authStorage.setSession(session);

    return session;
  },
  async me() {
    const response = await apiClient.request<ApiEnvelope<AuthUser>>('/auth/me');
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.data));

    return response.data;
  },
  async logout() {
    try {
      await apiClient.request('/auth/logout', { method: 'POST' });
    } finally {
      authStorage.clear();
    }
  },
};
