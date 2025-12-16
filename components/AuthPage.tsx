import React, { useState } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { ArrowRight, Loader2, AlertCircle, Globe, ShieldCheck, Command } from 'lucide-react';
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
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4">
      
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-8 md:p-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg">
               <Command size={32} strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hotker Prompt Studio</h1>
          <p className="text-slate-500 text-sm mt-2">{t.subtitle}</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-100 rounded-lg mb-8">
           <button 
             onClick={() => setMode('login')} 
             className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             {t.loginTab}
           </button>
           <button 
             onClick={() => setMode('register')} 
             className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             {t.registerTab}
           </button>
        </div>

        {error && (
         <div className="mb-6 bg-red-50 border border-red-100 p-3 rounded-lg flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle size={16} />
            <span>{error}</span>
         </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
           <div>
             <label className="block text-xs font-semibold text-slate-700 mb-1 ml-1">{t.usernamePlaceholder}</label>
             <input
               type="text"
               required
               className="prod-input py-2.5"
               value={username}
               onChange={(e) => setUsername(e.target.value)}
             />
           </div>

           <div>
             <label className="block text-xs font-semibold text-slate-700 mb-1 ml-1">{t.passwordPlaceholder}</label>
             <input
               type="password"
               required
               className="prod-input py-2.5"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
             />
           </div>

           <button
             type="submit"
             disabled={isLoading}
             className="w-full btn-primary py-2.5 mt-2"
           >
             {isLoading ? <Loader2 className="animate-spin" size={18} /> : (
               <>
                 <span>{mode === 'login' ? t.enterBtn : t.createBtn}</span>
                 <ArrowRight size={16} />
               </>
             )}
           </button>
        </form>

        <div className="my-6 flex items-center gap-3">
           <div className="flex-1 h-px bg-slate-200"></div>
           <span className="text-xs text-slate-400 font-medium">OR</span>
           <div className="flex-1 h-px bg-slate-200"></div>
        </div>

        <button
           type="button"
           onClick={handleGoogleLogin}
           disabled={isLoading}
           className="w-full btn-secondary py-2.5"
         >
           <ShieldCheck size={16} className="text-blue-600" />
           {t.googleBtn}
         </button>

        {/* Footer */}
        <div className="mt-8 flex justify-between items-center pt-6 border-t border-slate-100">
            <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} className="text-slate-400 hover:text-slate-700 text-xs font-medium flex items-center gap-2 transition-colors">
               <Globe size={14} /> {lang === 'zh' ? 'Switch to English' : '切换中文'}
            </button>
            <a href={AUTHOR_INFO.website} target="_blank" className="text-slate-400 hover:text-slate-700 text-xs font-medium transition-colors">{t.help}</a>
        </div>
      </div>
    </div>
  );
};