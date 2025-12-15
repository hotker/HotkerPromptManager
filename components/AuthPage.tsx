import React, { useState } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { ArrowRight, Loader2, AlertCircle, Globe, Sparkles } from 'lucide-react';
import { AUTHOR_INFO } from '../constants';

interface AuthPageProps {
  onLogin: (user: User) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const t = {
    zh: {
      subtitle: 'Prompt Engineering System',
      loginTab: '登录',
      registerTab: '注册',
      usernamePlaceholder: '用户名',
      passwordPlaceholder: '密码',
      enterBtn: '启动系统',
      createBtn: '创建身份',
      googleBtn: 'Google 快速通行',
      defaultError: '认证失败',
      googleError: 'Google 登录失败',
    },
    en: {
      subtitle: 'Prompt Engineering System',
      loginTab: 'Login',
      registerTab: 'Register',
      usernamePlaceholder: 'Username',
      passwordPlaceholder: 'Password',
      enterBtn: 'Launch System',
      createBtn: 'Create Identity',
      googleBtn: 'Continue with Google',
      defaultError: 'Authentication failed',
      googleError: 'Google login failed',
    }
  };

  const text = t[lang];

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
      setError(err.message || text.defaultError);
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
      setError(text.googleError);
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full w-full bg-black relative flex items-center justify-center overflow-hidden">
      {/* Abstract Background */}
      <div className="absolute inset-0">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-banana-500/10 blur-[120px] rounded-full mix-blend-screen opacity-40"></div>
         <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-indigo-900/20 blur-[100px] rounded-full mix-blend-screen"></div>
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
      </div>

      <div className="relative z-10 w-full max-w-[400px] p-4">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-6 relative">
             <div className="absolute inset-0 bg-banana-400 blur-xl opacity-20 animate-pulse"></div>
             <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-zinc-800 to-black border border-white/10 flex items-center justify-center shadow-2xl relative z-10">
               <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-banana-300 to-banana-600">H</span>
             </div>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tighter mb-2">Hotker Studio</h1>
          <p className="text-zinc-500 font-mono text-xs uppercase tracking-[0.2em]">{text.subtitle}</p>
        </div>

        {/* Glass Card */}
        <div className="glass-panel rounded-3xl p-1 shadow-2xl backdrop-blur-xl bg-black/40">
           
           <div className="bg-black/40 rounded-[20px] p-6 border border-white/5">
              {/* Toggle */}
              <div className="flex bg-zinc-900/50 p-1 rounded-xl mb-6 relative">
                <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-zinc-800 rounded-lg shadow transition-all duration-300 ${mode === 'login' ? 'left-1' : 'left-[calc(50%+4px)]'}`}></div>
                <button onClick={() => setMode('login')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider relative z-10 transition-colors ${mode === 'login' ? 'text-white' : 'text-zinc-500'}`}>{text.loginTab}</button>
                <button onClick={() => setMode('register')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider relative z-10 transition-colors ${mode === 'register' ? 'text-white' : 'text-zinc-500'}`}>{text.registerTab}</button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-xs">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4">
                   <input
                    type="text"
                    required
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-3.5 text-zinc-200 focus:border-banana-500/30 focus:bg-zinc-900/80 outline-none transition-all placeholder-zinc-600 text-sm"
                    placeholder={text.usernamePlaceholder}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <input
                    type="password"
                    required
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-3.5 text-zinc-200 focus:border-banana-500/30 focus:bg-zinc-900/80 outline-none transition-all placeholder-zinc-600 text-sm"
                    placeholder={text.passwordPlaceholder}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-zinc-100 hover:bg-white text-black font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : (
                    <>
                      {mode === 'login' ? text.enterBtn : text.createBtn}
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                    </>
                  )}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold text-zinc-600"><span className="bg-black px-2">OR</span></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300 font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-3 text-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                {text.googleBtn}
              </button>
           </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-between items-center px-2">
            <button onClick={() => setLang(l => l === 'zh' ? 'en' : 'zh')} className="text-zinc-600 hover:text-white flex items-center gap-1.5 text-xs transition-colors">
               <Globe size={12} /> {lang === 'zh' ? 'English' : '中文'}
            </button>
            <div className="text-[10px] text-zinc-600 font-mono">
               V2.0.0
            </div>
        </div>
      </div>
    </div>
  );
};