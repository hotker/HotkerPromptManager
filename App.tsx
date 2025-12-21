import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { LibraryView } from './components/LibraryView';
import { BuilderView } from './components/BuilderView';
import { HistoryView } from './components/HistoryView';
import { Dashboard } from './components/Dashboard';
import { AuthPage } from './components/AuthPage';
import { ViewState, PromptModule, PromptTemplate, RunLog, User } from './types';
import { authService } from './services/authService';
import { apiService, UserData } from './services/apiService';
import { INITIAL_MODULES } from './constants';
import { Language, translations } from './translations';

// 优化后的防抖 Hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const App = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [lang, setLangState] = useState<Language>(() => (localStorage.getItem('hotker_lang') as Language) || 'zh');

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem('hotker_lang', l);
  };
  
  const t = translations[lang];

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) setCurrentUser(user);
    setIsLoadingAuth(false);
  }, []);

  const handleLogin = (user: User) => setCurrentUser(user);
  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  if (isLoadingAuth) {
    return (
      <div className="h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <span className="font-medium text-sm tracking-wide">{t.app.initializing}</span>
      </div>
    );
  }

  if (!currentUser) return <AuthPage onLogin={handleLogin} lang={lang} setLang={setLang} />;

  return (
    <AuthenticatedApp 
      currentUser={currentUser} 
      onLogout={handleLogout} 
      lang={lang} 
      setLang={setLang} 
    />
  );
};

const AuthenticatedApp: React.FC<{ 
  currentUser: User, 
  onLogout: () => void,
  lang: Language,
  setLang: (l: Language) => void
}> = ({ currentUser, onLogout, lang, setLang }) => {
  const [view, setView] = useState<ViewState>('dashboard');
  const t = translations[lang];
  
  const [modules, setModules] = useState<PromptModule[]>([]);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [logs, setLogs] = useState<RunLog[]>([]);
  const [userApiKey, setUserApiKey] = useState<string>('');
  
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [syncErrorMsg, setSyncErrorMsg] = useState<string | undefined>(undefined);

  // 1. 数据初始加载
  useEffect(() => {
    const loadCloudData = async () => {
      try {
        const cloudData = await apiService.loadData(currentUser.id);
        if (cloudData && (cloudData.modules?.length > 0 || cloudData.templates?.length > 0)) {
          setModules(cloudData.modules || []);
          setTemplates(cloudData.templates || []);
          setLogs(cloudData.logs || []);
          setUserApiKey(cloudData.apiKey || '');
        } else {
          setModules(INITIAL_MODULES);
        }
      } catch (e) {
        console.error("Load data failed, fallback to initials", e);
        setModules(INITIAL_MODULES);
      } finally {
        setIsDataLoaded(true);
      }
    };
    loadCloudData();
  }, [currentUser.id]);

  // 2. 稳定数据引用：只有核心业务数据变化时，currentData 才会变化
  const currentData = useMemo<UserData>(() => ({
    modules,
    templates,
    logs: logs.slice(0, 50),
    apiKey: userApiKey
  }), [modules, templates, logs, userApiKey]);

  // 3. 极速防抖：500ms 延迟足以过滤快速点击，同时保证保存的即时性
  const debouncedData = useDebounce(currentData, 500);
  const saveAbortControllerRef = useRef<AbortController | null>(null);
  const isFirstRender = useRef(true);

  // 4. 核心保存逻辑：深度绑定 debouncedData
  useEffect(() => {
    if (!isDataLoaded) return;
    
    // 跳过初次渲染引发的保存
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const saveData = async () => {
      if (saveAbortControllerRef.current) {
        saveAbortControllerRef.current.abort();
      }
      
      const controller = new AbortController();
      saveAbortControllerRef.current = controller;

      setSyncStatus('saving');
      try {
        await apiService.saveData(currentUser.id, debouncedData, controller.signal);
        setSyncStatus('saved');
        setSyncErrorMsg(undefined);
      } catch (e: any) {
        if (e.name === 'AbortError') return;
        console.error("Critical Sync Error:", e);
        setSyncStatus('error');
        setSyncErrorMsg(e.message);
      }
    };

    saveData();

    return () => {
      if (saveAbortControllerRef.current) {
        saveAbortControllerRef.current.abort();
      }
    };
  }, [debouncedData, currentUser.id, isDataLoaded]);

  const handleForceSync = () => {
    setSyncStatus('saving');
    apiService.saveData(currentUser.id, currentData)
      .then(() => {
        setSyncStatus('saved');
        setSyncErrorMsg(undefined);
      })
      .catch(e => {
        setSyncStatus('error');
        setSyncErrorMsg(e.message);
      });
  };

  if (!isDataLoaded) {
    return (
      <div className="h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 text-slate-500">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">{t.app.syncing}</p>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Sidebar 
        currentView={view} 
        setView={setView} 
        currentUser={currentUser}
        onLogout={onLogout}
        userApiKey={userApiKey}
        setUserApiKey={setUserApiKey}
        syncStatus={syncStatus}
        syncErrorMsg={syncErrorMsg}
        lang={lang}
        setLang={setLang}
        onForceSync={handleForceSync}
      />
      
      <main className="flex-1 h-full overflow-hidden relative flex flex-col pt-16 md:pt-0">
        <div className="flex-1 overflow-hidden relative bg-white md:bg-slate-50 md:p-2">
          {view === 'dashboard' && (
            <Dashboard 
              modules={modules} 
              templates={templates} 
              logs={logs}
              setModules={setModules} 
              setTemplates={setTemplates} 
              setLogs={setLogs}
              currentUser={currentUser} 
              lang={lang}
            />
          )}
          {view === 'library' && (
            <LibraryView 
              modules={modules} 
              setModules={setModules} 
              lang={lang}
              syncStatus={syncStatus}
            />
          )}
          {view === 'builder' && (
            <BuilderView 
              modules={modules} 
              templates={templates} 
              saveTemplate={(t) => setTemplates(prev => [t, ...prev])}
              addLog={(l) => setLogs(prev => [l, ...prev])}
              onUpdateModule={(m) => setModules(prev => prev.map(old => old.id === m.id ? m : old))}
              userApiKey={userApiKey} 
              currentUser={currentUser} 
              lang={lang}
            />
          )}
          {view === 'history' && (
            <HistoryView 
              logs={logs} 
              updateLog={(id, updates) => setLogs(prev => prev.map(log => log.id === id ? { ...log, ...updates } : log))} 
              lang={lang} 
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;