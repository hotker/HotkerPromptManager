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
    const res = await fetch(`${API_BASE}/auth?action=register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (!res.ok) {
      let errorMsg = '注册失败';
      try {
        const err = await res.json();
        errorMsg = err.error || errorMsg;
      } catch (e) {}
      throw new Error(errorMsg);
    }
    return res.json();
  },

  login: async (username: string, password: string): Promise<User> => {
    const res = await fetch(`${API_BASE}/auth?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      let errorMsg = '登录失败';
      try {
        const err = await res.json();
        errorMsg = err.error || errorMsg;
      } catch (e) {}
      throw new Error(errorMsg);
    }
    return res.json();
  },

  // Data Sync
  loadData: async (userId: string): Promise<UserData | null> => {
    try {
      const res = await fetch(`${API_BASE}/data?userId=${userId}`);
      if (!res.ok) {
        // If API fails (e.g., 500 because DB not bound), log it but allow app to load with empty data
        const text = await res.text();
        console.warn("Cloud data load failed:", text);
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
        let errorMsg = 'Sync failed';
        try {
            // Try to parse JSON error first
            const errJson = await res.json();
            errorMsg = errJson.error || errorMsg;
        } catch(e) {
            // If not JSON, use text (e.g. 500 HTML or plain text)
            const text = await res.text();
            if (text.includes('NANO_DB')) errorMsg = '服务端 NANO_DB 未绑定';
            else errorMsg = `Server Error: ${res.status}`;
        }
        throw new Error(errorMsg);
    }
  }
};