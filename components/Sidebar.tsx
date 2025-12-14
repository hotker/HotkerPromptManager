import React, { useState } from 'react';
import { LayoutGrid, Library, TestTube2, History, LogOut, User as UserIcon, Settings, KeyRound, X, ExternalLink, Cloud, CheckCircle2, RefreshCcw, AlertTriangle } from 'lucide-react';
import { ViewState, User } from '../types';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  currentUser: User | null;
  onLogout: () => void;
  userApiKey: string;
  setUserApiKey: (key: string) => void;
  syncStatus?: 'saved' | 'saving' | 'error';
  syncErrorMsg?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  setView, 
  currentUser, 
  onLogout,
  userApiKey,
  setUserApiKey,
  syncStatus = 'saved',
  syncErrorMsg
}) => {
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [tempKey, setTempKey] = useState(userApiKey);

  const navItems: { id: ViewState; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: '仪表盘', icon: <LayoutGrid size={20} /> },
    { id: 'library', label: '模块库', icon: <Library size={20} /> },
    { id: 'builder', label: '提示词构建', icon: <TestTube2 size={20} /> },
    { id: 'history', label: '运行历史', icon: <History size={20} /> },
  ];

  const isPrivilegedUser = currentUser?.username === 'hotker@gmail.com';
  
  // Status check: Valid if User has their own key, OR (User is privileged AND System has a key)
  // Use VITE_API_KEY for system default
  const systemKey = import.meta.env.VITE_API_KEY;
  const hasValidKey = !!userApiKey || (isPrivilegedUser && !!systemKey);

  const handleSaveKey = () => {
    setUserApiKey(tempKey.trim());
    setIsKeyModalOpen(false);
  };

  const openKeyModal = () => {
    setTempKey(userApiKey);
    setIsKeyModalOpen(true);
  };

  const renderSyncStatus = () => {
    switch(syncStatus) {
      case 'saving':
        return <span className="text-zinc-500 flex items-center gap-1.5"><RefreshCcw size={12} className="animate-spin"/> 同步中...</span>;
      case 'error':
        return (
          <span 
            className="text-red-400 flex items-center gap-1.5 cursor-help" 
            title={syncErrorMsg || "数据无法保存到云端，请检查网络或数据库绑定"}
          >
            <AlertTriangle size={12}/> 同步失败
          </span>
        );
      case 'saved':
      default:
        return <span className="text-zinc-600 flex items-center gap-1.5"><Cloud size={12}/> 已同步</span>;
    }
  };

  return (
    <>
      <div className="w-64 bg-zinc-900 h-full border-r border-zinc-800 flex flex-col relative z-20">
        <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-banana-400 to-banana-600 flex items-center justify-center text-zinc-950 font-bold text-lg">
            N
          </div>
          <div>
            <h1 className="font-bold text-zinc-100 tracking-tight">Nano Banana</h1>
            <p className="text-xs text-zinc-500">提示词工坊</p>
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
                   <p className="text-[10px] text-zinc-500 truncate capitalize">{currentUser.provider} 账户</p>
                   <div className="text-[10px]">
                     {renderSyncStatus()}
                   </div>
                 </div>
              </div>
            </div>
          )}

          <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-800">
            <div className="flex items-center justify-between mb-2">
               <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                  API 连接
                  <span className={`${hasValidKey ? 'text-green-500' : 'text-red-500'}`}>●</span>
               </p>
               <button 
                 onClick={openKeyModal}
                 className="text-zinc-500 hover:text-banana-400 transition-colors"
                 title="配置 API Key"
               >
                 <Settings size={12} />
               </button>
            </div>
            
            <div className="text-xs font-mono text-zinc-300 mb-3 truncate flex items-center gap-1">
              {userApiKey ? (
                <span className="text-banana-400/80">已使用自定义 Key</span>
              ) : (
                (isPrivilegedUser && systemKey) ? '系统默认 Key' : <span className="text-red-400">需配置 Key</span>
              )}
            </div>
            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 text-xs bg-zinc-900 hover:bg-red-500/10 hover:text-red-400 text-zinc-400 border border-zinc-800 py-1.5 rounded transition-colors"
            >
              <LogOut size={12} /> 注销登录
            </button>
          </div>
        </div>
      </div>

      {/* API Key Modal */}
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
                <h3 className="text-lg font-bold text-zinc-100">配置 Gemini API Key</h3>
                <p className="text-xs text-zinc-500">为当前用户设置专属密钥</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Google AI Studio Key</label>
                <input 
                  type="password"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-200 focus:border-banana-500/50 outline-none text-sm font-mono placeholder-zinc-700"
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="AIzaSy..."
                />
                <p className="text-[10px] text-zinc-500 mt-2">
                  您的密钥仅存储在本地浏览器的 LocalStorage 中，不会发送到任何服务器（除 Google API）。
                </p>
              </div>

              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 text-xs text-banana-400 hover:text-banana-300 transition-colors w-fit"
              >
                获取 API Key <ExternalLink size={10} />
              </a>

              <div className="pt-4 flex gap-3">
                 <button 
                   onClick={() => setIsKeyModalOpen(false)}
                   className="flex-1 py-2 text-sm text-zinc-400 hover:text-zinc-200"
                 >
                   取消
                 </button>
                 <button 
                   onClick={handleSaveKey}
                   className="flex-1 py-2 text-sm bg-banana-500 hover:bg-banana-400 text-zinc-950 font-bold rounded-lg"
                 >
                   保存配置
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};