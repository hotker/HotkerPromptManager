/**
 * 离线存储服务 - 使用 IndexedDB 作为本地离线存储
 * 防止同步数据错误或延时刷新新增数据情况下的数据丢失
 */

import { UserData } from './apiService';

const DB_NAME = 'HotkerPromptManager';
const DB_VERSION = 1;
const STORE_USER_DATA = 'userData';
const STORE_SYNC_META = 'syncMeta';

export interface OfflineUserData extends UserData {
  savedAt: number;
}

export interface SyncMeta {
  lastSyncTime: number;
  lastSyncStatus: 'success' | 'error' | 'pending';
  lastErrorMessage?: string;
}

/**
 * 打开 IndexedDB 数据库连接
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB open error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // 创建用户数据存储
      if (!db.objectStoreNames.contains(STORE_USER_DATA)) {
        db.createObjectStore(STORE_USER_DATA, { keyPath: 'userId' });
      }
      
      // 创建同步元数据存储
      if (!db.objectStoreNames.contains(STORE_SYNC_META)) {
        db.createObjectStore(STORE_SYNC_META, { keyPath: 'userId' });
      }
    };
  });
}

/**
 * 检查 IndexedDB 是否可用
 */
function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}

export const offlineStorageService = {
  /**
   * 检查离线存储是否可用
   */
  isAvailable: (): boolean => {
    return isIndexedDBAvailable();
  },

  /**
   * 保存用户数据到本地 IndexedDB
   */
  saveLocalData: async (userId: string, data: UserData): Promise<void> => {
    if (!isIndexedDBAvailable()) {
      console.warn('IndexedDB not available, skipping local save');
      return;
    }

    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_USER_DATA, 'readwrite');
      const store = transaction.objectStore(STORE_USER_DATA);

      const offlineData: OfflineUserData & { userId: string } = {
        userId,
        ...data,
        savedAt: Date.now()
      };

      return new Promise((resolve, reject) => {
        const request = store.put(offlineData);
        request.onsuccess = () => {
          db.close();
          resolve();
        };
        request.onerror = () => {
          db.close();
          reject(request.error);
        };
      });
    } catch (e) {
      console.error('Failed to save local data:', e);
      // 不抛出异常，避免影响主流程
    }
  },

  /**
   * 从本地 IndexedDB 加载用户数据
   */
  loadLocalData: async (userId: string): Promise<OfflineUserData | null> => {
    if (!isIndexedDBAvailable()) {
      console.warn('IndexedDB not available');
      return null;
    }

    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_USER_DATA, 'readonly');
      const store = transaction.objectStore(STORE_USER_DATA);

      return new Promise((resolve, reject) => {
        const request = store.get(userId);
        request.onsuccess = () => {
          db.close();
          const result = request.result;
          if (result) {
            // 移除 userId 字段，返回纯数据
            const { userId: _, ...data } = result;
            resolve(data as OfflineUserData);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => {
          db.close();
          reject(request.error);
        };
      });
    } catch (e) {
      console.error('Failed to load local data:', e);
      return null;
    }
  },

  /**
   * 清除本地离线数据
   */
  clearLocalData: async (userId: string): Promise<void> => {
    if (!isIndexedDBAvailable()) return;

    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_USER_DATA, 'readwrite');
      const store = transaction.objectStore(STORE_USER_DATA);

      return new Promise((resolve, reject) => {
        const request = store.delete(userId);
        request.onsuccess = () => {
          db.close();
          resolve();
        };
        request.onerror = () => {
          db.close();
          reject(request.error);
        };
      });
    } catch (e) {
      console.error('Failed to clear local data:', e);
    }
  },

  /**
   * 获取同步元数据
   */
  getSyncMeta: async (userId: string): Promise<SyncMeta | null> => {
    if (!isIndexedDBAvailable()) return null;

    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_SYNC_META, 'readonly');
      const store = transaction.objectStore(STORE_SYNC_META);

      return new Promise((resolve, reject) => {
        const request = store.get(userId);
        request.onsuccess = () => {
          db.close();
          const result = request.result;
          if (result) {
            const { userId: _, ...meta } = result;
            resolve(meta as SyncMeta);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => {
          db.close();
          reject(request.error);
        };
      });
    } catch (e) {
      console.error('Failed to get sync meta:', e);
      return null;
    }
  },

  /**
   * 更新同步元数据
   */
  updateSyncMeta: async (userId: string, meta: SyncMeta): Promise<void> => {
    if (!isIndexedDBAvailable()) return;

    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_SYNC_META, 'readwrite');
      const store = transaction.objectStore(STORE_SYNC_META);

      return new Promise((resolve, reject) => {
        const request = store.put({ userId, ...meta });
        request.onsuccess = () => {
          db.close();
          resolve();
        };
        request.onerror = () => {
          db.close();
          reject(request.error);
        };
      });
    } catch (e) {
      console.error('Failed to update sync meta:', e);
    }
  },

  /**
   * 获取本地数据保存时间
   */
  getLocalDataTimestamp: async (userId: string): Promise<number | null> => {
    const data = await offlineStorageService.loadLocalData(userId);
    return data?.savedAt || null;
  }
};
