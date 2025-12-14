import React from 'react';
import { LayoutGrid, Library, TestTube2, History, banana } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const navItems: { id: ViewState; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: '仪表盘', icon: <LayoutGrid size={20} /> },
    { id: 'library', label: '模块库', icon: <Library size={20} /> },
    { id: 'builder', label: '提示词构建', icon: <TestTube2 size={20} /> },
    { id: 'history', label: '运行历史', icon: <History size={20} /> },
  ];

  return (
    <div className="w-64 bg-zinc-900 h-full border-r border-zinc-800 flex flex-col">
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

      <div className="p-4 border-t border-zinc-800">
        <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-800">
          <p className="text-xs text-zinc-500 mb-1">API 状态</p>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${process.env.API_KEY ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs font-mono text-zinc-300">{process.env.API_KEY ? '已连接' : '缺少密钥'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};