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
  const [syncErrorMsg, setSyncErrorMsg] = useState<string | undefined>(undefined);

  // Initial Data Defaults - Commercial Grade Nano Banana Modules
  const initialModules: PromptModule[] = [
    { 
      id: 'role-expert', 
      title: '角色: 全栈架构师 (Expert)', 
      content: '你是一位拥有10年经验的世界级全栈架构师，精通 React 19、TypeScript 和 Cloudflare 生态系统。你极其注重代码的类型安全、性能优化和架构整洁。', 
      description: '设定高标准的工程视角。',
      type: ModuleType.ROLE, 
      tags: ['专家', '工程'], 
      createdAt: Date.now() 
    },
    { 
      id: 'task-refactor', 
      title: '任务: 代码重构 (Refactor)', 
      content: '请对提供的代码进行重构。要求：1. 提高可读性；2. 消除重复逻辑 (DRY)；3. 完善 TypeScript 类型定义；4. 保持原有业务逻辑不变。', 
      type: ModuleType.TASK, 
      tags: ['重构', '代码'], 
      createdAt: Date.now() 
    },
    { 
      id: 'constraint-stack', 
      title: '约束: 现代技术栈', 
      content: '严格遵守以下技术栈要求：\n- 框架: React 19 (Functional Components + Hooks)\n- 样式: Tailwind CSS (禁止使用外部 CSS 文件或 styled-components)\n- 图标: Lucide React\n- 构建: Vite\n- 部署: Cloudflare Pages', 
      type: ModuleType.CONSTRAINT, 
      tags: ['Tech Stack', 'React', 'Tailwind'], 
      createdAt: Date.now() 
    },
    { 
      id: 'constraint-no-yapping', 
      title: '语气: 极简 (No Yapping)', 
      content: '请直接输出结果，不要包含任何“好的，这是您的代码”之类的开场白或结束语。只提供核心代码和必要的简短注释。', 
      type: ModuleType.TONE, 
      tags: ['高效率', '极简'], 
      createdAt: Date.now() 
    },
    { 
      id: 'format-json', 
      title: '格式: 纯 JSON', 
      content: '请仅输出有效的 JSON 格式数据，不要使用 Markdown 代码块包裹，也不要包含任何其他文本。', 
      type: ModuleType.FORMAT, 
      tags: ['数据', 'API'], 
      createdAt: Date.now() 
    },
    {
      id: 'context-deploy',
      title: '背景: Cloudflare Pages 部署',
      content: '当前环境是 Cloudflare Pages。文件系统是只读的，没有传统 Node.js 服务器。API 使用 Cloudflare Functions 实现。请确保代码兼容 Edge Runtime。',
      type: ModuleType.CONTEXT,
      tags: ['Cloudflare', 'Serverless'],
      createdAt: Date.now()
    }
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
      setSyncErrorMsg(undefined);
      try {
        await apiService.saveData(currentUser.id, debouncedData);
        setSyncStatus('saved');
      } catch (e: any) {
        console.error("Sync failed", e);
        setSyncStatus('error');
        setSyncErrorMsg(e.message);
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
        syncErrorMsg={syncErrorMsg}
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