
import { User, PromptModule, PromptTemplate, RunLog } from '../types';

export interface UserData {
  modules: PromptModule[];
  templates: PromptTemplate[];
  logs: RunLog[];
  apiKey: string;
}

const API_BASE = '/api';

/**
 * 增强型请求助手
 */
async function request<T>(endpoint: string, options: RequestInit = {}, retries = 3, backoff = 800): Promise<T> {
  const defaultHeaders: Record<string, string> = {
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

    if (!res.ok) {
      // 针对数据库繁忙进行重试
      if ((res.status === 503 || res.status === 429) && retries > 0) {
        await new Promise(r => setTimeout(r, backoff));
        return request(endpoint, options, retries - 1, backoff * 1.5);
      }
      
      let errorMsg = `API Error: ${res.status}`;
      try {
        const errJson = await res.json() as any;
        errorMsg = errJson.error || errorMsg;
      } catch {
        if (res.status === 403) errorMsg = 'WAF拦截: 请检查内容是否包含敏感字符 (Hex模式)';
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

// --- XOR + Hex 混淆算法 ---
// 将 JSON 转换为 Hex 字符串，彻底避免 Base64 特殊字符 (+, /, =) 触发 WAF
function xorHexEncode(str: string): string {
  const key = "HotkerSync2025_Secret";
  const encoder = new TextEncoder();
  
  const dataBytes = encoder.encode(str);
  const keyBytes = encoder.encode(key);
  
  const output = new Uint8Array(dataBytes.length);
  for (let i = 0; i < dataBytes.length; i++) {
    output[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  
  // Convert to Hex
  return Array.from(output)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
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
      return await request<UserData>(`/data?userId=${encodeURIComponent(userId)}`, { method: 'GET' }, 3);
    } catch (e) {
      console.error("Cloud data loading critical failure:", e);
      throw e;
    }
  },

  saveData: async (userId: string, data: UserData, signal?: AbortSignal): Promise<void> => {
    // 1. 序列化数据
    const jsonStr = JSON.stringify(data);
    
    // 2. XOR + Hex 混淆加密
    const payload = xorHexEncode(jsonStr);

    // 3. 发送纯文本 Payload
    return request<void>(`/data?userId=${encodeURIComponent(userId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain', // 纯文本，内容只有 [0-9a-f]
        'X-Sync-Version': 'v4-hex'
      },
      body: payload,
      signal
    });
  }
};
