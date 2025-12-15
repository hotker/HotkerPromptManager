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
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0e0e10]/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 flex items-center justify-center text-banana-500 font-bold text-xl">
             <Cloud size={24} fill="currentColor" className="text-banana-500" />
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
           <div className="absolute top-0 bottom-0 right-0 w-72 bg-[#161618] border-l border-zinc-800 p-6 flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-8">
                <h3 className="font-bold text-zinc-100">{t.sidebar.settings}</h3>
                <button onClick={() => setIsMobileMenuOpen(false)}><X size={20} className="text-zinc-400"/></button>
              </div>
              
              <div className="space-y-3">
                 <button onClick={openKeyModal} className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-300">
                    <KeyRound size={16} /> <span>API Key</span>
                 </button>
                 <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-md text-red-400">
                    <LogOut size={16} /> <span>{t.sidebar.logout}</span>
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Desktop Sidebar - Enterprise Tech Style */}
      <div className="hidden md:flex w-20 lg:w-64 bg-[#0e0e10] h-full border-r border-white/5 flex-col relative z-20">
        
        {/* Logo Area */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-white/5">
          <Cloud size={24} className="text-banana-500" fill="currentColor" />
          <div className="hidden lg:block">
            <h1 className="font-bold text-zinc-100 tracking-tight text-lg">Hotker</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group ${
                currentView === item.id
                  ? 'bg-banana-500 text-white font-medium shadow-lg shadow-banana-500/20'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
              }`}
            >
              <span className={`transition-transform duration-200`}>
                {item.icon}
              </span>
              <span className={`hidden lg:block text-sm ${currentView === item.id ? 'text-white' : ''}`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        {/* Bottom Section: User & Config */}
        <div className="p-4 border-t border-white/5 bg-[#121214]">
           {/* API Status Indicator */}
           <div className="flex items-center justify-between px-2 mb-3">
              <div className="flex items-center gap-2">
                 <div className={`w-1.5 h-1.5 rounded-full ${hasValidKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
                 <span className="hidden lg:block text-[10px] text-zinc-500 uppercase tracking-wider font-mono">API Status</span>
              </div>
              <button onClick={openKeyModal} className="text-zinc-600 hover:text-banana-500 transition-colors">
                 <Settings size={14} />
              </button>
           </div>

           {/* User Profile Card */}
           <div className="p-2 rounded-md flex items-center gap-3 hover:bg-white/5 transition-colors cursor-default">
              <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/10 text-xs font-bold text-zinc-400">
                  {currentUser?.avatarUrl ? <img src={currentUser.avatarUrl} className="w-full h-full object-cover"/> : currentUser?.username.substring(0,2).toUpperCase()}
              </div>
              <div className="hidden lg:block min-w-0">
                 <p className="text-xs font-bold text-zinc-300 truncate">{currentUser?.username}</p>
                 <div className="flex items-center gap-2 mt-0.5">
                    <button onClick={onLogout} className="text-[10px] text-zinc-500 hover:text-white transition-colors flex items-center gap-1">
                       Sign out
                    </button>
                 </div>
              </div>
           </div>
           
           <div className="hidden lg:flex justify-center gap-3 text-[10px] text-zinc-600 pt-4 border-t border-white/5 mt-3">
              <a href={AUTHOR_INFO.github} target="_blank" className="hover:text-banana-500 transition-colors">GitHub</a>
              <span className="text-zinc-800">|</span>
              <a href={AUTHOR_INFO.website} target="_blank" className="hover:text-banana-500 transition-colors">Web</a>
           </div>
        </div>
      </div>

      {/* Global Modals */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#161618] w-full max-w-md p-8 rounded-lg border border-white/10 shadow-2xl relative">
            <button onClick={() => setIsKeyModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={20} /></button>
            <div className="mb-6">
              <div className="w-10 h-10 rounded bg-banana-500/10 flex items-center justify-center text-banana-500 mb-4">
                <KeyRound size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">API Configuration</h3>
              <p className="text-zinc-500 text-sm mt-1">Connect your Google AI Studio key</p>
            </div>
            <input 
              type="password"
              className="w-full bg-black/20 border border-white/10 rounded px-4 py-2.5 text-white focus:border-banana-500 outline-none transition-colors font-mono text-sm mb-4"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              placeholder="AIzaSy..."
            />
            <button onClick={handleSaveKey} className="w-full bg-banana-500 hover:bg-banana-600 text-white font-medium py-2.5 rounded transition-all">
              Connect API
            </button>
          </div>
        </div>
      )}
      
      {isPwModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-[#161618] w-full max-w-md p-8 rounded-lg border border-white/10 shadow-2xl relative">
              <button onClick={() => setIsPwModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={20} /></button>
              <h3 className="text-lg font-bold text-white mb-6">{t.password.title}</h3>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <input type="password" placeholder={t.password.current} className="w-full bg-black/20 border border-white/10 rounded px-4 py-2.5 text-white focus:border-banana-500 outline-none text-sm" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                <input type="password" placeholder={t.password.new} className="w-full bg-black/20 border border-white/10 rounded px-4 py-2.5 text-white focus:border-banana-500 outline-none text-sm" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                <input type="password" placeholder={t.password.confirm} className="w-full bg-black/20 border border-white/10 rounded px-4 py-2.5 text-white focus:border-banana-500 outline-none text-sm" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                {pwMsg && <p className={`text-xs ${pwMsg === t.password.success ? 'text-green-400' : 'text-red-400'}`}>{pwMsg}</p>}
                <button type="submit" className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-2.5 rounded transition-all mt-2">{t.password.submit}</button>
              </form>
           </div>
        </div>
      )}
    </>
  );
};