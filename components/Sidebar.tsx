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
    { id: 'dashboard', label: t.sidebar.dashboard, icon: <LayoutGrid size={20} /> },
    { id: 'library', label: t.sidebar.library, icon: <Library size={20} /> },
    { id: 'builder', label: t.sidebar.builder, icon: <TestTube2 size={20} /> },
    { id: 'history', label: t.sidebar.history, icon: <History size={20} /> },
  ];

  // Strictly enforce BYOK (Bring Your Own Key) - Removed hardcoded privileged user check
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
        return <span className="text-zinc-500 flex items-center gap-1.5"><RefreshCcw size={12} className="animate-spin"/> {t.sidebar.syncSaving}</span>;
      case 'error':
        return <span className="text-red-400 flex items-center gap-1.5"><AlertTriangle size={12}/> {t.sidebar.syncError}</span>;
      case 'saved':
      default:
        return <span className="text-zinc-600 flex items-center gap-1.5"><Cloud size={12}/> {t.sidebar.syncSaved}</span>;
    }
  };

  return (
    <>
      {/* 
        -------------------------------------------
        MOBILE: Top Header & Bottom Navigation
        -------------------------------------------
      */}
      
      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-banana-400 to-banana-600 flex items-center justify-center text-zinc-950 font-bold text-lg">
            H
          </div>
          <span className="font-bold text-zinc-100 tracking-tight">Hotker Studio</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[10px]">{renderSyncStatus()}</div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-zinc-400 hover:text-zinc-100">
             <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Mobile Slide-over Menu (Settings/Profile) */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
           <div className="absolute top-0 bottom-0 right-0 w-64 bg-zinc-900 border-l border-zinc-800 p-6 flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-zinc-100">{t.sidebar.settings}</h3>
                <button onClick={() => setIsMobileMenuOpen(false)}><X size={20} className="text-zinc-400"/></button>
              </div>

              {currentUser && (
                <div className="flex items-center gap-3 mb-6 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0">
                    {currentUser.avatarUrl ? <img src={currentUser.avatarUrl} className="w-full h-full object-cover"/> : <UserIcon className="p-2"/>}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-100 truncate">{currentUser.username}</p>
                    <p className="text-xs text-zinc-500 capitalize">{currentUser.provider}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <button 
                  onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-300 hover:text-banana-400"
                >
                  <Globe size={18} />
                  <span>{lang === 'zh' ? 'English' : '中文'}</span>
                </button>

                <button 
                  onClick={openKeyModal}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-300 hover:text-banana-400"
                >
                  <KeyRound size={18} />
                  <span>{t.sidebar.apiKeyConfig}</span>
                  <span className={`ml-auto text-[10px] ${hasValidKey ? 'text-green-500' : 'text-red-500'}`}>●</span>
                </button>
                
                <button 
                  onClick={() => { setIsMobileMenuOpen(false); setIsPwModalOpen(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-300 hover:text-banana-400"
                >
                  <Lock size={18} />
                  <span>{t.sidebar.changePassword}</span>
                </button>

                <button 
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-400 hover:text-red-400"
                >
                  <LogOut size={18} />
                  <span>{t.sidebar.logout}</span>
                </button>
              </div>
              
              <div className="mt-auto pt-6 border-t border-zinc-800 text-xs text-zinc-500 text-center">
                 <p className="mb-2 text-[10px] uppercase tracking-wider font-bold">Created by {AUTHOR_INFO.name}</p>
                 <div className="flex justify-center gap-3 text-[10px]">
                   <a href={AUTHOR_INFO.website} target="_blank" className="hover:text-zinc-300">Website</a>
                   <span className="text-zinc-800">|</span>
                   <a href={AUTHOR_INFO.github} target="_blank" className="hover:text-zinc-300">GitHub</a>
                   <span className="text-zinc-800">|</span>
                   <a href={AUTHOR_INFO.twitterUrl} target="_blank" className="hover:text-zinc-300">Twitter</a>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-zinc-950 border-t border-zinc-800 flex justify-around items-start pt-3 z-30 pb-safe">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className="flex flex-col items-center gap-1 min-w-[64px]"
          >
            <div className={`p-1.5 rounded-full transition-colors ${currentView === item.id ? 'text-banana-400 bg-banana-500/10' : 'text-zinc-500'}`}>
              {item.icon}
            </div>
            <span className={`text-[10px] font-medium ${currentView === item.id ? 'text-banana-400' : 'text-zinc-600'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>


      {/* 
        -------------------------------------------
        DESKTOP: Standard Sidebar (Hidden on Mobile)
        -------------------------------------------
      */}
      <div className="hidden md:flex w-64 bg-zinc-900 h-full border-r border-zinc-800 flex-col relative z-20">
        <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-banana-400 to-banana-600 flex items-center justify-center text-zinc-950 font-bold text-lg">
            H
          </div>
          <div>
            <h1 className="font-bold text-zinc-100 tracking-tight">Hotker Studio</h1>
            <p className="text-xs text-zinc-500">Prompt Engineering</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                currentView === item.id
                  ? 'bg-banana-500/10 text-banana-400 font-medium'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
              }`}
            >
              <span className={currentView === item.id ? 'text-banana-400' : 'text-zinc-500 group-hover:text-zinc-300'}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800 space-y-4">
          {/* User Profile */}
          {currentUser && (
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700 flex-shrink-0">
                 {currentUser.avatarUrl ? (
                   <img src={currentUser.avatarUrl} alt={currentUser.username} className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-zinc-500">
                      <UserIcon size={16} />
                   </div>
                 )}
              </div>
              <div className="flex-1 min-w-0">
                 <p className="text-sm font-semibold text-zinc-200 truncate">{currentUser.username}</p>
                 <div className="flex items-center justify-between">
                   <p className="text-[10px] text-zinc-500 truncate capitalize">{currentUser.provider}</p>
                   <div className="text-[10px]">
                     {renderSyncStatus()}
                   </div>
                 </div>
              </div>
            </div>
          )}

          <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-800">
             {/* API Key Status */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-zinc-800/50">
               <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <span className={`${hasValidKey ? 'text-green-500' : 'text-red-500'}`}>●</span>
                  API
               </p>
               <button 
                 onClick={openKeyModal}
                 className="text-zinc-500 hover:text-banana-400 transition-colors"
                 title={t.sidebar.apiKeyConfig}
               >
                 <Settings size={12} />
               </button>
            </div>

            {/* Language & Password & Logout */}
            <div className="flex justify-between items-center">
              <button 
                onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
                className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                title="Switch Language"
              >
                <Globe size={12} /> {lang === 'zh' ? 'EN' : '中'}
              </button>
              
              <div className="flex gap-2">
                <button 
                    onClick={() => setIsPwModalOpen(true)}
                    className="text-zinc-500 hover:text-banana-400 transition-colors"
                    title={t.sidebar.changePassword}
                >
                    <Lock size={12} />
                </button>
                <button 
                    onClick={onLogout}
                    className="text-zinc-500 hover:text-red-400 transition-colors"
                    title={t.sidebar.logout}
                >
                    <LogOut size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global API Key Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button onClick={() => setIsKeyModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300">
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-banana-500/10 flex items-center justify-center text-banana-500">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-100">{t.sidebar.apiKeyConfig}</h3>
                <p className="text-xs text-zinc-500">Google AI Studio</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Key</label>
                <input 
                  type="password"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-200 focus:border-banana-500/50 outline-none text-sm font-mono placeholder-zinc-700"
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="AIzaSy..."
                />
              </div>

              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 text-xs text-banana-400 hover:text-banana-300 transition-colors w-fit"
              >
                Get API Key <ExternalLink size={10} />
              </a>

              <div className="pt-4 flex gap-3">
                 <button 
                   onClick={() => setIsKeyModalOpen(false)}
                   className="flex-1 py-2 text-sm text-zinc-400 hover:text-zinc-200"
                 >
                   {t.library.btnCancel}
                 </button>
                 <button 
                   onClick={handleSaveKey}
                   className="flex-1 py-2 text-sm bg-banana-500 hover:bg-banana-400 text-zinc-950 font-bold rounded-lg"
                 >
                   {t.library.btnSave}
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPwModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
           <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
              <button onClick={() => setIsPwModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300">
                <X size={20} />
              </button>
              <h3 className="text-lg font-bold text-zinc-100 mb-6">{t.password.title}</h3>
              
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">{t.password.current}</label>
                  <input type="password" required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-200 focus:border-banana-500/50 outline-none text-sm" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">{t.password.new}</label>
                  <input type="password" required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-200 focus:border-banana-500/50 outline-none text-sm" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">{t.password.confirm}</label>
                  <input type="password" required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-200 focus:border-banana-500/50 outline-none text-sm" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                </div>

                {pwMsg && <p className={`text-xs ${pwMsg === t.password.success ? 'text-green-500' : 'text-red-500'}`}>{pwMsg}</p>}

                <div className="pt-2 flex gap-3">
                   <button type="button" onClick={() => setIsPwModalOpen(false)} className="flex-1 py-2 text-sm text-zinc-400 hover:text-zinc-200">{t.library.btnCancel}</button>
                   <button type="submit" className="flex-1 py-2 text-sm bg-banana-500 hover:bg-banana-400 text-zinc-950 font-bold rounded-lg">{t.password.submit}</button>
                </div>
              </form>
           </div>
        </div>
      )}
    </>
  );
};