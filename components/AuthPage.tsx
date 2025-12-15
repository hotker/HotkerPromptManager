import React, { useState } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { ArrowRight, Loader2, AlertCircle, Globe, Cloud } from 'lucide-react';
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
      subtitle: 'Enterprise Prompt Engineering',
      loginTab: '登录',
      registerTab: '注册',
      usernamePlaceholder: '用户名',
      passwordPlaceholder: '密码',
      enterBtn: '进入控制台',
      createBtn: '创建账户',
      googleBtn: '使用 Google 继续',
      defaultError: '认证失败',
      googleError: 'Google 登录失败',
    },
    en: {
      subtitle: 'Enterprise Prompt Engineering',
      loginTab: 'Log in',
      registerTab: 'Sign up',
      usernamePlaceholder: 'Username',
      passwordPlaceholder: 'Password',
      enterBtn: 'Log in',
      createBtn: 'Sign up',
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
    <div className="min-h-screen w-full bg-[#0e0e10] flex flex-col items-center justify-center p-4">
      {/* Subtle Background Pattern */}
      <div className="fixed inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5"></div>
      
      {/* Main Container */}
      <div className="w-full max-w-[420px] relative z-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Cloud size={64} className="text-banana-500" fill="currentColor" />
          </div>
          <h1 className="text-3xl font-semibold text-white mb-2">Hotker Studio</h1>
          <p className="text-zinc-500 text-sm">{text.subtitle}</p>
        </div>

        {/* Card */}
        <div className="bg-[#18181b] border border-white/5 rounded-lg shadow-xl p-8">
           
           {/* Toggle */}
           <div className="flex border-b border-white/10 mb-6">
              <button 
                onClick={() => setMode('login')} 
                className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 ${mode === 'login' ? 'border-banana-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
              >
                {text.loginTab}
              </button>
              <button 
                onClick={() => setMode('register')} 
                className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 ${mode === 'register' ? 'border-banana-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
              >
                {text.registerTab}
              </button>
           </div>

           {error && (
            <div className="mb-6 bg-red-500/10 border-l-2 border-red-500 p-3 flex items-start gap-3">
               <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
               <p className="text-red-400 text-xs leading-relaxed">{error}</p>
            </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">{text.usernamePlaceholder}</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#0e0e10] border border-zinc-700 rounded-md px-3 py-2 text-white focus:border-banana-500 focus:ring-1 focus:ring-banana-500 outline-none transition-all text-sm"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">{text.passwordPlaceholder}</label>
                <input
                  type="password"
                  required
                  className="w-full bg-[#0e0e10] border border-zinc-700 rounded-md px-3 py-2 text-white focus:border-banana-500 focus:ring-1 focus:ring-banana-500 outline-none transition-all text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-banana-500 hover:bg-banana-600 text-white font-medium py-2.5 rounded-md transition-all flex items-center justify-center gap-2 mt-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="animate-spin" size={16} /> : (
                  <>
                    {mode === 'login' ? text.enterBtn : text.createBtn}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
           </form>

           <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
              <div className="relative flex justify-center text-xs text-zinc-500"><span className="bg-[#18181b] px-2">OR</span></div>
           </div>

           <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-white text-black hover:bg-zinc-200 font-medium py-2.5 rounded-md transition-all flex items-center justify-center gap-3 text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              {text.googleBtn}
            </button>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-center gap-6">
            <button onClick={() => setLang(l => l === 'zh' ? 'en' : 'zh')} className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors flex items-center gap-1.5">
               <Globe size={12} /> {lang === 'zh' ? 'English' : '中文'}
            </button>
            <a href={AUTHOR_INFO.website} target="_blank" className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors">
              Help
            </a>
            <a href={AUTHOR_INFO.website} target="_blank" className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors">
              Terms
            </a>
        </div>
      </div>
    </div>
  );
};