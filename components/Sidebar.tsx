import React, { useState, useEffect, useRef } from 'react';
import { LayoutGrid, Library, TestTube2, History, LogOut, KeyRound, X, Cloud, RefreshCcw, AlertCircle, Menu, Command, ChevronRight, ExternalLink, ShieldCheck, Check, Link2 } from 'lucide-react';
import { ViewState, User } from '../types';
import { Language, translations } from '../translations';
import { validateApiKey } from '../services/geminiService';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  currentUser: User | null;
  onLogout: () => void;
  userApiKey: string; // Deprecated: API key is now strictly from environment
  setUserApiKey: (key: string) => void;
  syncStatus?: 'saved' | 'saving' | 'error' | 'offline';
  syncErrorMsg?: string;
  lang: Language;
  setLang: (l: Language) => void;
  onForceSync?: () => void;
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
  setLang,
  onForceSync
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [localKey, setLocalKey] = useState(userApiKey);
  const [keyStatus, setKeyStatus] = useState<'checking' | 'valid' | 'invalid' | 'unknown'>('unknown');

  // Timer ref for hover delay
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const t = translations[lang];

  const navItems: { id: ViewState; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: t.sidebar.dashboard, icon: <LayoutGrid size={18} /> },
    { id: 'library', label: t.sidebar.library, icon: <Library size={18} /> },
    { id: 'builder', label: t.sidebar.builder, icon: <TestTube2 size={18} /> },
    { id: 'history', label: t.sidebar.history, icon: <History size={18} /> },
    { id: 'myShares', label: lang === 'zh' ? '我的分享' : 'My Shares', icon: <Link2 size={18} /> },
  ];

  // Guidelines: API key handling is managed by the execution environment via process.env.API_KEY.
  // Check both process.env and global window object for key presence/capability.
  // Update: Also check user provided key.
  const hasEnvKey = !!process.env.API_KEY || (typeof window !== 'undefined' && !!window.aistudio);
  const hasUserKey = !!userApiKey;

  // Effect to validate key on load or change
  useEffect(() => {
    const checkKey = async () => {
      setKeyStatus('checking');
      if (hasUserKey) {
        const isValid = await validateApiKey(userApiKey);
        setKeyStatus(isValid ? 'valid' : 'invalid');
      } else if (hasEnvKey) {
        // Assume env key is valid initially, but we could validate it too if needed
        setKeyStatus('valid');
      } else {
        setKeyStatus('unknown');
      }
    };
    checkKey();
  }, [userApiKey, hasEnvKey]);

  const handleOpenKeySelection = async () => {
    // Guidelines: Use openSelectKey to allow users to select their paid project key for Imagen/Veo if in compatible env.
    if (typeof window !== 'undefined' && window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
      } catch (e) {
        console.error("Failed to open key selection:", e);
      }
    } else {
      // In standalone environment, open manual config modal
      setLocalKey(userApiKey);
      setIsKeyModalOpen(true);
    }
  };

  const handleSaveKey = async () => {
    setKeyStatus('checking');
    const isValid = await validateApiKey(localKey);
    setKeyStatus(isValid ? 'valid' : 'invalid');

    if (isValid) {
      setUserApiKey(localKey);
      setIsKeyModalOpen(false);
    } else {
      // Allow saving even if validation fails? Maybe just warn.
      // For now, let's allow it but keep modal open or show error
      alert(t.sidebar.apiKeyInvalid);
    }
  };

  const handleMouseEnter = () => {
    // Clear any existing timeout (though usually none if we weren't hovering)
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

    // Delay expansion by 300ms to prevent accidental triggers
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    // Instant collapse, and cancel any pending expansion
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(false);
  };

  const renderKeyStatus = () => {
    switch (keyStatus) {
      case 'checking':
        return <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>;
      case 'valid':
        return <div className="w-2 h-2 rounded-full bg-emerald-500"></div>;
      case 'invalid':
        return <div className="w-2 h-2 rounded-full bg-red-500"></div>;
      default:
        return <div className="w-2 h-2 rounded-full bg-slate-300"></div>;
    }
  };

  const getKeyStatusText = () => {
    if (keyStatus === 'checking') return t.sidebar.validating;
    if (keyStatus === 'valid') return t.sidebar.apiKeyConnected;
    if (keyStatus === 'invalid') return t.sidebar.apiKeyInvalid;
    return t.sidebar.apiKeyMissing;
  }

  const renderSyncStatus = () => {
    switch (syncStatus) {
      case 'saving':
        return (
          <div className="text-blue-500 flex items-center gap-1.5 text-[10px] font-medium animate-pulse">
            <RefreshCcw size={10} className="animate-spin" />
            {t.sidebar.syncSaving}
          </div>
        );
      case 'error':
        return (
          <button
            onClick={onForceSync}
            title={syncErrorMsg || '点击重试'}
            className="text-red-500 flex items-center gap-1.5 text-[10px] font-medium hover:bg-red-50 px-1.5 py-0.5 rounded transition-colors group"
          >
            <AlertCircle size={10} className="group-hover:animate-bounce" />
            {t.sidebar.syncError}
          </button>
        );
      case 'offline':
        return (
          <button
            onClick={onForceSync}
            title="数据来自本地备份，点击同步到云端"
            className="text-amber-600 flex items-center gap-1.5 text-[10px] font-medium hover:bg-amber-50 px-1.5 py-0.5 rounded transition-colors group"
          >
            <AlertCircle size={10} />
            本地数据
          </button>
        );
      case 'saved':
      default:
        return (
          <div className="text-slate-400 flex items-center gap-1.5 text-[10px] font-medium">
            <Cloud size={10} />
            {t.sidebar.syncSaved}
          </div>
        );
    }
  };

  // --- Helper Classes ---
  const isLibrary = currentView === 'library';

  // Width: Expanded if hovered OR (not library AND desktop)
  // But wait, the previous logic relied on CSS media queries for desktop check (lg:)
  // We can't easily do JS-only desktop check without listeners/relayout.
  // So we stick to composite classes.

  // Base state: w-20
  // Desktop idle: lg:w-64 (UNLESS library)
  // Hovered: w-64 (Overrides everything)

  let sidebarWidthClass = "w-20";
  if (isHovered) {
    sidebarWidthClass = "w-64";
  } else if (isLibrary) {
    sidebarWidthClass = "w-20"; // Stay collapsed
  } else {
    sidebarWidthClass = "w-20 lg:w-64"; // Default responsive behavior
  }

  // Text Visibility: 
  // Base: Hidden (w-0 opacity-0)
  // Desktop idle: lg:visible (UNLESS library)
  // Hovered: Visible
  let textVisibilityClass = "max-w-0 opacity-0";
  if (isHovered) {
    textVisibilityClass = "max-w-[200px] opacity-100";
  } else if (isLibrary) {
    textVisibilityClass = "max-w-0 opacity-0";
  } else {
    textVisibilityClass = "max-w-0 opacity-0 lg:max-w-[200px] lg:opacity-100";
  }

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-50 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="bg-slate-900 text-white p-1 rounded"><Command size={16} strokeWidth={2.5} /></div>
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-slate-900 text-sm tracking-tight">Hotker</span>
            <span className="text-slate-900 text-sm font-light tracking-wide">Prompt Studio</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-md">
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute top-0 bottom-0 right-0 w-80 bg-white shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-lg">{t.sidebar.menu}</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"><X size={20} /></button>
            </div>

            <div className="flex-1 py-4 px-2 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setView(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${currentView === item.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {currentView === item.id && <ChevronRight size={16} className="ml-auto opacity-50" />}
                </button>
              ))}
            </div>

            <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/50">
              <div className="flex items-center gap-3 px-2 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">
                  {currentUser?.username.substring(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{currentUser?.username}</div>
                  <div className="text-xs text-slate-500">{t.sidebar.freePlan}</div>
                </div>
              </div>

              <button onClick={handleOpenKeySelection} className="w-full btn-secondary text-xs flex items-center justify-center gap-2">
                <KeyRound size={14} /> {t.sidebar.apiConfigTitle}
              </button>
              <a
                href="https://ai.google.dev/gemini-api/docs/billing"
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-1 text-[10px] text-blue-500 hover:underline"
              >
                {t.sidebar.apiConfigDesc} <ExternalLink size={10} />
              </a>
              <button onClick={onLogout} className="w-full btn-ghost text-xs text-red-600 hover:text-red-700 hover:bg-red-50">
                <LogOut size={14} /> {t.sidebar.logout}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div
        className={`hidden md:flex bg-white h-full border-r border-slate-200 flex-col relative z-20 transition-all duration-300 ease-in-out ${sidebarWidthClass}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >

        {/* Brand */}
        <div className="h-12 flex items-center px-5 border-b border-slate-100 shrink-0 overflow-hidden whitespace-nowrap">
          <div className="bg-slate-900 text-white p-1 rounded-md shadow-sm shrink-0"><Command size={16} strokeWidth={3} /></div>

          <div className={`ml-3 transition-all duration-300 ease-in-out overflow-hidden flex items-center gap-2 ${textVisibilityClass}`}>
            <h1 className="font-bold text-slate-900 text-sm tracking-tight">Hotker</h1>
            <span className="text-slate-900 text-sm font-normal tracking-wide">Prompt Studio</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center px-3 py-2.5 rounded-md transition-all group ${currentView === item.id
                ? 'bg-slate-100 text-slate-900 shadow-sm font-medium ring-1 ring-slate-200'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <span className={`shrink-0 ${currentView === item.id ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                {item.icon}
              </span>

              <span className={`ml-3 text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${isHovered ? 'max-w-[150px] opacity-100' : (isLibrary ? 'max-w-0 opacity-0' : 'max-w-0 opacity-0 lg:max-w-[150px] lg:opacity-100')}`}>
                {item.label}
              </span>

              {currentView === item.id && (
                <div className={`ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 transition-opacity duration-300 ${isHovered ? 'opacity-100' : (isLibrary ? 'opacity-0' : 'opacity-0 lg:opacity-100')}`}></div>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 overflow-hidden">
          {/* API Status */}
          <div className={`flex items-center transition-all duration-300 ${isHovered
            ? 'justify-between'
            : (isLibrary ? 'justify-center' : 'justify-center lg:justify-between')
            }`}>
            <div className="flex items-center justify-between w-full px-2 mb-4 h-6">
              <div className="flex items-center gap-2">
                {renderKeyStatus()}
                <span className={`text-xs text-slate-500 font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${isHovered ? 'max-w-[100px] opacity-100' : (isLibrary ? 'max-w-0 opacity-0' : 'max-w-0 opacity-0 lg:max-w-[100px] lg:opacity-100')}`}>
                  {getKeyStatusText()}
                </span>
              </div>
              <button
                onClick={handleOpenKeySelection}
                title={t.sidebar.apiConfigTitle}
                className={`text-slate-400 hover:text-slate-900 transition-colors p-1 hover:bg-slate-100 rounded shrink-0 ${isHovered ? 'opacity-100' : (isLibrary ? 'hidden' : 'hidden lg:block')}`}
              >
                <KeyRound size={14} />
              </button>
            </div>
          </div>

          {/* User Profile */}
          <div className={`rounded-lg bg-slate-50 border border-slate-100 flex items-center mb-3 transition-all duration-300 ${isHovered
            ? 'p-2 gap-3'
            : (isLibrary ? 'p-0 border-0 bg-transparent justify-center' : 'p-0 border-0 bg-transparent justify-center lg:p-2 lg:gap-3 lg:border lg:bg-slate-50 lg:justify-start')
            }`}>
            <div className="w-8 h-8 bg-white border border-slate-200 rounded-md flex items-center justify-center text-xs font-bold text-slate-700 shadow-sm shrink-0">
              {currentUser?.username.substring(0, 1).toUpperCase()}
            </div>
            <div className={`min-w-0 whitespace-nowrap overflow-hidden transition-all duration-300 ${isHovered ? 'max-w-[120px] opacity-100' : (isLibrary ? 'max-w-0 opacity-0' : 'max-w-0 opacity-0 lg:max-w-[120px] lg:opacity-100')}`}>
              <p className="text-xs font-medium text-slate-900 truncate">{currentUser?.username}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span className="text-[10px] text-slate-500">{t.sidebar.online}</span>
              </div>
            </div>
          </div>

          <div className={`flex justify-between items-center text-[10px] text-slate-400 px-1 whitespace-nowrap overflow-hidden transition-all duration-300 ${isHovered ? 'max-h-[20px] opacity-100' : (isLibrary ? 'max-h-0 opacity-0' : 'max-h-0 opacity-0 lg:max-h-[20px] lg:opacity-100')}`}>
            <span>{renderSyncStatus()}</span>
            <button onClick={onLogout} className="hover:text-red-500 transition-colors flex items-center gap-1">
              <LogOut size={10} /> {t.sidebar.logout}
            </button>
          </div>
        </div>
      </div>

      {/* API Key Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsKeyModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><KeyRound size={18} /></div>
                <h3 className="font-bold text-slate-900">{t.sidebar.apiConfigTitle}</h3>
              </div>
              <button onClick={() => setIsKeyModalOpen(false)} className="text-slate-400 hover:text-slate-900"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded-lg flex items-start gap-2 leading-relaxed">
                <ShieldCheck size={14} className="mt-0.5 shrink-0" />
                <p>{t.sidebar.saveKeyInfo}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">{t.sidebar.enterKey}</label>
                <input
                  type="password"
                  value={localKey}
                  onChange={(e) => setLocalKey(e.target.value)}
                  className="prod-input font-mono text-sm"
                  placeholder="AIzaSy..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setIsKeyModalOpen(false)} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100">{t.sidebar.cancel}</button>
                <button onClick={handleSaveKey} disabled={!localKey || keyStatus === 'checking'} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2">
                  {keyStatus === 'checking' ? <RefreshCcw size={12} className="animate-spin" /> : <Check size={14} />}
                  {t.sidebar.connect}
                </button>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline font-medium inline-flex items-center gap-1">
                {t.sidebar.apiConfigDesc} <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
