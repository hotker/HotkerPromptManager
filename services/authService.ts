import { User } from '../types';
import { apiService } from './apiService';

const STORAGE_KEY_SESSION = 'hotker_cloud_session';

export const authService = {
  // Login interacting with Cloudflare KV API
  login: async (username: string, password: string): Promise<User> => {
    const user = await apiService.login(username, password);
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(user));
    return user;
  },

  // Register interacting with Cloudflare KV API
  register: async (username: string, password: string): Promise<User> => {
    const user = await apiService.register(username, password);
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(user));
    return user;
  },

  // Real Google Login
  loginWithGoogle: async (): Promise<never> => {
    // Redirects browser to backend to start OAuth flow
    // The backend will handle the redirect to Google, verify the token,
    // and return a script to save the session and redirect back to dashboard.
    window.location.href = '/api/auth?action=google-login';
    
    // Return a never-resolving promise to keep the UI in "loading" state until redirect happens
    return new Promise(() => {});
  },

  changePassword: async (username: string, currentPass: string, newPass: string): Promise<void> => {
    return apiService.changePassword(username, currentPass, newPass);
  },

  // Logout
  logout: () => {
    localStorage.removeItem(STORAGE_KEY_SESSION);
  },

  // Check current session
  getCurrentUser: (): User | null => {
    try {
      const session = localStorage.getItem(STORAGE_KEY_SESSION);
      return session ? JSON.parse(session) : null;
    } catch {
      return null;
    }
  },

  // Restore is now handled by the API sync, but we keep this signature if needed for manual imports
  restoreBackup: async (backup: any): Promise<User> => {
    throw new Error("请直接登录，数据将自动同步。使用仪表盘的导入功能上传旧备份。");
  }
};