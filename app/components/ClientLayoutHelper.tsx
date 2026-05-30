// app/components/ClientLayoutHelper.tsx

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  UserCheck,
  History,
  Settings as SettingsIcon,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  AlertTriangle,
  Menu,
  X,
  Languages,
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { TranslationKey } from '@/lib/translations';

interface ClientLayoutHelperProps {
  user: {
    id: string;
    name: string;
    username: string;
    role: 'ADMIN' | 'SELLER';
  };
  expiringCount: number;
  children: React.ReactNode;
}

export default function ClientLayoutHelper({
  user,
  expiringCount,
  children,
}: ClientLayoutHelperProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const menuItems = [
    { nameKey: 'dashboard' as TranslationKey, path: '/dashboard', icon: LayoutDashboard, role: 'ALL' },
    { nameKey: 'customers' as TranslationKey, path: '/customers', icon: Users, role: 'ALL' },
    { nameKey: 'sales' as TranslationKey, path: '/sales', icon: DollarSign, role: 'ALL' },
    { nameKey: 'logs' as TranslationKey, path: '/logs', icon: History, role: 'ALL' },
    { nameKey: 'sellers' as TranslationKey, path: '/sellers', icon: UserCheck, role: 'ADMIN' },
    { nameKey: 'settings' as TranslationKey, path: '/settings', icon: SettingsIcon, role: 'ADMIN' },
  ];

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      if (res.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const filteredMenuItems = menuItems.filter(
    (item) => item.role === 'ALL' || (item.role === 'ADMIN' && user.role === 'ADMIN')
  );

  return (
    <>
      {/* Mobile Top Header Bar */}
      <header className="md:hidden w-full bg-[#101625]/90 backdrop-blur-md border-b border-slate-900 py-4 px-4 flex items-center justify-between z-45 fixed top-0 left-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-slate-400 hover:text-slate-200 focus:outline-none cursor-pointer"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <span className="font-bold text-slate-200 text-base">{t('systemName')}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-lg border border-indigo-500/25 flex items-center gap-1 cursor-pointer"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'EN' : 'عربي'}</span>
          </button>
          {expiringCount > 0 && (
            <span className="bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {expiringCount}
            </span>
          )}
        </div>
      </header>

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 ${
          language === 'ar' ? 'right-0 border-l' : 'left-0 border-r'
        } z-50 w-64 bg-[#0d1322] border-slate-900/60 flex flex-col transform transition-transform duration-300 md:relative md:transform-none md:translate-x-0 ${
          mobileOpen 
            ? 'translate-x-0' 
            : language === 'ar' ? 'translate-x-full' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/25 text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-sm leading-tight">{t('brandName')}</h2>
              <span className="text-slate-500 text-[10px]">{t('subBrandName')}</span>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 text-slate-500 hover:text-slate-300 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group text-sm cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600/90 text-white font-medium shadow-md shadow-indigo-600/10'
                    : 'text-slate-400 hover:bg-[#131a2d] hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${
                      isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-400'
                    }`}
                  />
                  <span>{t(item.nameKey)}</span>
                </div>
                {item.path === '/customers' && expiringCount > 0 && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      isActive
                        ? 'bg-white/20 text-white border-white/30'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/25'
                    }`}
                  >
                    {expiringCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Profile & Actions */}
        <div className="p-4 border-t border-slate-900/80 bg-[#090d18] space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 border border-slate-700/50">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <h4 className="font-semibold text-slate-200 text-sm truncate">{user.name}</h4>
              <p className="text-[11px] text-slate-500 truncate">@{user.username}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all duration-200 text-xs font-medium cursor-pointer"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main className="flex-1 min-w-0 flex flex-col pt-[72px] md:pt-0 overflow-x-hidden">
        {/* Top Header desktop */}
        <header className="hidden md:flex w-full bg-[#0a0f1d]/40 backdrop-blur-md border-b border-slate-900/40 py-4 px-8 items-center justify-between z-30">
          <div>
            <span className="text-slate-500 text-xs font-medium">{t('welcomeBack')}</span>
            <h1 className="text-slate-100 font-bold text-lg leading-tight mt-0.5">{user.name}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="bg-[#121829] text-slate-400 border border-slate-800/80 px-3 py-1.5 rounded-xl hover:text-slate-200 transition cursor-pointer text-xs flex items-center gap-1.5"
            >
              <Languages className="w-4 h-4" />
              <span>{language === 'ar' ? 'English' : 'العربية'}</span>
            </button>
            {expiringCount > 0 && (
              <Link
                href="/customers?status=ACTIVE"
                className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 hover:bg-amber-500/20 transition"
              >
                <AlertTriangle className="w-4 h-4 animate-pulse" />
                <span>{t('expiringAlert', { count: expiringCount })}</span>
              </Link>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs bg-[#121829] text-slate-400 border border-slate-800/80 px-3 py-1.5 rounded-xl">
                {t('roleLabel')}{' '}
                <strong className="text-indigo-400 font-semibold">
                  {user.role === 'ADMIN' ? t('adminRole') : t('sellerRole')}
                </strong>
              </span>
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </div>
      </main>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
        />
      )}
    </>
  );
}
