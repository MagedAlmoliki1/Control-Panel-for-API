// app/(dashboard)/logs/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Calendar,
  Download,
  AlertTriangle,
  RotateCw,
  Clock,
  Globe,
  ShieldCheck,
} from 'lucide-react';

interface LogRecord {
  user_id: string;
  login_time: string;
  ip: string;
  duration_seconds: number;
  isNewIp: boolean;
  customerName: string;
  sellerName: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [ipFilter, setIpFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('userId', searchQuery);
      if (ipFilter) params.append('ip', ipFilter);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const res = await fetch(`/api/logs?${params.toString()}`);
      if (!res.ok) {
        throw new Error('فشل تحميل سجلات الدخول والأنشطة');
      }
      const data = await res.json();
      setLogs(data);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء جلب السجلات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [searchQuery, ipFilter, dateFrom, dateTo]);

  // Helper to format session duration
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds} ثانية`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours} ساعة و ${remainingMins} دقيقة`;
  };

  // CSV Export Utility
  const handleExportCSV = () => {
    if (logs.length === 0) return;
    
    // CSV Header row
    const headers = ['العميل', 'اسم مستخدم الاشتراك', 'عنوان IP', 'وقت تسجيل الدخول', 'مدة الجلسة', 'الموزع المسؤول', 'حالة الـ IP'];
    
    // Map records to rows
    const rows = logs.map(log => [
      log.customerName,
      log.user_id,
      log.ip,
      new Date(log.login_time).toLocaleString('ar-SA'),
      formatDuration(log.duration_seconds),
      log.sellerName,
      log.isNewIp ? 'عنوان جديد (تنبيه)' : 'معتاد'
    ]);

    // Construct CSV String
    const csvContent = [
      '\uFEFF' + headers.join(','), // Add BOM for Excel Arabic encoding
      ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `سجلات_الدخول_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Title Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <span>سجلات دخول وأنشطة المشتركين</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1">تتبع أوقات تسجيل الدخول، عناوين الـ IP، فترات الجلسات وكشف الأنشطة المشبوهة</p>
        </div>
        
        <button
          onClick={handleExportCSV}
          disabled={logs.length === 0}
          className="bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-semibold py-3 px-5 rounded-xl transition duration-200 glow-primary border border-indigo-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          <span>تصدير السجلات المصفاة (CSV)</span>
        </button>
      </div>

      {/* Filter panel */}
      <div className="glass-panel p-5 rounded-2xl border-slate-800/80 space-y-4">
        <h3 className="text-xs font-bold text-slate-400 flex items-center gap-2">
          <Filter className="w-3.5 h-3.5" />
          <span>خيارات البحث والتصفية المتقدمة</span>
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* Customer name / username search */}
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="ابحث بالاسم أو اسم المستخدم..."
              className="w-full bg-[#070b13]/60 border border-slate-800 rounded-xl py-2.5 pr-10 pl-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-right"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* IP search */}
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
              <Globe className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="البحث بواسطة عنوان IP..."
              className="w-full bg-[#070b13]/60 border border-slate-800 rounded-xl py-2.5 pr-10 pl-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-right text-ltr"
              value={ipFilter}
              onChange={(e) => setIpFilter(e.target.value)}
            />
          </div>

          {/* Date from */}
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
              <Calendar className="w-4 h-4" />
            </div>
            <input
              type="date"
              placeholder="من تاريخ"
              className="w-full bg-[#070b13]/60 border border-slate-800 rounded-xl py-2.5 pr-10 pl-4 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 text-right cursor-pointer"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          {/* Date to */}
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
              <Calendar className="w-4 h-4" />
            </div>
            <input
              type="date"
              placeholder="إلى تاريخ"
              className="w-full bg-[#070b13]/60 border border-slate-800 rounded-xl py-2.5 pr-10 pl-4 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 text-right cursor-pointer"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main logs Table */}
      <div className="glass-panel rounded-2xl border-slate-800/80 overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-xs">
            <RotateCw className="w-7 h-7 text-indigo-500 animate-spin inline-block mb-3" />
            <p>جاري سحب ومزامنة سجلات أنشطة المشتركين وتدقيق عناوين IP...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-400 text-xs">
            <AlertTriangle className="w-8 h-8 text-red-500/85 mb-3 inline-block" />
            <p>{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl m-4">
            <Globe className="w-8 h-8 opacity-25 mb-2 mx-auto text-slate-400" />
            <p>لا توجد أي سجلات دخول مسجلة تطابق التصفية الحالية.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/10 text-slate-400">
                  <th className="p-4 font-semibold">المشترك والبرنامج</th>
                  <th className="p-4 font-semibold text-right">عنوان الـ IP</th>
                  <th className="p-4 font-semibold">تاريخ ووقت الدخول</th>
                  <th className="p-4 font-semibold">فترة الجلسة</th>
                  <th className="p-4 font-semibold">الموزع المسؤول</th>
                  <th className="p-4 font-semibold text-left">حالة الاتصال</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr key={idx} className="border-b border-slate-900/40 hover:bg-slate-800/10 transition-colors">
                    {/* Customer */}
                    <td className="p-4 font-medium text-slate-100">
                      <div className="font-semibold text-sm">{log.customerName}</div>
                      <div className="text-[10px] text-slate-500 mt-1">المعرف: {log.user_id}</div>
                    </td>

                    {/* IP */}
                    <td className="p-4 text-slate-200 text-right font-mono text-[11px] text-ltr">
                      {log.ip}
                    </td>

                    {/* Login Time */}
                    <td className="p-4 text-slate-400">
                      {new Date(log.login_time).toLocaleString('ar-SA')}
                    </td>

                    {/* Duration */}
                    <td className="p-4 text-slate-300 font-medium">
                      <div className="flex items-center gap-1.5 justify-start">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{formatDuration(log.duration_seconds)}</span>
                      </div>
                    </td>

                    {/* Seller */}
                    <td className="p-4 text-slate-400 font-medium">
                      {log.sellerName}
                    </td>

                    {/* Status IP Anomaly Highlight */}
                    <td className="p-4 text-left">
                      {log.isNewIp ? (
                        <span className="inline-flex items-center gap-1.5 bg-amber-500/15 text-amber-500 border border-amber-500/35 px-3 py-1 rounded-full font-bold text-[10px] animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>IP جديد غير معتاد</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-indigo-500/5 text-slate-400 border border-slate-850 px-3 py-1 rounded-full font-bold text-[10px]">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                          <span>موقع دخول معتاد</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
