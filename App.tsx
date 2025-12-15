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
import { Language } from './translations';

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
  
  // Lifted Language State with Persistence
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('hotker_lang') as Language) || 'zh';
  });

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem('hotker_lang', l);
  };

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
    return <div className="h-[100dvh] bg-slate-900 flex flex-col items-center justify-center text-cyber-primary">
       <div className="w-16 h-16 border-4 border-cyber-primary border-t-transparent rounded-full animate-spin mb-4"></div>
       <span className="font-mono tracking-widest animate-pulse">SYSTEM INITIALIZING...</span>
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
  
  // Data State
  const [modules, setModules] = useState<PromptModule[]>([]);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [logs, setLogs] = useState<RunLog[]>([]);
  const [userApiKey, setUserApiKey] = useState<string>('');
  
  // Sync State
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [syncErrorMsg, setSyncErrorMsg] = useState<string | undefined>(undefined);

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
        // New user or empty data -> Load Commercial Defaults
        setModules(INITIAL_MODULES);
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
      <div className="h-[100dvh] bg-slate-900 flex flex-col items-center justify-center gap-4 text-cyber-primary">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-cyber-primary rounded-full animate-ping absolute inset-0"></div>
          <div className="w-12 h-12 border-2 border-cyber-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-sm font-mono tracking-widest">SYNCING DATA STREAM...</p>
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
    <div className="flex h-[100dvh] bg-slate-900 text-slate-200 font-sans animate-in fade-in duration-500 flex-col md:flex-row bg-grid-pattern overflow-hidden">
      {/* Background Overlay for Scanline */}
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[1] bg-[length:100%_2px,3px_100%] opacity-20"></div>

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
      />
      
      <main className="flex-1 h-full overflow-hidden relative pt-16 md:pt-0 z-10">
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
            userApiKey={userApiKey}
            currentUser={currentUser}
            lang={lang}
          />
        )}
        {view === 'history' && <HistoryView logs={logs} updateLog={handleUpdateLog} lang={lang} />}
      </main>
    </div>
  );
}

export default App;