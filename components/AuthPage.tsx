import React, { useState } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { ArrowRight, Loader2, AlertCircle, Globe } from 'lucide-react';

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
      subtitle: '商业级提示词工程管理系统',
      loginTab: '登录',
      registerTab: '注册账户',
      usernameLabel: '用户名',
      passwordLabel: '密码',
      usernamePlaceholder: '请输入用户名',
      passwordPlaceholder: '请输入密码',
      enterBtn: '进入工作台',
      createBtn: '创建账户',
      orContinue: '或通过以下方式继续',
      googleBtn: 'Google 账户登录',
      defaultError: '认证失败',
      googleError: 'Google 登录模拟失败'
    },
    en: {
      subtitle: 'Enterprise Prompt Engineering System',
      loginTab: 'Sign In',
      registerTab: 'Register',
      usernameLabel: 'USERNAME',
      passwordLabel: 'PASSWORD',
      usernamePlaceholder: 'Enter username',
      passwordPlaceholder: 'Enter password',
      enterBtn: 'Enter Workspace',
      createBtn: 'Create Account',
      orContinue: 'Or continue with',
      googleBtn: 'Sign in with Google',
      defaultError: 'Authentication failed',
      googleError: 'Google login simulation failed'
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
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-banana-500/5 blur-[120px]"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[100px]"></div>
      </div>

      {/* Language Toggle */}
      <button 
        onClick={() => setLang(prev => prev === 'zh' ? 'en' : 'zh')}
        className="absolute top-6 right-6 z-20 flex items-center gap-2 bg-zinc-900/80 backdrop-blur border border-zinc-800 text-zinc-400 hover:text-zinc-100 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer"
      >
        <Globe size={14} />
        {lang === 'zh' ? 'English' : '中文'}
      </button>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-banana-400 to-banana-600 mb-4 shadow-lg shadow-banana-500/20">
            <span className="text-4xl font-bold text-zinc-950">N</span>
          </div>
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">Nano Banana</h1>
          <p className="text-zinc-500 mt-2">{text.subtitle}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex bg-zinc-950 p-1 rounded-lg mb-6 border border-zinc-800">
            <button
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === 'login' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {text.loginTab}
            </button>
            <button
              onClick={() => { setMode('register'); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === 'register' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {text.registerTab}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">{text.usernameLabel}</label>
              <input
                type="text"
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-banana-500/50 focus:ring-1 focus:ring-banana-500/20 transition-all placeholder-zinc-700"
                placeholder={text.usernamePlaceholder}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">{text.passwordLabel}</label>
              <input
                type="password"
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-banana-500/50 focus:ring-1 focus:ring-banana-500/20 transition-all placeholder-zinc-700"
                placeholder={text.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-banana-500 to-banana-600 hover:from-banana-400 hover:to-banana-500 text-zinc-950 font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-banana-500/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                 <>
                   {mode === 'login' ? text.enterBtn : text.createBtn}
                   <ArrowRight size={18} />
                 </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-zinc-900 px-2 text-zinc-500">{text.orContinue}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-3"
          >
             <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {text.googleBtn}
          </button>
        </div>
        <p className="text-center text-xs text-zinc-600 mt-6">
          Nano Banana v2.0 &copy; 2024. All rights reserved.
        </p>
      </div>
    </div>
  );
};