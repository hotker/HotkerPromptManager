import React, { useState } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { ArrowRight, Loader2, AlertCircle, Globe, Hexagon, ShieldCheck, Cpu } from 'lucide-react';
import { AUTHOR_INFO } from '../constants';
import { Language, translations } from '../translations';

interface AuthPageProps {
  onLogin: (user: User) => void;
  lang: Language;
  setLang: (l: Language) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin, lang, setLang }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const t = translations[lang].auth;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      let user;
      if (mode === 'login') {
        user = await authService.login(username, password);
      } else {
        user = await authService.register(username, password);
      }
      onLogin(user);
    } catch (err: any) {
      setError(err.message || t.defaultError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const user = await authService.loginWithGoogle();
      onLogin(user);
    } catch (err: any) {
      setError(t.googleError);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-mono">
      {/* Sci-fi Background Elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-cyber-primary/50 shadow-[0_0_20px_#22d3ee]"></div>
      <div className="absolute bottom-0 right-0 w-full h-1 bg-cyber-primary/50 shadow-[0_0_20px_#22d3ee]"></div>
      
      {/* Animated Orb */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyber-primary/10 rounded-full blur-[100px] animate-pulse-glow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyber-secondary/10 rounded-full blur-[80px] animate-pulse-glow" style={{animationDelay: '1s'}}></div>

      {/* Main Container - HUD Style */}
      <div className="w-full max-w-[450px] relative z-10 bg-slate-900/80 backdrop-blur-xl border border-white/10 p-10 rounded-xl shadow-2xl clip-tech">
        
        {/* Header */}
        <div className="text-center mb-10 relative">
          <div className="flex justify-center mb-4">
            <div className="relative">
               <Hexagon size={64} className="text-cyber-primary animate-spin-slow" strokeWidth={1} />
               <Cpu size={32} className="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tighter text-glow">HOTKER<span className="text-cyber-primary">.SYS</span></h1>
          <p className="text-cyber-primary/60 text-xs tracking-[0.3em] uppercase">{t.subtitle}</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex mb-8 border-b border-white/10 relative">
           <div className={`absolute bottom-0 h-0.5 bg-cyber-primary transition-all duration-300 ${mode === 'login' ? 'left-0 w-1/2' : 'left-1/2 w-1/2'}`}></div>
           <button 
             onClick={() => setMode('login')} 
             className={`flex-1 pb-3 text-xs font-bold tracking-widest transition-colors ${mode === 'login' ? 'text-cyber-primary text-glow' : 'text-slate-500 hover:text-slate-300'}`}
           >
             {t.loginTab}
           </button>
           <button 
             onClick={() => setMode('register')} 
             className={`flex-1 pb-3 text-xs font-bold tracking-widest transition-colors ${mode === 'register' ? 'text-cyber-primary text-glow' : 'text-slate-500 hover:text-slate-300'}`}
           >
             {t.registerTab}
           </button>
        </div>

        {error && (
         <div className="mb-6 bg-red-500/10 border border-red-500/50 p-3 flex items-center gap-3 text-red-400 animate-pulse">
            <AlertCircle size={16} />
            <span className="text-xs font-bold tracking-wide">{error}</span>
         </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
           <div className="relative group">
             <input
               type="text"
               required
               className="w-full bg-slate-950/50 border-b border-white/20 text-white placeholder-transparent focus:border-cyber-primary outline-none transition-all duration-300 px-4 py-3 rounded-none text-base md:text-sm"
               value={username}
               onChange={(e) => setUsername(e.target.value)}
               placeholder=" "
             />
             <label className={`absolute left-4 top-3 text-xs text-slate-500 pointer-events-none transition-all duration-300 ${username ? '-top-5 text-cyber-primary text-[10px]' : ''}`}>
               {t.usernamePlaceholder}
             </label>
             {/* Corner markers for input */}
             <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyber-primary/30"></div>
             <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyber-primary/30"></div>
           </div>

           <div className="relative group">
             <input
               type="password"
               required
               className="w-full bg-slate-950/50 border-b border-white/20 text-white placeholder-transparent focus:border-cyber-primary outline-none transition-all duration-300 px-4 py-3 rounded-none text-base md:text-sm"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               placeholder=" "
             />
             <label className={`absolute left-4 top-3 text-xs text-slate-500 pointer-events-none transition-all duration-300 ${password ? '-top-5 text-cyber-primary text-[10px]' : ''}`}>
               {t.passwordPlaceholder}
             </label>
             <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyber-primary/30"></div>
             <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyber-primary/30"></div>
           </div>

           <button
             type="submit"
             disabled={isLoading}
             className="w-full btn-tech py-3 flex items-center justify-center gap-2 group relative overflow-hidden"
           >
             {isLoading ? <Loader2 className="animate-spin" size={16} /> : (
               <>
                 <span className="relative z-10 group-hover:tracking-[0.2em] transition-all">{mode === 'login' ? t.enterBtn : t.createBtn}</span>
                 <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
               </>
             )}
             <div className="absolute inset-0 bg-cyber-primary/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
           </button>
        </form>

        <div className="relative my-8">
           <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
           <div className="relative flex justify-center text-[10px] tracking-widest text-slate-500"><span className="bg-slate-900 px-2">{t.systemOverride}</span></div>
        </div>

        <button
           type="button"
           onClick={handleGoogleLogin}
           disabled={isLoading}
           className="w-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 text-slate-300 text-xs font-bold py-3 tracking-wide transition-all flex items-center justify-center gap-3 clip-tech"
         >
           <ShieldCheck size={14} className="text-cyber-secondary" />
           {t.googleBtn}
         </button>

        {/* Footer */}
        <div className="mt-8 flex justify-between items-center pt-4 border-t border-white/5">
            <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} className="text-slate-500 hover:text-cyber-primary text-xs transition-colors flex items-center gap-2 font-bold tracking-widest">
               <Globe size={12} /> {lang === 'zh' ? 'EN' : '中文'}
            </button>
            <div className="flex gap-4">
              <a href={AUTHOR_INFO.website} target="_blank" className="text-slate-500 hover:text-cyber-primary text-[10px] transition-colors tracking-widest">{t.help}</a>
            </div>
        </div>
      </div>
    </div>
  );
};