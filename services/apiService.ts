import { User, PromptModule, PromptTemplate, RunLog } from '../types';

export interface UserData {
  modules: PromptModule[];
  templates: PromptTemplate[];
  logs: RunLog[];
  apiKey: string;
}

const API_BASE = '/api';

export const apiService = {
  // Auth
  register: async (username: string, password: string): Promise<User> => {
    try {
      const res = await fetch(`${API_BASE}/auth?action=register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || '注册失败');
      }
      return data;
    } catch (e: any) {
      // Handle network errors (e.g., API unreachable)
      throw new Error(e.message || '连接服务器失败，请检查网络');
    }
  },

  login: async (username: string, password: string): Promise<User> => {
    try {
      const res = await fetch(`${API_BASE}/auth?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '登录失败');
      }
      return data;
    } catch (e: any) {
      throw new Error(e.message || '连接服务器失败，请检查网络');
    }
  },

  // Data Sync
  loadData: async (userId: string): Promise<UserData | null> => {
    try {
      const res = await fetch(`${API_BASE}/data?userId=${userId}`);
      if (!res.ok) {
        // If 503 (DB missing) or 500, we log it but return null so the app can still work in "Offline/Demo" mode locally
        console.warn(`Cloud data load failed (${res.status}):`, await res.text());
        return null;
      }
      return res.json();
    } catch (e) {
      console.error("Failed to load cloud data", e);
      return null;
    }
  },

  saveData: async (userId: string, data: UserData): Promise<void> => {
    const res = await fetch(`${API_BASE}/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, data })
    });
    
    if (!res.ok) {
        let errorMsg = '同步失败';
        try {
            const errJson = await res.json();
            errorMsg = errJson.error || errorMsg;
        } catch(e) {
            if (res.status === 503) errorMsg = '云端数据库未连接 (KV Not Bound)';
            else errorMsg = `Server Error: ${res.status}`;
        }
        throw new Error(errorMsg);
    }
  }
};