import { User, PromptModule, PromptTemplate, RunLog } from '../types';

export interface UserData {
  modules: PromptModule[];
  templates: PromptTemplate[];
  logs: RunLog[];
  apiKey: string;
}

const API_BASE = '/api';

/**
 * Enhanced request helper with exponential backoff retry logic.
 * Specifically designed to handle database contention or transient network issues.
 */
async function request<T>(endpoint: string, options: RequestInit = {}, retries = 3, backoff = 1000): Promise<T> {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    // Handle 5xx errors and specific database busy states with retries
    if (!res.ok) {
      if ((res.status >= 500 || res.status === 429) && retries > 0) {
        await new Promise(r => setTimeout(r, backoff));
        return request(endpoint, options, retries - 1, backoff * 1.5);
      }
      
      let errorMsg = `API Error: ${res.status}`;
      try {
        const errJson = await res.json() as any;
        errorMsg = errJson.error || errorMsg;
      } catch {
        if (res.status === 503) errorMsg = '数据库服务繁忙，请稍后重试';
        else if (res.status === 500) errorMsg = '服务器内部同步错误';
      }
      throw new Error(errorMsg);
    }

    if (res.status === 204) return {} as T;
    return await res.json();
  } catch (e: any) {
    // If aborted by AbortController, do not retry
    if (e.name === 'AbortError') throw e;

    if (retries > 0) {
      await new Promise(r => setTimeout(r, backoff));
      return request(endpoint, options, retries - 1, backoff * 2);
    }
    throw new Error(e.message || '网络连接异常，同步中断');
  }
}

export const apiService = {
  // --- Auth ---
  register: async (username: string, password: string): Promise<User> => {
    return request<User>('/auth?action=register', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },

  login: async (username: string, password: string): Promise<User> => {
    return request<User>('/auth?action=login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },

  changePassword: async (username: string, currentPassword: string, newPassword: string): Promise<void> => {
    return request<void>('/auth?action=change-password', {
      method: 'POST',
      body: JSON.stringify({ username, currentPassword, newPassword })
    });
  },

  // --- Data Sync ---
  loadData: async (userId: string): Promise<UserData | null> => {
    try {
      return await request<UserData>(`/data?userId=${userId}`, { method: 'GET' }, 2);
    } catch (e) {
      console.warn("Cloud data sync unavailable:", e);
      return null;
    }
  },

  /**
   * Save data with signal support to prevent race conditions during high-frequency edits.
   */
  saveData: async (userId: string, data: UserData, signal?: AbortSignal): Promise<void> => {
    return request<void>('/data', {
      method: 'POST',
      body: JSON.stringify({ userId, data }),
      signal
    });
  }
};