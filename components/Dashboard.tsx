import React, { useRef, useState, useEffect } from 'react';
import { PromptModule, PromptTemplate, RunLog, User } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Zap, Layers, FileCode2, Download, Upload, Database, AlertCircle, Activity, Server, Cpu } from 'lucide-react';
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
  const COLORS = ['#3b82f6', '#ef4444']; // Blue 500, Red 500

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
    a.download = `hotker-backup-${new Date().toISOString().slice(0, 10)}.json`;
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
          alert(t.dashboard.invalidBackup);
          return;
        }
        if (confirm(`${t.dashboard.importWarningDesc}`)) {
          setModules(parsed.data.modules);
          setTemplates(parsed.data.templates);
          setLogs(parsed.data.logs || []);
          alert(t.dashboard.success);
        }
      } catch (err) {
        alert(t.dashboard.readError);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 md:p-10 h-full overflow-y-auto custom-scrollbar pb-32 md:pb-10 bg-slate-50">
      
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
           {t.dashboard.welcome}
        </h2>
        <div className="flex flex-wrap items-center gap-3 text-xs mt-2">
           <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {t.dashboard.systemOnline}
           </span>

           {dbStatus === 'connected' ? (
              <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-medium flex items-center gap-1.5">
                  <Database size={10}/>
                  {t.dashboard.dbConnected}
              </span>
           ) : (
              <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-medium flex items-center gap-1.5">
                  <AlertCircle size={10}/>
                  {t.dashboard.dbDisconnected}
              </span>
           )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { icon: <Layers size={20} />, label: t.dashboard.statsModules, value: modules.length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { icon: <FileCode2 size={20} />, label: t.dashboard.statsTemplates, value: templates.length, color: 'text-purple-600', bg: 'bg-purple-50' },
          { icon: <Zap size={20} />, label: t.dashboard.statsSuccess, value: `${successRate}%`, color: 'text-emerald-600', bg: 'bg-emerald-50' }
        ].map((stat, i) => (
          <div key={i} className="prod-card p-6 flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} shrink-0`}>
               {stat.icon}
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none mb-1">{stat.value}</div>
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Main Chart */}
        <div className="lg:col-span-2 prod-card p-6">
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-2">
                <Activity size={18} className="text-slate-400" />
                <h3 className="text-sm font-bold text-slate-700">{t.dashboard.chartLatency}</h3>
             </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <XAxis dataKey="name" hide />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="duration" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart & Backup */}
        <div className="flex flex-col gap-6">
           <div className="prod-card p-6 flex-1 min-h-[200px]">
              <div className="flex items-center gap-2 mb-4">
                 <Cpu size={18} className="text-slate-400" />
                 <h3 className="text-sm font-bold text-slate-700">{t.dashboard.chartQuality}</h3>
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
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '8px' }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* Backup Mini Panel */}
           <div className="bg-slate-100 border border-slate-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                 <Server size={18} className="text-slate-500" />
                 <h3 className="text-sm font-bold text-slate-700">{t.dashboard.backupTitle}</h3>
              </div>
              <div className="flex gap-2">
                 <button onClick={handleExport} className="btn-secondary flex-1 text-xs py-2">
                   <Download size={12}/> {t.dashboard.exportBtn}
                 </button>
                 <button onClick={handleImportClick} className="btn-secondary flex-1 text-xs py-2">
                   <Upload size={12}/> {t.dashboard.importBtn}
                 </button>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json"/>
           </div>
        </div>
      </div>

      <div className="py-8 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-400 font-medium">
             {t.dashboard.engineVersion} 2.1.0 • {AUTHOR_INFO.name}
          </p>
      </div>
    </div>
  );
};