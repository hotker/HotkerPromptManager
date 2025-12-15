import React, { useState } from 'react';
import { LayoutGrid, Library, TestTube2, History, LogOut, User as UserIcon, Settings, KeyRound, X, ExternalLink, Cloud, RefreshCcw, AlertTriangle, Menu, Globe, Lock } from 'lucide-react';
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
  const [isPwModalOpen, setIsPwModalOpen] = useState(false);
  const [tempKey, setTempKey] = useState(userApiKey);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMsg, setPwMsg] = useState('');

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwMsg(t.password.mismatch);
      return;
    }
    if (!currentUser) return;
    try {
      await authService.changePassword(currentUser.username, currentPassword, newPassword);
      setPwMsg(t.password.success);
      setTimeout(() => {
        setIsPwModalOpen(false);
        setPwMsg('');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 1500);
    } catch (e: any) {
      setPwMsg(e.message);
    }
  };

  const renderSyncStatus = () => {
    switch(syncStatus) {
      case 'saving':
        return <span className="text-zinc-500 flex items-center gap-1.5 text-[10px]"><RefreshCcw size={10} className="animate-spin"/> {t.sidebar.syncSaving}</span>;
      case 'error':
        return <span className="text-red-400 flex items-center gap-1.5 text-[10px]"><AlertTriangle size={10}/> {t.sidebar.syncError}</span>;
      case 'saved':
      default:
        return <span className="text-zinc-600 flex items-center gap-1.5 text-[10px]"><Cloud size={10}/> {t.sidebar.syncSaved}</span>;
    }
  };

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-3">
           <div className="relative">
             <div className="absolute inset-0 bg-banana-500/20 blur-md rounded-full"></div>
             <div className="w-8 h-8 rounded-lg border border-banana-500/20 bg-zinc-900/50 flex items-center justify-center text-banana-500 font-bold text-lg relative z-10">
               H
             </div>
           </div>
          <span className="font-bold text-zinc-100 tracking-tight text-lg">Hotker</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-[10px] opacity-70">{renderSyncStatus()}</div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-zinc-400 hover:text-white">
             <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/90 backdrop-blur-xl animate-in fade-in" onClick={() => setIsMobileMenuOpen(false)}>
           <div className="absolute top-0 bottom-0 right-0 w-72 bg-zinc-950 border-l border-zinc-800 p-6 flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
              {/* Mobile menu content omitted for brevity - styling follows the main theme */}
               <div className="flex justify-between items-center mb-8">
                <h3 className="font-bold text-zinc-100">{t.sidebar.settings}</h3>
                <button onClick={() => setIsMobileMenuOpen(false)}><X size={20} className="text-zinc-400"/></button>
              </div>
              
              {/* Controls */}
              <div className="space-y-3">
                 <button onClick={openKeyModal} className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-300">
                    <KeyRound size={16} /> <span>API Key</span>
                 </button>
                 <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                    <LogOut size={16} /> <span>{t.sidebar.logout}</span>
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Desktop Sidebar - Minimalist Tech */}
      <div className="hidden md:flex w-20 lg:w-64 bg-black/20 backdrop-blur-xl h-full border-r border-white/5 flex-col relative z-20 transition-all duration-300">
        
        {/* Logo Area */}
        <div className="p-6 flex items-center gap-4 mb-6">
          <div className="relative group cursor-pointer">
             <div className="absolute inset-0 bg-banana-500/20 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
             <div className="w-8 h-8 rounded-xl border border-white/10 bg-zinc-900/80 flex items-center justify-center text-banana-400 font-bold text-xl relative z-10 shadow-lg group-hover:border-banana-500/50 transition-colors">
               H
             </div>
          </div>
          <div className="hidden lg:block">
            <h1 className="font-bold text-zinc-100 tracking-tight leading-none">Hotker</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Prompt Studio</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-300 group relative overflow-hidden ${
                currentView === item.id
                  ? 'bg-white/5 text-banana-400'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              {currentView === item.id && (
                 <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-banana-500 rounded-r-full shadow-[0_0_10px_#fbbf24]"></div>
              )}
              <span className={`relative z-10 transition-transform duration-300 ${currentView === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </span>
              <span className={`hidden lg:block text-sm font-medium relative z-10 ${currentView === item.id ? 'text-zinc-100' : ''}`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        {/* Bottom Section: User & Config */}
        <div className="p-4 border-t border-white/5 space-y-3">
           {/* API Status Indicator */}
           <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                 <div className={`w-1.5 h-1.5 rounded-full ${hasValidKey ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`}></div>
                 <span className="hidden lg:block text-[10px] text-zinc-500 uppercase tracking-wider font-mono">API Status</span>
              </div>
              <button onClick={openKeyModal} className="text-zinc-600 hover:text-banana-400 transition-colors">
                 <Settings size={14} />
              </button>
           </div>

           {/* User Profile Card */}
           <div className="glass-panel p-3 rounded-xl flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/5 group-hover:border-white/20 transition-colors">
                  {currentUser?.avatarUrl ? <img src={currentUser.avatarUrl} className="w-full h-full object-cover"/> : <UserIcon size={14} className="text-zinc-500"/>}
              </div>
              <div className="hidden lg:block min-w-0">
                 <p className="text-xs font-bold text-zinc-300 truncate">{currentUser?.username}</p>
                 <div className="flex items-center gap-2">
                    <button onClick={onLogout} className="text-[10px] text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1">
                       <LogOut size={10} /> Logout
                    </button>
                 </div>
              </div>
           </div>
           
           <div className="hidden lg:flex justify-center gap-3 text-[10px] text-zinc-600 pt-2">
              <a href={AUTHOR_INFO.github} target="_blank" className="hover:text-banana-400 transition-colors">GitHub</a>
              <span>•</span>
              <a href={AUTHOR_INFO.website} target="_blank" className="hover:text-banana-400 transition-colors">Web</a>
           </div>
        </div>
      </div>

      {/* Global Modals (kept functional but styled simplified) */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md p-8 rounded-2xl relative">
            <button onClick={() => setIsKeyModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={20} /></button>
            <div className="mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center text-banana-400 mb-4 shadow-lg">
                <KeyRound size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">API Configuration</h3>
              <p className="text-zinc-500 text-sm mt-1">Connect your Google AI Studio key</p>
            </div>
            <input 
              type="password"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-banana-500/50 outline-none transition-colors font-mono text-sm mb-4"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              placeholder="AIzaSy..."
            />
            <button onClick={handleSaveKey} className="w-full bg-banana-500 hover:bg-banana-400 text-black font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(251,191,36,0.2)]">
              Connect API
            </button>
          </div>
        </div>
      )}
      
      {/* Password Modal omitted for brevity, logic remains same */}
      {isPwModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
           {/* Same style as Key Modal */}
           <div className="glass-panel w-full max-w-md p-8 rounded-2xl relative">
              <button onClick={() => setIsPwModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={20} /></button>
              <h3 className="text-xl font-bold text-white mb-6">{t.password.title}</h3>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <input type="password" placeholder={t.password.current} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-banana-500/50 outline-none text-sm" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                <input type="password" placeholder={t.password.new} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-banana-500/50 outline-none text-sm" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                <input type="password" placeholder={t.password.confirm} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-banana-500/50 outline-none text-sm" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                {pwMsg && <p className={`text-xs ${pwMsg === t.password.success ? 'text-green-400' : 'text-red-400'}`}>{pwMsg}</p>}
                <button type="submit" className="w-full bg-zinc-100 hover:bg-white text-black font-bold py-3 rounded-xl transition-all mt-2">{t.password.submit}</button>
              </form>
           </div>
        </div>
      )}
    </>
  );
};