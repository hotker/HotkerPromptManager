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
      const err = await res.json();
      throw new Error(err.error || '注册失败');
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
      const err = await res.json();
      throw new Error(err.error || '登录失败');
    }
    return res.json();
  },

  // Data Sync
  loadData: async (userId: string): Promise<UserData | null> => {
    try {
      const res = await fetch(`${API_BASE}/data?userId=${userId}`);
      if (!res.ok) return null;
      return res.json();
    } catch (e) {
      console.error("Failed to load cloud data", e);
      return null;
    }
  },

  saveData: async (userId: string, data: UserData): Promise<void> => {
    await fetch(`${API_BASE}/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, data })
    });
  }
};