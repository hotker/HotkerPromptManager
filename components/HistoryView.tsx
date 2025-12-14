import React from 'react';
import { RunLog } from '../types';
import { ThumbsUp, ThumbsDown, Clock, Terminal } from 'lucide-react';

interface HistoryViewProps {
  logs: RunLog[];
  updateLog: (id: string, updates: Partial<RunLog>) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ logs, updateLog }) => {
  const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);

  const handleRate = (id: string, status: 'success' | 'failure') => {
    updateLog(id, { status });
  };

  return (
    <div className="h-full p-6 bg-zinc-950 overflow-y-auto">
      <h2 className="text-2xl font-bold text-zinc-100 mb-6">运行历史与回顾</h2>
      
      <div className="space-y-4 max-w-4xl mx-auto">
        {sortedLogs.length === 0 && <p className="text-zinc-500 text-center">暂无历史记录。</p>}
        
        {sortedLogs.map(log => (
          <div key={log.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-banana-400">{log.templateName}</h3>
                <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                  <span className="flex items-center gap-1"><Clock size={12}/> {new Date(log.timestamp).toLocaleString('zh-CN')}</span>
                  <span className="flex items-center gap-1"><Terminal size={12}/> {log.durationMs}ms</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => handleRate(log.id, 'success')}
                  className={`p-2 rounded-lg transition-colors ${log.status === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-500 hover:text-green-400'}`}
                >
                  <ThumbsUp size={16} />
                </button>
                <button 
                  onClick={() => handleRate(log.id, 'failure')}
                  className={`p-2 rounded-lg transition-colors ${log.status === 'failure' ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-500 hover:text-red-400'}`}
                >
                  <ThumbsDown size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm font-mono">
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                <p className="text-zinc-500 text-xs uppercase mb-2">发送的提示词</p>
                <div className="text-zinc-400 h-24 overflow-y-auto whitespace-pre-wrap text-xs">{log.finalPrompt}</div>
              </div>
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                <p className="text-zinc-500 text-xs uppercase mb-2">结果</p>
                <div className="text-zinc-300 h-24 overflow-y-auto whitespace-pre-wrap text-xs">
                   {log.output.startsWith('[IMAGE') ? '(图像内容)' : log.output}
                </div>
              </div>
            </div>
            
            <div className="mt-3">
              <input 
                 className="w-full bg-transparent border-b border-zinc-800 text-sm text-zinc-400 placeholder-zinc-700 focus:border-banana-500/50 outline-none py-1"
                 placeholder="在此添加回顾笔记..."
                 value={log.notes || ''}
                 onChange={(e) => updateLog(log.id, { notes: e.target.value })}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};