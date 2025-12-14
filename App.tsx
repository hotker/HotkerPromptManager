import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { LibraryView } from './components/LibraryView';
import { BuilderView } from './components/BuilderView';
import { HistoryView } from './components/HistoryView';
import { Dashboard } from './components/Dashboard';
import { AuthPage } from './components/AuthPage';
import { ViewState, PromptModule, PromptTemplate, RunLog, ModuleType, User } from './types';
import { authService } from './services/authService';
import { apiService, UserData } from './services/apiService';

// Debounce Hook to prevent API spamming
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

const App = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    setIsLoadingAuth(false);
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  if (isLoadingAuth) {
    return <div className="h-screen bg-zinc-950 flex items-center justify-center text-banana-500">
      <span className="animate-pulse">Loading Nano Banana...</span>
    </div>;
  }

  if (!currentUser) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <AuthenticatedApp currentUser={currentUser} onLogout={handleLogout} />
  );
};

const AuthenticatedApp: React.FC<{ currentUser: User, onLogout: () => void }> = ({ currentUser, onLogout }) => {
  const [view, setView] = useState<ViewState>('dashboard');
  
  // Data State
  const [modules, setModules] = useState<PromptModule[]>([]);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [logs, setLogs] = useState<RunLog[]>([]);
  const [userApiKey, setUserApiKey] = useState<string>('');
  
  // Sync State
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Initial Data Defaults
  const initialModules: PromptModule[] = [
    { id: '1', title: '资深 React 工程师角色', content: '担任具有深厚 UI/UX 专业知识的世界级资深前端 React 工程师。', description: '用于生成高质量 React 代码的默认角色', type: ModuleType.ROLE, tags: ['编程', 'react'], createdAt: Date.now() },
    { id: '2', title: '简洁语气', content: '极其简洁。没有废话。只提供代码和关键解释。', type: ModuleType.TONE, tags: ['通用'], createdAt: Date.now() },
    { id: '3', title: 'JSON 输出格式', content: '严格将结果作为有效的 JSON 对象输出。', type: ModuleType.FORMAT, tags: ['json', 'api'], createdAt: Date.now() },
  ];

  // 1. Load Data from Cloud on Mount
  useEffect(() => {
    const loadCloudData = async () => {
      // Optimistic load: try to get data, if empty/null, use defaults
      const cloudData = await apiService.loadData(currentUser.id);
      
      if (cloudData && cloudData.modules && cloudData.modules.length > 0) {
        setModules(cloudData.modules);
        setTemplates(cloudData.templates || []);
        setLogs(cloudData.logs || []);
        setUserApiKey(cloudData.apiKey || '');
      } else {
        // New user or empty data
        setModules(initialModules);
      }
      setIsDataLoaded(true);
    };

    loadCloudData();
  }, [currentUser.id]);

  // 2. Prepare Data Object for Sync
  const currentData: UserData = {
    modules,
    templates,
    logs,
    apiKey: userApiKey
  };

  // 3. Debounce the data changes (Auto-save every 2s of inactivity)
  const debouncedData = useDebounce(currentData, 2000);

  // 4. Save to Cloud when debounced data changes
  // We use a ref to skip the initial save when data is first loaded
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!isDataLoaded) return;
    
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const saveData = async () => {
      setSyncStatus('saving');
      try {
        await apiService.saveData(currentUser.id, debouncedData);
        setSyncStatus('saved');
      } catch (e) {
        console.error("Sync failed", e);
        setSyncStatus('error');
      }
    };

    saveData();
  }, [debouncedData, currentUser.id, isDataLoaded]);


  if (!isDataLoaded) {
    return (
      <div className="h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 text-zinc-400">
        <div className="w-8 h-8 border-2 border-banana-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm">正在同步云端数据...</p>
      </div>
    );
  }

  const handleSaveTemplate = (newTemplate: PromptTemplate) => {
    setTemplates(prev => [newTemplate, ...prev]);
  };

  const handleAddLog = (newLog: RunLog) => {
    setLogs(prev => [newLog, ...prev]);
  };

  const handleUpdateLog = (id: string, updates: Partial<RunLog>) => {
    setLogs(prev => prev.map(log => log.id === id ? { ...log, ...updates } : log));
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans animate-in fade-in duration-500">
      <Sidebar 
        currentView={view} 
        setView={setView} 
        currentUser={currentUser}
        onLogout={onLogout}
        userApiKey={userApiKey}
        setUserApiKey={setUserApiKey}
        syncStatus={syncStatus}
      />
      
      <main className="flex-1 h-full overflow-hidden relative">
        {view === 'dashboard' && (
          <Dashboard 
            modules={modules} 
            templates={templates} 
            logs={logs}
            setModules={setModules}
            setTemplates={setTemplates}
            setLogs={setLogs}
            currentUser={currentUser}
          />
        )}
        {view === 'library' && <LibraryView modules={modules} setModules={setModules} />}
        {view === 'builder' && (
          <BuilderView 
            modules={modules} 
            templates={templates} 
            saveTemplate={handleSaveTemplate}
            addLog={handleAddLog}
            userApiKey={userApiKey}
            currentUser={currentUser}
          />
        )}
        {view === 'history' && <HistoryView logs={logs} updateLog={handleUpdateLog} />}
      </main>
    </div>
  );
}

export default App;