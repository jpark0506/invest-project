import { config } from '@/shared/config';

interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

interface ApiErrorResponse {
  error: ApiError;
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private isInitialized = false;
  private initPromise: Promise<boolean> | null = null;

  constructor() {
    this.baseUrl = config.apiBaseUrl;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  getAccessToken() {
    return this.accessToken;
  }

  // Initialize auth state by trying to refresh token (called on app start)
  async initAuth(): Promise<boolean> {
    if (this.isInitialized) {
      return !!this.accessToken;
    }

    // Avoid multiple init calls
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.tryRefreshToken().finally(() => {
      this.isInitialized = true;
      this.initPromise = null;
    });

    return this.initPromise;
  }

  isAuthInitialized() {
    return this.isInitialized;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
      credentials: 'include', // For refresh token cookie
    });

    if (!response.ok) {
      // Try to refresh token on 401 (even if accessToken is null, we might have refresh cookie)
      if (response.status === 401) {
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          // Retry the request with new token
          (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
          const retryResponse = await fetch(`${this.baseUrl}${path}`, {
            ...options,
            headers,
            credentials: 'include',
          });

          if (retryResponse.ok) {
            return retryResponse.json();
          }
        }
      }

      const errorBody: ApiErrorResponse = await response.json().catch(() => ({
        error: { code: 'UNKNOWN', message: 'Unknown error' },
      }));

      throw new Error(errorBody.error.message);
    }

    return response.json();
  }

  private async tryRefreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        this.accessToken = data.accessToken;
        return true;
      }
    } catch {
      // Refresh failed
    }

    this.accessToken = null;
    return false;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
