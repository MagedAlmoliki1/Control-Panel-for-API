// app/layout.tsx

import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/lib/LanguageContext';

export const metadata: Metadata = {
  title: 'لوحة التحكم | مبيعات الاشتراكات والمشتركين',
  description: 'لوحة تحكم احترافية لإدارة مبيعات واشتراكات البرامج والأنظمة عبر مزودين متعددين.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="h-full scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen bg-[#0b0f19] text-slate-100 antialiased font-sans selection:bg-indigo-500 selection:text-white flex flex-col">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
