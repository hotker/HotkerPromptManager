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
  // Updated colors: Neon Green & Glitch Red
  const COLORS = ['#00ff9d', '#ff2a6d'];

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
    <div className="p-6 md:p-10 h-full overflow-y-auto font-mono">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tighter text-glow uppercase">
             CMD: {t.dashboard.welcome}, <span className="text-cyber-primary">{currentUser.username}</span>
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-xs">
             <div className="flex items-center gap-1.5 text-green-400 bg-green-900/20 px-2 py-1 border border-green-500/30">
                <div className="w-1.5 h-1.5 rounded-none bg-green-400 animate-pulse"></div>
                <span className="tracking-wider">SYS_ONLINE</span>
             </div>

             {dbStatus === 'connected' ? (
                <div className="flex items-center gap-1.5 text-blue-400 bg-blue-900/20 px-2 py-1 border border-blue-500/30">
                    <Database size={10}/>
                    <span className="tracking-wider">DB_LINK_ACTIVE</span>
                </div>
             ) : (
                <div className="flex items-center gap-1.5 text-red-400 bg-red-900/20 px-2 py-1 border border-red-500/30 animate-pulse">
                    <AlertTriangle size={10}/>
                    <span className="tracking-wider">DB_LINK_SEVERED</span>
                </div>
             )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { icon: <Layers size={20} />, label: t.dashboard.statsModules, value: modules.length, color: 'text-cyber-primary', bg: 'bg-cyber-primary/10', border: 'border-cyber-primary/30' },
          { icon: <FileCode2 size={20} />, label: t.dashboard.statsTemplates, value: templates.length, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
          { icon: <Zap size={20} />, label: t.dashboard.statsSuccess, value: `${successRate}%`, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' }
        ].map((stat, i) => (
          <div key={i} className={`hud-panel p-6 relative overflow-hidden group ${stat.border}`}>
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              {stat.icon}
            </div>
            <div className={`w-10 h-10 ${stat.bg} ${stat.color} flex items-center justify-center mb-4 border border-white/5`}>
               {stat.icon}
            </div>
            <div className="text-3xl font-bold text-white mb-1 tracking-tight text-shadow">{stat.value}</div>
            <div className="text-xs text-gray-400 font-bold uppercase tracking-widest">{stat.label}</div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/20"></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Main Chart */}
        <div className="lg:col-span-2 hud-panel p-6 rounded-lg">
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-2">
                <Activity size={16} className="text-cyber-primary" />
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">{t.dashboard.chartLatency}</h3>
             </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <XAxis dataKey="name" hide />
                <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: 'rgba(0, 240, 255, 0.05)'}}
                  contentStyle={{ backgroundColor: '#0a0f16', borderColor: '#00f0ff', color: '#fff', fontFamily: 'monospace' }}
                  itemStyle={{ color: '#00f0ff', fontSize: '12px' }}
                />
                <Bar dataKey="duration" fill="#00f0ff" barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart & Backup */}
        <div className="flex flex-col gap-6">
           <div className="hud-panel p-6 flex-1 min-h-[200px] rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                 <Cpu size={16} className="text-green-400" />
                 <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">{t.dashboard.chartQuality}</h3>
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
                    <Tooltip contentStyle={{ backgroundColor: '#0a0f16', borderColor: '#333', color: '#fff', fontSize: '12px', fontFamily: 'monospace' }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* Backup Mini Panel */}
           <div className="hud-panel p-6 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                 <Server size={16} className="text-gray-400" />
                 <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">{t.dashboard.backupTitle}</h3>
              </div>
              <div className="flex gap-2">
                 <button onClick={handleExport} className="flex-1 py-3 text-[10px] font-bold bg-white/5 hover:bg-white/10 text-gray-200 border border-white/5 flex items-center justify-center gap-1 tracking-wider uppercase hover:border-cyber-primary/30 transition-all">
                   <Download size={12}/> EXPORT
                 </button>
                 <button onClick={handleImportClick} className="flex-1 py-3 text-[10px] font-bold bg-white/5 hover:bg-white/10 text-gray-200 border border-white/5 flex items-center justify-center gap-1 tracking-wider uppercase hover:border-cyber-primary/30 transition-all">
                   <Upload size={12}/> IMPORT
                 </button>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json"/>
           </div>
        </div>
      </div>

      <div className="py-6 border-t border-white/5 text-center">
          <p className="text-[10px] text-gray-600 font-mono tracking-widest">
             SYS_KERNEL v2.0.5 | {AUTHOR_INFO.name.toUpperCase()}
          </p>
      </div>
    </div>
  );
};