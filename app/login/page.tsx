// app/login/page.tsx

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, User, Lock, ArrowLeftRight, Languages } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { language, setLanguage, t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t('loginError'));
      }

      // Successful login
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || t('serverError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b13] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Language Toggle at top corner */}
      <div className={`absolute top-4 ${language === 'ar' ? 'left-4' : 'right-4'} z-25`}>
        <button
          onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
          className="bg-[#0e1322] text-slate-400 border border-slate-800/80 px-3.5 py-1.5 rounded-xl hover:text-slate-200 transition cursor-pointer text-xs flex items-center gap-1.5 shadow-md shadow-black/20"
        >
          <Languages className="w-4 h-4" />
          <span>{language === 'ar' ? 'English' : 'العربية'}</span>
        </button>
      </div>

      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-950/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl glow-primary border-slate-800/80 z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-500/10 rounded-2xl mb-4 border border-indigo-500/20 text-indigo-400">
            <KeyRound className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mb-2">{t('loginTitle')}</h1>
          <p className="text-slate-400 text-sm">{t('loginSubtitle')}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-sm p-4 rounded-xl mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">{t('usernameLabel')}</label>
            <div className="relative">
              <div className={`absolute inset-y-0 ${language === 'ar' ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center pointer-events-none text-slate-500`}>
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                required
                placeholder={t('usernamePlaceholder')}
                className={`w-full bg-[#0a0f1d] border border-slate-800 rounded-xl py-3 ${
                  language === 'ar' ? 'pr-11 pl-4 text-right' : 'pl-11 pr-4 text-left'
                } text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">{t('passwordLabel')}</label>
            <div className="relative">
              <div className={`absolute inset-y-0 ${language === 'ar' ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center pointer-events-none text-slate-500`}>
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                required
                placeholder={t('passwordPlaceholder')}
                className={`w-full bg-[#0a0f1d] border border-slate-800 rounded-xl py-3 ${
                  language === 'ar' ? 'pr-11 pl-4 text-right' : 'pl-11 pr-4 text-left'
                } text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-400">
              <input
                type="checkbox"
                className="accent-indigo-500 rounded border-slate-800 bg-[#0a0f1d]"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              {t('rememberMe')}
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-4 rounded-xl transition duration-200 glow-primary border border-indigo-500/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              t('loginBtn')
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-900 text-center text-xs text-slate-500">
          <p className="flex items-center justify-center gap-1.5 text-[11px]">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            {t('independentSystem')}
          </p>
        </div>
      </div>
    </div>
  );
}
