import React, { useRef, useState, useEffect } from 'react';
import { PromptModule, PromptTemplate, RunLog, User } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Zap, Layers, FileCode2, Download, Upload, Database, AlertTriangle, Activity, Server, Cpu } from 'lucide-react';
import { Language, translations } from '../translations';
import { AUTHOR_INFO } from '../constants';

interface DashboardProps {
  modules: PromptModule[];
  templates: PromptTemplate[];
  logs: RunLog[];
  setModules: React.Dispatch<React.SetStateAction<PromptModule[]>>;
  setTemplates: React.Dispatch<React.SetStateAction<PromptTemplate[]>>;
  setLogs: React.Dispatch<React.SetStateAction<RunLog[]>>;
  currentUser: User;
  lang: Language;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  modules, 
  templates, 
  logs,
  setModules,
  setTemplates,
  setLogs,
  currentUser,
  lang
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const t = translations[lang];

  useEffect(() => {
    const checkSystemHealth = async () => {
      try {
        const healthRes = await fetch('/api/health');
        if (healthRes.ok) {
           const healthData: any = await healthRes.json();
           setDbStatus(healthData.services?.database === 'connected' ? 'connected' : 'disconnected');
        } else {
           const dataRes = await fetch(`/api/data?userId=${currentUser.id}`);
           setDbStatus(dataRes.status === 503 ? 'disconnected' : 'connected');
        }
      } catch (e) {
        setDbStatus('disconnected');
      }
    };
    checkSystemHealth();
  }, [currentUser.id]);

  const successRate = logs.length > 0 
    ? Math.round((logs.filter(l => l.status === 'success').length / logs.length) * 100) 
    : 0;

  const statusData = [
    { name: t.dashboard.success, value: logs.filter(l => l.status === 'success').length },
    { name: t.dashboard.failure, value: logs.filter(l => l.status === 'failure').length },
  ];
  const COLORS = ['#10b981', '#ef4444'];

  const activityData = logs.slice(0, 20).map((l, i) => ({
    name: i.toString(),
    duration: l.durationMs
  }));

  const handleExport = () => {
    const backupData = {
      version: 1,
      timestamp: Date.now(),
      user: currentUser,
      data: { modules, templates, logs }
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hotker-prompt-backup-${currentUser.username}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonStr = event.target?.result as string;
        const parsed = JSON.parse(jsonStr);
        if (!parsed.data || !Array.isArray(parsed.data.modules)) {
          alert("Invalid backup format");
          return;
        }
        if (confirm(`${t.dashboard.importWarningDesc}`)) {
          setModules(parsed.data.modules);
          setTemplates(parsed.data.templates);
          setLogs(parsed.data.logs || []);
          alert(t.dashboard.success);
        }
      } catch (err) {
        alert("Failed to read file.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 md:p-10 h-full overflow-y-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500 mb-2 tracking-tight">{t.dashboard.welcome}, {currentUser.username}</h2>
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
             <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                <span>{t.dashboard.systemOnline}</span>
             </div>

             {dbStatus === 'connected' ? (
                <div className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/20">
                    <Database size={10}/>
                    <span>{t.dashboard.dbConnected}</span>
                </div>
             ) : (
                <div className="flex items-center gap-1.5 text-red-400 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20 animate-pulse">
                    <AlertTriangle size={10}/>
                    <span>{t.dashboard.dbDisconnected}</span>
                </div>
             )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { icon: <Layers size={20} />, label: t.dashboard.statsModules, value: modules.length, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { icon: <FileCode2 size={20} />, label: t.dashboard.statsTemplates, value: templates.length, color: 'text-banana-400', bg: 'bg-banana-500/10' },
          { icon: <Zap size={20} />, label: t.dashboard.statsSuccess, value: `${successRate}%`, color: 'text-purple-400', bg: 'bg-purple-500/10' }
        ].map((stat, i) => (
          <div key={i} className="glass-card rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              {stat.icon}
            </div>
            <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 border border-white/5`}>
               {stat.icon}
            </div>
            <div className="text-3xl font-bold text-white mb-1 tracking-tight">{stat.value}</div>
            <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Main Chart */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-2">
                <Activity size={16} className="text-banana-400" />
                <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">{t.dashboard.chartLatency}</h3>
             </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <XAxis dataKey="name" hide />
                <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fff', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                  itemStyle={{ color: '#fbbf24', fontSize: '12px' }}
                />
                <Bar dataKey="duration" fill="#fbbf24" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart & Backup */}
        <div className="flex flex-col gap-6">
           <div className="glass-panel rounded-2xl p-6 flex-1 min-h-[200px]">
              <div className="flex items-center gap-2 mb-4">
                 <Cpu size={16} className="text-emerald-400" />
                 <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">{t.dashboard.chartQuality}</h3>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* Backup Mini Panel */}
           <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                 <Server size={16} className="text-zinc-400" />
                 <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">{t.dashboard.backupTitle}</h3>
              </div>
              <div className="flex gap-2">
                 <button onClick={handleExport} className="flex-1 py-2 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors border border-white/5 flex items-center justify-center gap-1">
                   <Download size={12}/> {t.dashboard.exportBtn}
                 </button>
                 <button onClick={handleImportClick} className="flex-1 py-2 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors border border-white/5 flex items-center justify-center gap-1">
                   <Upload size={12}/> {t.dashboard.importBtn}
                 </button>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json"/>
           </div>
        </div>
      </div>

      <div className="py-6 border-t border-white/5 text-center">
          <p className="text-[10px] text-zinc-600 font-mono">
            {AUTHOR_INFO.name} <span className="mx-2">|</span> v2.0.0
          </p>
      </div>
    </div>
  );
};