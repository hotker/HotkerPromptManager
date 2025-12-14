import { User } from '../types';

const STORAGE_KEY_USERS = 'nano_users_db';
const STORAGE_KEY_SESSION = 'nano_current_session';

// Helper to get users DB
const getUsersDB = (): Record<string, any> => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '{}');
  } catch {
    return {};
  }
};

// Helper to save users DB
const saveUsersDB = (db: Record<string, any>) => {
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(db));
};

export const authService = {
  // Login with Username/Password
  login: async (username: string, password: string): Promise<User> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const db = getUsersDB();
    const userRecord = db[username];

    // Simple simulation: in real app, never store plain text passwords
    if (userRecord && userRecord.password === password) {
      const user: User = userRecord.profile;
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(user));
      return user;
    }

    throw new Error('用户名或密码错误');
  },

  // Register new user
  register: async (username: string, password: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const db = getUsersDB();
    if (db[username]) {
      throw new Error('该用户名已被注册');
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      username,
      provider: 'local',
      createdAt: Date.now(),
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}` // Auto avatar
    };

    db[username] = {
      profile: newUser,
      password: password // In demo only.
    };

    saveUsersDB(db);
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(newUser));
    return newUser;
  },

  // Mock Google Login
  loginWithGoogle: async (): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate a Google User
    const googleId = 'google_user_demo';
    const db = getUsersDB();
    
    // Check if google user exists, if not create one
    if (!db[googleId]) {
      const newUser: User = {
        id: 'g_' + crypto.randomUUID(),
        username: 'Google User',
        email: 'demo@gmail.com',
        provider: 'google',
        createdAt: Date.now(),
        avatarUrl: 'https://lh3.googleusercontent.com/a/default-user=s96-c'
      };
      db[googleId] = { profile: newUser, password: '' };
      saveUsersDB(db);
    }

    const user = db[googleId].profile;
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(user));
    return user;
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
  }
};