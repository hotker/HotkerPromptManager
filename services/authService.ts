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

  // Mock Google Login
  loginWithGoogle: async (): Promise<User> => {
    // For demo purposes, we simulate a delay.
    // In a real implementation, this would involve OAuth redirects.
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // We treat this as a special "local" user for now unless we implement full OAuth backend
    const googleUser: User = {
      id: 'google_demo_user',
      username: 'Google User',
      provider: 'google',
      createdAt: Date.now(),
      avatarUrl: 'https://lh3.googleusercontent.com/a/default-user=s96-c'
    };
    
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(googleUser));
    return googleUser;
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
    // With Cloudflare KV, we might just want to load the data and save it to the cloud
    // For now, we'll assume the standard login flow handles restoration.
    // This function can be deprecated or used to force-upload a local backup to the cloud.
    throw new Error("请直接登录，数据将自动同步。使用仪表盘的导入功能上传旧备份。");
  }
};