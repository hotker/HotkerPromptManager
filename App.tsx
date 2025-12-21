
import React, { useState, useEffect, useRef } from 'react';
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
  
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('hotker_lang') as Language) || 'zh';
  });

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem('hotker_lang', l);
  };
  
  const t = translations[lang];

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
    return <div className="h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500">
       <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
       <span className="font-medium text-sm tracking-wide">{t.app.initializing}</span>
    </div>;
  }

  if (!currentUser) {
    return <AuthPage onLogin={handleLogin} lang={lang} setLang={setLang} />;
  }

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
  
  // Data State
  const [modules, setModules] = useState<PromptModule[]>([]);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [logs, setLogs] = useState<RunLog[]>([]);
  const [userApiKey, setUserApiKey] = useState<string>('');
  
  // Sync State
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [syncErrorMsg, setSyncErrorMsg] = useState<string | undefined>(undefined);

  // 1. Load Data
  useEffect(() => {
    const loadCloudData = async () => {
      const cloudData = await apiService.loadData(currentUser.id);
      
      if (cloudData && cloudData.modules && cloudData.modules.length > 0) {
        setModules(cloudData.modules);
        setTemplates(cloudData.templates || []);
        setLogs(cloudData.logs || []);
        setUserApiKey(cloudData.apiKey || '');
      } else {
        setModules(INITIAL_MODULES);
      }
      setIsDataLoaded(true);
    };

    loadCloudData();
  }, [currentUser.id]);

  // 2. Prepare Data
  const currentData: UserData = {
    modules,
    templates,
    logs,
    apiKey: userApiKey
  };

  // 3. Debounce
  const debouncedData = useDebounce(currentData, 2000);

  // 4. Enhanced Save with Race Condition Prevention
  const saveAbortControllerRef = useRef<AbortController | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!isDataLoaded) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const saveData = async () => {
      // Abort previous request if still pending
      if (saveAbortControllerRef.current) {
        saveAbortControllerRef.current.abort();
      }
      
      const controller = new AbortController();
      saveAbortControllerRef.current = controller;

      setSyncStatus('saving');
      setSyncErrorMsg(undefined);

      try {
        await apiService.saveData(currentUser.id, debouncedData, controller.signal);
        setSyncStatus('saved');
      } catch (e: any) {
        if (e.name === 'AbortError') return;
        console.error("Sync failed", e);
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

  // Manual retry capability
  const handleForceSync = () => {
    setSyncStatus('saving');
    apiService.saveData(currentUser.id, currentData)
      .then(() => setSyncStatus('saved'))
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

  const handleSaveTemplate = (newTemplate: PromptTemplate) => {
    setTemplates(prev => [newTemplate, ...prev]);
  };

  const handleAddLog = (newLog: RunLog) => {
    setLogs(prev => [newLog, ...prev]);
  };

  const handleUpdateLog = (id: string, updates: Partial<RunLog>) => {
    setLogs(prev => prev.map(log => log.id === id ? { ...log, ...updates } : log));
  };

  const handleUpdateModule = (updatedModule: PromptModule) => {
    setModules(prev => prev.map(m => m.id === updatedModule.id ? updatedModule : m));
  };

  return (
    <div className="flex h-[100dvh] bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Sidebar 
        currentView={view} 
        setView={setView} 
        currentUser={currentUser}
        // FIX: Change handleLogout to onLogout to resolve "Cannot find name 'handleLogout'" error.
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
          {view === 'library' && <LibraryView modules={modules} setModules={setModules} lang={lang} />}
          {view === 'builder' && (
            <BuilderView 
              modules={modules} 
              templates={templates} 
              saveTemplate={handleSaveTemplate}
              addLog={handleAddLog}
              onUpdateModule={handleUpdateModule}
              userApiKey={userApiKey}
              currentUser={currentUser}
              lang={lang}
            />
          )}
          {view === 'history' && <HistoryView logs={logs} updateLog={handleUpdateLog} lang={lang} />}
        </div>
      </main>
    </div>
  );
}

export default App;
