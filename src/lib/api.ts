const getApiBaseUrl = (): string => {
  const envUrl = (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_API_URL as string)) || '';
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocalhost && (!envUrl || envUrl.includes('127.0.0.1') || envUrl.includes('localhost'))) {
      return 'https://highpbackend.vercel.app/api';
    }
  }
  return envUrl || '/api';
};

const API_BASE_URL = getApiBaseUrl();

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  responseType?: 'json' | 'blob' | 'text';
  timeoutMs?: number;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL.replace(/\/$/, '');
  }

  private buildUrl(path: string, params?: Record<string, any>): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const baseWithApi = this.baseURL.endsWith('/api') ? this.baseURL : `${this.baseURL}/api`;
    let fullUrl = `${baseWithApi}${cleanPath}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          searchParams.append(key, String(val));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString;
      }
    }

    return fullUrl;
  }

  private async request<T = any>(
    method: string,
    path: string,
    body?: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path, options.params);
    const headers: Record<string, string> = {
      ...(options.headers || {})
    };

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('highp_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    let requestBody: any = undefined;
    if (body !== undefined) {
      if (body instanceof FormData) {
        requestBody = body;
      } else {
        headers['Content-Type'] = 'application/json';
        requestBody = JSON.stringify(body);
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 8000);

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: requestBody,
        cache: 'no-store',
        signal: controller.signal
      });
    } catch (networkError: any) {
      clearTimeout(timeout);
      const isAbort = networkError.name === 'AbortError';
      const err: any = new Error(isAbort ? 'Request timed out after 8 seconds' : (networkError.message || 'Network request failed'));
      err.response = { status: 0, data: { success: false, message: err.message } };
      throw err;
    } finally {
      clearTimeout(timeout);
    }


    let responseData: any;
    if (options.responseType === 'blob') {
      responseData = await response.blob();
    } else {
      const text = await response.text();
      try {
        responseData = text ? JSON.parse(text) : {};
      } catch {
        responseData = text;
      }
    }

    if (!response.ok) {
      if (response.status === 401 && typeof window !== 'undefined') {
        const isPublicRoute =
          window.location.pathname === '/' ||
          window.location.pathname.includes('/login') ||
          window.location.pathname.includes('/register');
        if (!isPublicRoute) {
          localStorage.removeItem('highp_token');
          localStorage.removeItem('highp_user');
          localStorage.removeItem('highp_company');
          window.location.href = '/login';
        }
      }

      const err: any = new Error(
        responseData?.message || `Request failed with status ${response.status}`
      );
      err.response = {
        status: response.status,
        statusText: response.statusText,
        data: responseData
      };
      throw err;
    }

    return {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    };
  }

  get<T = any>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, undefined, options);
  }

  post<T = any>(path: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, data, options);
  }

  put<T = any>(path: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, data, options);
  }

  patch<T = any>(path: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', path, data, options);
  }

  delete<T = any>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path, undefined, options);
  }
}

export const api = new ApiClient(API_BASE_URL);
