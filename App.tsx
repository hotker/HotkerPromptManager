import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { LibraryView } from './components/LibraryView';
import { BuilderView } from './components/BuilderView';
import { HistoryView } from './components/HistoryView';
import { Dashboard } from './components/Dashboard';
import { AuthPage } from './components/AuthPage';
import { ViewState, PromptModule, PromptTemplate, RunLog, ModuleType, User } from './types';
import { authService } from './services/authService';

// Improved LocalStorage Hook that reacts to Key changes (Crucial for multi-user switching)
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Initialize state based on the current key immediately
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  // When key changes, re-read from local storage
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      setStoredValue(item ? JSON.parse(item) : initialValue);
    } catch (error) {
      setStoredValue(initialValue);
    }
  }, [key]);

  // Sync state changes to local storage
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error("Error writing to local storage", error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
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

  // If loading auth state, show a simple loader or nothing
  if (isLoadingAuth) {
    return <div className="h-screen bg-zinc-950 flex items-center justify-center text-banana-500">加载中...</div>;
  }

  // If not logged in, show Auth Page
  if (!currentUser) {
    return <AuthPage onLogin={handleLogin} />;
  }

  // Render Main App with User-Scoped Data
  return (
    <AuthenticatedApp currentUser={currentUser} onLogout={handleLogout} />
  );
};

// Extracted to ensure hooks re-run completely when user changes (though key-based hook handles it, this is cleaner)
const AuthenticatedApp: React.FC<{ currentUser: User, onLogout: () => void }> = ({ currentUser, onLogout }) => {
  const [view, setView] = useState<ViewState>('dashboard');
  
  // User-scoped keys
  const userPrefix = `nano_${currentUser.id}_`;

  const initialModules: PromptModule[] = [
    { id: '1', title: '资深 React 工程师角色', content: '担任具有深厚 UI/UX 专业知识的世界级资深前端 React 工程师。', type: ModuleType.ROLE, tags: ['编程', 'react'], createdAt: Date.now() },
    { id: '2', title: '简洁语气', content: '极其简洁。没有废话。只提供代码和关键解释。', type: ModuleType.TONE, tags: ['通用'], createdAt: Date.now() },
    { id: '3', title: 'JSON 输出格式', content: '严格将结果作为有效的 JSON 对象输出。', type: ModuleType.FORMAT, tags: ['json', 'api'], createdAt: Date.now() },
  ];

  const [modules, setModules] = useLocalStorage<PromptModule[]>(`${userPrefix}modules`, initialModules);
  const [templates, setTemplates] = useLocalStorage<PromptTemplate[]>(`${userPrefix}templates`, []);
  const [logs, setLogs] = useLocalStorage<RunLog[]>(`${userPrefix}logs`, []);
  
  // API Key Storage (User specific)
  const [userApiKey, setUserApiKey] = useLocalStorage<string>(`${userPrefix}api_key`, '');

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