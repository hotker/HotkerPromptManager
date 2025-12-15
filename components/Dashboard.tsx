import React, { useRef, useState, useEffect } from 'react';
import { PromptModule, PromptTemplate, RunLog, User } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Zap, Layers, FileCode2, Download, Upload, Database, AlertTriangle, CheckCircle2, Activity } from 'lucide-react';
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
    // Commercial-grade health check pattern
    const checkSystemHealth = async () => {
      try {
        // First try the dedicated health endpoint
        const healthRes = await fetch('/api/health');
        if (healthRes.ok) {
           const healthData: any = await healthRes.json();
           if (healthData.services?.database === 'connected') {
             setDbStatus('connected');
             return;
           } else {
             setDbStatus('disconnected');
             return;
           }
        }
        
        // Fallback: Check data endpoint if health check fails/doesn't exist yet
        const dataRes = await fetch(`/api/data?userId=${currentUser.id}`);
        if (dataRes.status === 503) {
           setDbStatus('disconnected');
        } else {
           setDbStatus('connected'); 
        }
      } catch (e) {
        console.warn("Health check failed:", e);
        setDbStatus('disconnected');
      }
    };
    
    checkSystemHealth();
  }, [currentUser.id]);

  const successRate = logs.length > 0 
    ? Math.round((logs.filter(l => l.status === 'success').length / logs.length) * 100) 
    : 0;

  // Chart Data Preparation
  const statusData = [
    { name: t.dashboard.success, value: logs.filter(l => l.status === 'success').length },
    { name: t.dashboard.failure, value: logs.filter(l => l.status === 'failure').length },
  ];
  const COLORS = ['#22c55e', '#ef4444'];

  const activityData = logs.slice(0, 20).map((l, i) => ({
    name: i.toString(),
    duration: l.durationMs
  }));

  // --- Backup Functions ---
  const handleExport = () => {
    const backupData = {
      version: 1,
      timestamp: Date.now(),
      user: currentUser, // Include User Profile
      data: {
        modules,
        templates,
        logs
      }
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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonStr = event.target?.result as string;
        const parsed = JSON.parse(jsonStr);

        // Basic validation
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
        console.error(err);
        alert("Failed to read file.");
      } finally {
        // Reset input so same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-zinc-950">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-100 mb-2">{t.dashboard.welcome}, {currentUser.username}</h2>
          <div className="flex flex-wrap items-center gap-4 text-sm">
             <div className="flex items-center gap-1.5 text-zinc-500 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                <Activity size={12} className="text-green-500" />
                <span>{t.dashboard.systemOnline}</span>
             </div>

             {dbStatus === 'connected' ? (
                <div className="flex items-center gap-1.5 text-green-500 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                    <Database size={12}/>
                    <span>{t.dashboard.dbConnected}</span>
                </div>
             ) : (
                <div className="flex items-center gap-1.5 text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20 animate-pulse" title="KV 绑定未配置">
                    <AlertTriangle size={12}/>
                    <span>{t.dashboard.dbDisconnected}</span>
                </div>
             )}
          </div>
        </div>
      </div>

      {dbStatus === 'disconnected' && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
           <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={20} />
           <div>
             <h4 className="font-bold text-red-400">{t.dashboard.dbErrorTitle}</h4>
             <p className="text-sm text-red-400/80 mt-1">
               {t.dashboard.dbErrorDesc}
             </p>
           </div>
        </div>
      )}

      {/* Data Management Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
           <Database className="text-banana-500" size={24} />
           <h3 className="text-lg font-bold text-zinc-200">{t.dashboard.backupTitle}</h3>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
           <div className="flex-1">
             <p className="text-sm text-zinc-400 mb-4">
               {t.dashboard.backupDesc}
             </p>
             <div className="flex flex-wrap gap-4">
                <button 
                  onClick={handleExport}
                  className="flex items-center gap-2 bg-banana-500 hover:bg-banana-400 text-zinc-950 px-4 py-2 rounded-lg font-bold transition-colors shadow-lg shadow-banana-500/20 text-sm"
                >
                  <Download size={16} /> {t.dashboard.exportBtn}
                </button>
                <button 
                  onClick={handleImportClick}
                  className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg font-medium transition-colors border border-zinc-700 hover:border-zinc-600 text-sm"
                >
                  <Upload size={16} /> {t.dashboard.importBtn}
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept=".json"
                />
             </div>
           </div>
           <div className="flex-1 bg-zinc-950/50 rounded-lg p-4 border border-zinc-800 flex items-start gap-3">
             <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
             <div>
               <h4 className="text-sm font-bold text-amber-500 mb-1">{t.dashboard.importWarningTitle}</h4>
               <p className="text-xs text-zinc-500 leading-relaxed">
                 {t.dashboard.importWarningDesc}
               </p>
             </div>
           </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors">
          <div className="flex justify-between items-center mb-4">
             <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500"><Layers size={24} /></div>
             <span className="text-2xl font-bold text-zinc-100">{modules.length}</span>
          </div>
          <h3 className="text-zinc-400 font-medium">{t.dashboard.statsModules}</h3>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors">
          <div className="flex justify-between items-center mb-4">
             <div className="p-3 bg-banana-500/10 rounded-lg text-banana-500"><FileCode2 size={24} /></div>
             <span className="text-2xl font-bold text-zinc-100">{templates.length}</span>
          </div>
          <h3 className="text-zinc-400 font-medium">{t.dashboard.statsTemplates}</h3>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors">
          <div className="flex justify-between items-center mb-4">
             <div className="p-3 bg-purple-500/10 rounded-lg text-purple-500"><Zap size={24} /></div>
             <span className="text-2xl font-bold text-zinc-100">{successRate}%</span>
          </div>
          <h3 className="text-zinc-400 font-medium">{t.dashboard.statsSuccess}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
        {/* Activity Chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-64 md:h-80">
          <h3 className="text-lg font-bold text-zinc-200 mb-4">{t.dashboard.chartLatency}</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activityData}>
              <XAxis dataKey="name" hide />
              <YAxis stroke="#52525b" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                itemStyle={{ color: '#fbbf24' }}
              />
              <Bar dataKey="duration" fill="#fbbf24" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Success/Fail Chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-64 md:h-80">
          <h3 className="text-lg font-bold text-zinc-200 mb-4">{t.dashboard.chartQuality}</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-12 py-6 border-t border-zinc-900 flex flex-col items-center justify-center text-zinc-600 text-sm gap-2">
          <div className="flex items-center gap-2">
            <span>Built by</span>
            <a href={AUTHOR_INFO.website} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-banana-400 font-medium transition-colors">{AUTHOR_INFO.name}</a>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <a href={AUTHOR_INFO.github} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">GitHub</a>
            <span className="text-zinc-800">•</span>
            <a href={AUTHOR_INFO.twitterUrl} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">X (Twitter)</a>
            <span className="text-zinc-800">•</span>
            <a href={`mailto:${AUTHOR_INFO.email}`} className="hover:text-zinc-300 transition-colors">Contact</a>
            <span className="text-zinc-800">•</span>
            <span className="opacity-50">v2.0</span>
          </div>
      </div>
    </div>
  );
};