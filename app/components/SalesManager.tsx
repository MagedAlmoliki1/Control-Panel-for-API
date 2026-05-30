// app/components/SalesManager.tsx

'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  DollarSign,
  Download,
  PlusCircle,
  TrendingUp,
  CreditCard,
  X,
  CheckCircle,
  XCircle,
  Calendar,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface AllowedPrice {
  duration: string;
  price: number;
  currency: string;
}

interface Seller {
  id: string;
  name: string;
  username: string;
}

interface CustomerBrief {
  id: string;
  name: string;
  username: string;
}

interface Sale {
  id: string;
  customerId: string;
  customer: { id: string; name: string; username: string; idBase: string } | null;
  sellerId: string;
  seller: { id: string; name: string; username: string };
  amount: number;
  currency: string;
  duration: string;
  paymentMethod: string;
  notes: string | null;
  createdAt: string;
}

interface SalesManagerProps {
  sessionUser: {
    id: string;
    name: string;
    username: string;
    role: 'ADMIN' | 'SELLER';
    allowedPrices: AllowedPrice[];
  };
  sellers: Seller[];
  customers: CustomerBrief[];
}

export default function SalesManager({ sessionUser, sellers, customers }: SalesManagerProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [sellerFilter, setSellerFilter] = useState('');
  const [durationFilter, setDurationFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  // Custom Record Modal State
  const [recordModalOpen, setRecordModalOpen] = useState(false);

  // Custom Form Fields
  const [selectedCustId, setSelectedCustId] = useState('');
  const [customAmount, setCustomAmount] = useState(150);
  const [customDuration, setCustomDuration] = useState('1 month');
  const [customMethod, setCustomMethod] = useState('TRANSFER');
  const [customNotes, setCustomNotes] = useState('');

  // Fetch sales
  const fetchSales = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (sellerFilter) params.append('sellerId', sellerFilter);
      if (durationFilter) params.append('duration', durationFilter);
      if (methodFilter) params.append('paymentMethod', methodFilter);

      const res = await fetch(`/api/sales?${params.toString()}`);
      if (!res.ok) throw new Error('فشل تحميل تقارير المبيعات');
      const data = await res.json();
      setSales(data);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في تحميل الأرباح');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [searchTerm, sellerFilter, durationFilter, methodFilter]);

  const triggerSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4500);
  };
  const triggerError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(''), 4500);
  };

  // Prefill price on duration change
  useEffect(() => {
    const defaultPrices: Record<string, number> = {
      '2 hours': 5,
      '1 day': 15,
      '3 days': 30,
      '1 week': 60,
      '1 month': 150,
      '3 months': 400,
      '6 months': 700,
      '1 year': 1200,
    };
    setCustomAmount(defaultPrices[customDuration] || 150);
  }, [customDuration]);

  // Submit manual custom payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustId) return;
    setLoading(true);

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustId,
          amount: customAmount,
          duration: customDuration,
          paymentMethod: customMethod,
          notes: customNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تسجيل الدفعة');

      setRecordModalOpen(false);
      triggerSuccess('تم تسجيل العملية المالية وإضافة الدفعة بنجاح!');
      setSelectedCustId('');
      setCustomNotes('');
      fetchSales();
    } catch (err: any) {
      triggerError(err.message || 'فشل التسجيل');
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Metrics Aggregators (computed from current filtered sales list)
  const totalSales = sales.reduce((acc, curr) => acc + curr.amount, 0);

  const getFilteredMetrics = () => {
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0)).getTime();
    
    // Start of week (Sunday)
    const currentDay = now.getDay();
    const startOfWeek = new Date(now.setDate(now.getDate() - currentDay)).setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let todaySum = 0;
    let weekSum = 0;
    let monthSum = 0;

    sales.forEach((s) => {
      const time = new Date(s.createdAt).getTime();
      if (time >= today) todaySum += s.amount;
      if (time >= startOfWeek) weekSum += s.amount;
      if (time >= startOfMonth) monthSum += s.amount;
    });

    return { todaySum, weekSum, monthSum };
  };

  const { todaySum, weekSum, monthSum } = getFilteredMetrics();

  // Monthly Sales Chart Data formatter
  const getChartData = () => {
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const monthlyMap: Record<number, number> = {};

    sales.forEach((s) => {
      const date = new Date(s.createdAt);
      // Group by month of the current year
      if (date.getFullYear() === new Date().getFullYear()) {
        const month = date.getMonth();
        monthlyMap[month] = (monthlyMap[month] || 0) + s.amount;
      }
    });

    // Populate data for the past 6 months up to current month
    const currentMonth = new Date().getMonth();
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const mIdx = (currentMonth - i + 12) % 12;
      chartData.push({
        name: months[mIdx],
        المبيعات: monthlyMap[mIdx] || 0,
      });
    }
    return chartData;
  };

  const chartData = getChartData();

  // Client-side UTF-8 CSV Exporter (Excel compliant)
  const exportToCSV = () => {
    if (sales.length === 0) return;

    const headers = ['رقم العملية', 'اسم المشترك', 'اسم المستخدم', 'معرف القاعدة', 'الموزع المسؤول', 'الباقة', 'المبلغ (ر.س)', 'طريقة الدفع', 'التاريخ', 'ملاحظات'];
    const csvRows = [headers.join(',')];

    sales.forEach((s) => {
      const row = [
        `"${s.id}"`,
        `"${s.customer?.name || 'عميل محذوف'}"`,
        `"${s.customer?.username || 'N/A'}"`,
        `"${s.customer?.idBase || 'N/A'}"`,
        `"${s.seller.name}"`,
        `"${s.duration}"`,
        `"${s.amount}"`,
        `"${s.paymentMethod === 'TRANSFER' ? 'حوالة بنكية' : s.paymentMethod === 'CASH' ? 'نقدي' : 'عملات رقمية'}"`,
        `"${new Date(s.createdAt).toLocaleDateString('ar-SA')}"`,
        `"${s.notes || ''}"`,
      ];
      csvRows.push(row.join(','));
    });

    // Excel compatibility BOM header for Arabic UTF-8 formatting
    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `تقرير_المبيعات_${new Date().toLocaleDateString('ar-SA')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const durationOptions = [
    { label: 'ساعتين', value: '2 hours' },
    { label: 'يوم واحد', value: '1 day' },
    { label: '3 أيام', value: '3 days' },
    { label: 'أسبوع واحد', value: '1 week' },
    { label: 'شهر واحد', value: '1 month' },
    { label: '3 أشهر', value: '3 months' },
    { label: '6 أشهر', value: '6 months' },
    { label: 'سنة واحدة', value: '1 year' },
  ];

  return (
    <div className="space-y-6">
      {/* Success/Error Toasts */}
      {success && (
        <div className="fixed top-5 left-5 z-50 bg-emerald-500 text-white font-semibold py-3 px-6 rounded-2xl shadow-xl flex items-center gap-3 animate-slide-in">
          <CheckCircle className="w-5 h-5" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="fixed top-5 left-5 z-50 bg-red-500 text-white font-semibold py-3 px-6 rounded-2xl shadow-xl flex items-center gap-3 animate-slide-in">
          <XCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Header section with Custom Payment trigger */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">المبيعات والتقارير المالية</h2>
          <p className="text-slate-400 text-xs mt-0.5">متابعة إجمالي الإيرادات، الأرباح، وتسجيل العمليات المالية</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={exportToCSV}
            disabled={sales.length === 0}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-3 px-4 rounded-xl transition flex items-center gap-2 border border-slate-700/50 cursor-pointer disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            <span>تصدير CSV</span>
          </button>
          <button
            onClick={() => setRecordModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-3 px-4 rounded-xl transition duration-200 glow-primary border border-indigo-500/30 flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4.5 h-4.5" />
            <span>تسجيل دفعة يدوية</span>
          </button>
        </div>
      </div>

      {/* Financial Metrics Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Today */}
        <div className="glass-panel p-5 rounded-2xl border-slate-800/80">
          <span className="text-slate-400 text-xs font-semibold">مبيعات اليوم</span>
          <h3 className="text-xl font-bold text-slate-100 mt-2">
            {todaySum.toLocaleString('ar-SA')} <span className="text-xs font-normal text-slate-400">ر.س</span>
          </h3>
          <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-0.5 mt-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> اليوم الحالي
          </span>
        </div>

        {/* Metric 2: This Week */}
        <div className="glass-panel p-5 rounded-2xl border-slate-800/80">
          <span className="text-slate-400 text-xs font-semibold">مبيعات الأسبوع</span>
          <h3 className="text-xl font-bold text-slate-100 mt-2">
            {weekSum.toLocaleString('ar-SA')} <span className="text-xs font-normal text-slate-400">ر.س</span>
          </h3>
          <span className="text-[10px] text-indigo-400 font-medium flex items-center gap-0.5 mt-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> آخر 7 أيام عمل
          </span>
        </div>

        {/* Metric 3: This Month */}
        <div className="glass-panel p-5 rounded-2xl border-slate-800/80">
          <span className="text-slate-400 text-xs font-semibold">مبيعات الشهر</span>
          <h3 className="text-xl font-bold text-slate-100 mt-2">
            {monthSum.toLocaleString('ar-SA')} <span className="text-xs font-normal text-slate-400">ر.س</span>
          </h3>
          <span className="text-[10px] text-indigo-400 font-medium flex items-center gap-0.5 mt-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> إيراد الشهر الحالي
          </span>
        </div>

        {/* Metric 4: Total sum */}
        <div className="glass-panel p-5 rounded-2xl border-slate-800/80">
          <span className="text-slate-400 text-xs font-semibold">إجمالي المبيعات المصفاة</span>
          <h3 className="text-xl font-bold text-slate-100 mt-2">
            {totalSales.toLocaleString('ar-SA')} <span className="text-xs font-normal text-slate-400">ر.س</span>
          </h3>
          <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-0.5 mt-1.5">
            <CheckCircle className="w-3.5 h-3.5" /> إجمالي التفعيلات
          </span>
        </div>
      </div>

      {/* Grid: Charts & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly analytical chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border-slate-800/80">
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-100">تحليل الأرباح الشهرية (الربع الحالي)</h3>
            <p className="text-slate-400 text-[10px]">مخطط المبيعات ومجموع العمليات المسجلة للشهور الستة الأخيرة</p>
          </div>
          <div className="h-72 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" opacity={0.2} vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)', radius: 8 }} />
                <Bar dataKey="المبيعات" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Multi-Filters Workspace */}
        <div className="glass-panel p-6 rounded-2xl border-slate-800/80 text-right space-y-4">
          <h3 className="text-base font-bold text-slate-100 border-b border-slate-900 pb-3">تصفية التقرير المالي</h3>

          {/* Search by Customer Name */}
          <div>
            <label className="block text-slate-400 text-[10px] font-semibold mb-2">اسم المشترك أو المستخدم</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="ابحث بالاسم..."
                className="w-full bg-[#0a0f1d]/60 border border-slate-800 rounded-xl py-2.5 pr-10 pl-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 text-right"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Filter by Seller (Admin Only) */}
          {sessionUser.role === 'ADMIN' && (
            <div>
              <label className="block text-slate-400 text-[10px] font-semibold mb-2">الموزع المسؤول</label>
              <select
                className="w-full bg-[#0a0f1d]/60 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 text-right cursor-pointer"
                value={sellerFilter}
                onChange={(e) => setSellerFilter(e.target.value)}
              >
                <option value="">جميع الموزعين</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filter by Duration */}
          <div>
            <label className="block text-slate-400 text-[10px] font-semibold mb-2">باقة الاشتراك</label>
            <select
              className="w-full bg-[#0a0f1d]/60 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 text-right cursor-pointer"
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value)}
            >
              <option value="">جميع الباقات</option>
              {durationOptions.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Payment Method */}
          <div>
            <label className="block text-slate-400 text-[10px] font-semibold mb-2">طريقة الدفع</label>
            <select
              className="w-full bg-[#0a0f1d]/60 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 text-right cursor-pointer"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              <option value="">جميع طرق الدفع</option>
              <option value="TRANSFER">حوالة بنكية</option>
              <option value="CASH">دفع نقدي</option>
              <option value="USDT">عملة رقمية USDT</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sales Transactions Ledger */}
      <div className="glass-panel rounded-2xl border-slate-800/80 overflow-hidden">
        {loading && sales.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <span className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin inline-block mb-3" />
            <p>جاري تحميل سجل المعاملات المالية...</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-xs m-4 border border-dashed border-slate-800 rounded-2xl">
            لا توجد أية معاملات مبيعات مسجلة تطابق التصفية الحالية.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/10 text-slate-400">
                  <th className="p-4 font-semibold">المشترك والبرنامج</th>
                  {sessionUser.role === 'ADMIN' && <th className="p-4 font-semibold">الموزع</th>}
                  <th className="p-4 font-semibold text-center">الباقة</th>
                  <th className="p-4 font-semibold text-center">طريقة الدفع</th>
                  <th className="p-4 font-semibold text-center">المبلغ المستلم</th>
                  <th className="p-4 font-semibold">تاريخ العملية</th>
                  <th className="p-4 font-semibold">ملاحظات الصفقة</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-b border-slate-900/40 hover:bg-slate-800/10">
                    <td className="p-4 font-medium text-slate-100">
                      <div className="font-semibold">{sale.customer ? sale.customer.name : 'عميل محذوف'}</div>
                      <div className="text-[10px] text-slate-500 mt-1">@{sale.customer?.username || 'N/A'}</div>
                    </td>
                    {sessionUser.role === 'ADMIN' && (
                      <td className="p-4 text-slate-400">{sale.seller.name}</td>
                    )}
                    <td className="p-4 text-center">
                      <span className="bg-[#121829] text-indigo-400 border border-slate-800/80 px-2 py-0.5 rounded text-[10px]">
                        {sale.duration}
                      </span>
                    </td>
                    <td className="p-4 text-center text-slate-300">
                      {sale.paymentMethod === 'TRANSFER' ? 'حوالة بنكية' : sale.paymentMethod === 'CASH' ? 'دفع نقدي' : 'USDT'}
                    </td>
                    <td className="p-4 text-center text-emerald-400 font-bold">
                      {sale.amount.toLocaleString('ar-SA')} ر.س
                    </td>
                    <td className="p-4 text-slate-400">
                      {new Date(sale.createdAt).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="p-4 text-slate-400 max-w-[200px] truncate" title={sale.notes || ''}>
                      {sale.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: RECORD CUSTOM PAYMENT POPUP */}
      {recordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setRecordModalOpen(false)} />

          <div className="w-full max-w-lg bg-[#0d1322] border border-slate-800 rounded-2xl p-6 z-10 text-right glow-primary">
            <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-6">
              <h3 className="font-bold text-slate-100 text-lg flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-400" />
                تسجيل دفعة يدوية منفصلة
              </h3>
              <button onClick={() => setRecordModalOpen(false)} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              {/* Select Customer */}
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-2">المشترك المعني بالدفعة</label>
                <select
                  required
                  className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 text-right cursor-pointer"
                  value={selectedCustId}
                  onChange={(e) => setSelectedCustId(e.target.value)}
                >
                  <option value="">اختر مشتركاً...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (@{c.username})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Duration */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">باقة الاشتراك</label>
                  <select
                    className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 text-right cursor-pointer"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                  >
                    {durationOptions.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">المبلغ المستلم (ر.س)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 text-right font-bold"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-2">طريقة الدفع</label>
                <select
                  className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 text-right cursor-pointer"
                  value={customMethod}
                  onChange={(e) => setCustomMethod(e.target.value)}
                >
                  <option value="TRANSFER">حوالة بنكية</option>
                  <option value="CASH">دفع نقدي</option>
                  <option value="USDT">عملة رقمية USDT</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-2">ملاحظات</label>
                <textarea
                  placeholder="رقم العملية، معلومات المحفظة الرقمية، أو تفاصيل إضافية..."
                  rows={2}
                  className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-right resize-none"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                />
              </div>

              <div className="pt-4 border-t border-slate-900 flex items-center justify-end gap-3" dir="ltr">
                <button
                  type="button"
                  onClick={() => setRecordModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2.5 px-4 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 px-5 rounded-xl transition cursor-pointer"
                >
                  تأكيد وتسجيل الدفعة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
