import { User, PromptModule, PromptTemplate, RunLog } from '../types';

export interface UserData {
  modules: PromptModule[];
  templates: PromptTemplate[];
  logs: RunLog[];
  apiKey: string;
}

const API_BASE = '/api';

/**
 * Helper to handle fetch requests consistently
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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

    // Handle generic HTTP errors
    if (!res.ok) {
      let errorMsg = `API Error: ${res.status}`;
      try {
        const errJson = await res.json();
        errorMsg = errJson.error || errorMsg;
      } catch {
        // Fallback for non-JSON errors (like 503 from Cloudflare infrastructure)
        if (res.status === 503) errorMsg = '服务暂时不可用 (数据库连接中...)';
        else if (res.status === 500) errorMsg = '服务器内部错误';
      }
      throw new Error(errorMsg);
    }

    // Handle 204 No Content or empty bodies
    if (res.status === 204) {
      return {} as T;
    }

    return await res.json();
  } catch (e: any) {
    // If it's already an Error object with a message, rethrow it
    // Otherwise, wrap it in a generic network error
    throw new Error(e.message || '网络连接失败，请检查您的互联网连接');
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

  // --- Data Sync ---

  loadData: async (userId: string): Promise<UserData | null> => {
    try {
      return await request<UserData>(`/data?userId=${userId}`);
    } catch (e) {
      // For loadData specifically, we often want to fail gracefully (return null) 
      // rather than crashing the UI, allowing the app to fall back to "Offline/Demo" mode.
      console.warn("Cloud data sync unavailable:", e);
      return null;
    }
  },

  saveData: async (userId: string, data: UserData): Promise<void> => {
    await request<void>('/data', {
      method: 'POST',
      body: JSON.stringify({ userId, data })
    });
  }
};