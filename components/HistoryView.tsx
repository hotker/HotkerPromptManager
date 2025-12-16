import React from 'react';
import { RunLog } from '../types';
import { ThumbsUp, ThumbsDown, Clock, Terminal } from 'lucide-react';
import { Language, translations } from '../translations';

interface HistoryViewProps {
  logs: RunLog[];
  updateLog: (id: string, updates: Partial<RunLog>) => void;
  lang: Language;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ logs, updateLog, lang }) => {
  const t = translations[lang];
  const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);

  const handleRate = (id: string, status: 'success' | 'failure') => {
    updateLog(id, { status });
  };

  return (
    <div className="h-full p-6 md:p-8 bg-slate-50 overflow-y-auto md:rounded-tl-xl md:border-l md:border-t md:border-slate-200">
      <div className="max-w-3xl mx-auto pb-20">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight">{t.history.title}</h2>
        
        {sortedLogs.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200 shadow-sm">
             <p className="text-slate-400 text-sm">{t.history.noHistory}</p>
          </div>
        )}
        
        <div className="space-y-6 relative">
          {sortedLogs.length > 0 && <div className="absolute top-4 bottom-4 left-6 w-px bg-slate-200 -z-10"></div>}
          
          {sortedLogs.map(log => (
            <div key={log.id} className="relative pl-14">
               {/* Timeline Dot */}
               <div className={`absolute left-4 top-4 w-4 h-4 rounded-full border-2 border-white shadow-sm -translate-x-1/2 ${log.status === 'success' ? 'bg-emerald-500' : (log.status === 'failure' ? 'bg-red-500' : 'bg-slate-300')}`}></div>

               <div className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{log.templateName}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1"><Clock size={12}/> {new Date(log.timestamp).toLocaleString()}</span>
                        <span className="flex items-center gap-1 bg-slate-100 px-1.5 rounded"><Terminal size={12}/> {log.durationMs}ms</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleRate(log.id, 'success')}
                        className={`p-1.5 rounded transition-colors ${log.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-300 hover:text-emerald-500 hover:bg-slate-50'}`}
                      >
                        <ThumbsUp size={16} />
                      </button>
                      <button 
                        onClick={() => handleRate(log.id, 'failure')}
                        className={`p-1.5 rounded transition-colors ${log.status === 'failure' ? 'bg-red-50 text-red-600' : 'text-slate-300 hover:text-red-500 hover:bg-slate-50'}`}
                      >
                        <ThumbsDown size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 text-xs font-mono">
                    <div className="space-y-1">
                      <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">{t.history.sentPrompt}</p>
                      <div className="bg-slate-50 p-3 rounded border border-slate-100 text-slate-600 overflow-hidden max-h-32 hover:overflow-y-auto custom-scrollbar">
                         {log.finalPrompt}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">{t.history.result}</p>
                      <div className="bg-slate-50 p-3 rounded border border-slate-100 text-slate-800 overflow-hidden max-h-48 hover:overflow-y-auto custom-scrollbar">
                        {log.output.startsWith('[IMAGE') ? <span className="text-blue-500 font-bold">(IMAGE GENERATED)</span> : log.output}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <input 
                       className="w-full text-sm text-slate-600 placeholder-slate-400 outline-none bg-transparent"
                       placeholder={t.history.notesPlaceholder}
                       value={log.notes || ''}
                       onChange={(e) => updateLog(log.id, { notes: e.target.value })}
                    />
                  </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};