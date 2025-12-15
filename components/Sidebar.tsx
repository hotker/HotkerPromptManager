import React, { useState } from 'react';
import { LayoutGrid, Library, TestTube2, History, LogOut, Settings, KeyRound, X, Cloud, RefreshCcw, AlertTriangle, Menu, Hexagon, Zap } from 'lucide-react';
import { ViewState, User } from '../types';
import { Language, translations } from '../translations';
import { authService } from '../services/authService';
import { AUTHOR_INFO } from '../constants';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  currentUser: User | null;
  onLogout: () => void;
  userApiKey: string;
  setUserApiKey: (key: string) => void;
  syncStatus?: 'saved' | 'saving' | 'error';
  syncErrorMsg?: string;
  lang: Language;
  setLang: (l: Language) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  setView, 
  currentUser, 
  onLogout,
  userApiKey,
  setUserApiKey,
  syncStatus = 'saved',
  syncErrorMsg,
  lang,
  setLang
}) => {
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [tempKey, setTempKey] = useState(userApiKey);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const t = translations[lang];

  const navItems: { id: ViewState; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: t.sidebar.dashboard, icon: <LayoutGrid size={18} /> },
    { id: 'library', label: t.sidebar.library, icon: <Library size={18} /> },
    { id: 'builder', label: t.sidebar.builder, icon: <TestTube2 size={18} /> },
    { id: 'history', label: t.sidebar.history, icon: <History size={18} /> },
  ];

  const hasValidKey = !!userApiKey;

  const handleSaveKey = () => {
    setUserApiKey(tempKey.trim());
    setIsKeyModalOpen(false);
  };

  const openKeyModal = () => {
    setTempKey(userApiKey);
    setIsKeyModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const renderSyncStatus = () => {
    switch(syncStatus) {
      case 'saving':
        return <span className="text-cyber-primary flex items-center gap-1.5 text-[10px] tracking-wider animate-pulse"><RefreshCcw size={10} className="animate-spin"/> SYNCING</span>;
      case 'error':
        return <span className="text-red-500 flex items-center gap-1.5 text-[10px] tracking-wider"><AlertTriangle size={10}/> ERR_SYNC</span>;
      case 'saved':
      default:
        return <span className="text-gray-600 flex items-center gap-1.5 text-[10px] tracking-wider"><Cloud size={10}/> ONLINE</span>;
    }
  };

  return (
    <>
      {/* Mobile Top Header - HUD Strip */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#030508]/90 backdrop-blur-xl border-b border-cyber-primary/20 flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-3">
           <Hexagon className="text-cyber-primary animate-pulse" size={24} strokeWidth={1.5} />
           <span className="font-bold text-white tracking-widest text-lg font-mono">HOTKER</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-[10px] opacity-70">{renderSyncStatus()}</div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-cyber-primary hover:text-white">
             <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/90 backdrop-blur-xl animate-in fade-in" onClick={() => setIsMobileMenuOpen(false)}>
           <div className="absolute top-0 bottom-0 right-0 w-72 bg-[#0a0f16] border-l border-cyber-primary/30 p-6 flex flex-col shadow-[0_0_50px_rgba(0,240,255,0.1)]" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                <h3 className="font-bold text-cyber-primary tracking-widest">SYSTEM_OPTS</h3>
                <button onClick={() => setIsMobileMenuOpen(false)}><X size={20} className="text-gray-500 hover:text-white"/></button>
              </div>
              
              <div className="space-y-3 font-mono">
                 <button onClick={openKeyModal} className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-none text-cyber-text hover:bg-white/10 hover:border-cyber-primary/50 transition-all clip-tech">
                    <KeyRound size={16} /> <span>API_CONFIG</span>
                 </button>
                 <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 bg-red-900/10 border border-red-500/20 rounded-none text-red-400 hover:bg-red-900/20 clip-tech">
                    <LogOut size={16} /> <span>DISCONNECT</span>
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Desktop Sidebar - Vertical HUD */}
      <div className="hidden md:flex w-20 lg:w-64 bg-[#050608] h-full border-r border-white/5 flex-col relative z-20 shadow-[5px_0_30px_rgba(0,0,0,0.5)]">
        
        {/* Logo Area */}
        <div className="h-24 flex items-center gap-3 px-6 border-b border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-cyber-primary/20 group-hover:bg-cyber-primary transition-colors"></div>
          <Hexagon className="text-cyber-primary drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]" size={32} strokeWidth={1} />
          <div className="hidden lg:block">
            <h1 className="font-bold text-white tracking-[0.2em] text-xl font-mono">HOTKER</h1>
            <div className="text-[9px] text-cyber-primary/60 tracking-widest mt-[-2px]">PROMPT_STUDIO</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-8 space-y-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-4 transition-all duration-300 group relative clip-tech ${
                currentView === item.id
                  ? 'bg-cyber-primary/10 text-cyber-primary'
                  : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 bg-cyber-primary transition-opacity ${currentView === item.id ? 'opacity-100' : 'opacity-0'}`}></div>
              
              <span className={`relative z-10 transition-transform duration-300 ${currentView === item.id ? 'scale-110 drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]' : 'group-hover:text-cyber-primary'}`}>
                {item.icon}
              </span>
              <span className={`hidden lg:block text-xs font-bold tracking-widest uppercase relative z-10`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        {/* Bottom Section: User & Config */}
        <div className="p-4 border-t border-white/5 bg-[#030508]">
           {/* API Status Indicator */}
           <div className="flex items-center justify-between px-2 mb-4">
              <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${hasValidKey ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'} animate-pulse`}></div>
                 <span className="hidden lg:block text-[10px] text-gray-500 tracking-wider font-mono">SYS_STATUS</span>
              </div>
              <button onClick={openKeyModal} className="text-gray-600 hover:text-cyber-primary transition-colors">
                 <Settings size={14} />
              </button>
           </div>

           {/* User Profile Card - Tech Chip Style */}
           <div className="p-3 border border-white/5 bg-white/5 flex items-center gap-3 hover:border-cyber-primary/30 transition-all cursor-default group relative overflow-hidden clip-tech">
              <div className="w-8 h-8 bg-black border border-cyber-primary/50 flex items-center justify-center text-xs font-bold text-cyber-primary">
                  {currentUser?.username.substring(0,1).toUpperCase()}
              </div>
              <div className="hidden lg:block min-w-0 z-10">
                 <p className="text-xs font-bold text-gray-300 truncate font-mono">{currentUser?.username}</p>
                 <button onClick={onLogout} className="text-[10px] text-gray-600 hover:text-red-400 transition-colors flex items-center gap-1 mt-1 tracking-wider uppercase">
                    &gt;&gt; LOGOUT
                 </button>
              </div>
           </div>
           
           <div className="hidden lg:flex justify-between text-[9px] text-gray-700 pt-3 font-mono tracking-tighter">
              <span>V.2.0.4</span>
              <a href={AUTHOR_INFO.github} target="_blank" className="hover:text-cyber-primary transition-colors">GITHUB</a>
           </div>
        </div>
      </div>

      {/* API Key Modal - Sci-fi Popup */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0c121d] border border-white/10 w-full max-w-md p-8 clip-tech relative shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setIsKeyModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-cyber-primary"><X size={20} /></button>
            <div className="mb-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-cyber-primary/10 border border-cyber-primary flex items-center justify-center text-cyber-primary shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                <KeyRound size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-widest">SECURE_LINK</h3>
                <p className="text-gray-500 text-xs font-mono mt-1">AUTHORIZATION REQUIRED</p>
              </div>
            </div>
            
            <input 
              type="password"
              className="w-full cyber-input mb-6 font-mono text-sm"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              placeholder="ENTER_API_KEY_HERE"
            />
            <button onClick={handleSaveKey} className="w-full btn-tech">
              ESTABLISH CONNECTION
            </button>
          </div>
        </div>
      )}
    </>
  );
};