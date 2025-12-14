import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { LibraryView } from './components/LibraryView';
import { BuilderView } from './components/BuilderView';
import { HistoryView } from './components/HistoryView';
import { Dashboard } from './components/Dashboard';
import { ViewState, PromptModule, PromptTemplate, RunLog, ModuleType } from './types';
import { DEFAULT_CONFIG } from './constants';

// Hook definition moved outside component to prevent runtime errors and ensure stability
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  // 1. Initialize State
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  // 2. Sync to LocalStorage whenever state changes
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
  const [view, setView] = useState<ViewState>('dashboard');
  
  // Initial Mock Data
  const initialModules: PromptModule[] = [
    { id: '1', title: '资深 React 工程师角色', content: '担任具有深厚 UI/UX 专业知识的世界级资深前端 React 工程师。', type: ModuleType.ROLE, tags: ['编程', 'react'], createdAt: Date.now() },
    { id: '2', title: '简洁语气', content: '极其简洁。没有废话。只提供代码和关键解释。', type: ModuleType.TONE, tags: ['通用'], createdAt: Date.now() },
    { id: '3', title: 'JSON 输出格式', content: '严格将结果作为有效的 JSON 对象输出。', type: ModuleType.FORMAT, tags: ['json', 'api'], createdAt: Date.now() },
  ];

  const [modules, setModules] = useLocalStorage<PromptModule[]>('nano_modules', initialModules);
  const [templates, setTemplates] = useLocalStorage<PromptTemplate[]>('nano_templates', []);
  const [logs, setLogs] = useLocalStorage<RunLog[]>('nano_logs', []);

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
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans">
      <Sidebar currentView={view} setView={setView} />
      
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
          />
        )}
        {view === 'history' && <HistoryView logs={logs} updateLog={handleUpdateLog} />}
      </main>
    </div>
  );
};

export default App;