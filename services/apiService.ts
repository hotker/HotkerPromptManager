import { User, PromptModule, PromptTemplate, RunLog } from '../types';

export interface UserData {
  modules: PromptModule[];
  templates: PromptTemplate[];
  logs: RunLog[];
  apiKey: string;
}

const API_BASE = '/api';

/**
 * 增强型请求助手，支持针对数据库竞争的指数退避重试逻辑。
 */
async function request<T>(endpoint: string, options: RequestInit = {}, retries = 3, backoff = 800): Promise<T> {
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

    // 处理 503 (D1 Busy) 或 429
    if (!res.ok) {
      if ((res.status === 503 || res.status === 429) && retries > 0) {
        await new Promise(r => setTimeout(r, backoff));
        return request(endpoint, options, retries - 1, backoff * 1.5);
      }
      
      let errorMsg = `API Error: ${res.status}`;
      try {
        const errJson = await res.json() as any;
        errorMsg = errJson.error || errorMsg;
      } catch {
        if (res.status === 503) errorMsg = '数据库正在处理其他请求，请稍后';
        else if (res.status === 500) errorMsg = '同步服务响应异常';
      }
      throw new Error(errorMsg);
    }

    if (res.status === 204) return {} as T;
    return await res.json();
  } catch (e: any) {
    if (e.name === 'AbortError') throw e;

    if (retries > 0 && !e.message?.includes('400') && !e.message?.includes('401')) {
      await new Promise(r => setTimeout(r, backoff));
      return request(endpoint, options, retries - 1, backoff * 2);
    }
    throw e;
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
      // 初始加载增加重试，确保网络波动不导致空白页
      return await request<UserData>(`/data?userId=${userId}`, { method: 'GET' }, 3);
    } catch (e) {
      console.error("Cloud data loading critical failure:", e);
      throw e; // 让 App.tsx 捕获并显示错误
    }
  },

  saveData: async (userId: string, data: UserData, signal?: AbortSignal): Promise<void> => {
    return request<void>('/data', {
      method: 'POST',
      body: JSON.stringify({ userId, data }),
      signal
    });
  }
};