// app/components/CustomersManager.tsx

'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  UserPlus,
  RotateCw,
  AlertTriangle,
  History,
  Trash2,
  Edit,
  Play,
  Pause,
  X,
  CreditCard,
  Notebook,
  Calendar,
  CheckCircle,
  XCircle,
} from 'lucide-react';

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

interface Customer {
  id: string;
  name: string;
  idBase: string;
  username: string;
  sellerId: string;
  seller: { id: string; name: string };
  startSubscription: string;
  endSubscription: string;
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
  notes: string | null;
  createdAt: string;
}

interface CustomersManagerProps {
  sessionUser: {
    id: string;
    name: string;
    username: string;
    role: 'ADMIN' | 'SELLER';
    allowedPrices: AllowedPrice[];
  };
  sellers: Seller[];
}

export default function CustomersManager({ sessionUser, sellers }: CustomersManagerProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // Dynamic duration and price configurations
  const [durationOptions, setDurationOptions] = useState([
    { label: 'ساعتين', value: '2 hours' },
    { label: 'يوم واحد', value: '1 day' },
    { label: '3 أيام', value: '3 days' },
    { label: 'أسبوع واحد', value: '1 week' },
    { label: 'شهر واحد', value: '1 month' },
    { label: '3 أشهر', value: '3 months' },
    { label: '6 أشهر', value: '6 months' },
    { label: 'سنة واحدة', value: '1 year' },
  ]);

  const [defaultPrices, setDefaultPrices] = useState<Record<string, number>>({
    '2 hours': 5,
    '1 day': 15,
    '3 days': 30,
    '1 week': 65,
    '1 month': 150,
    '3 months': 400,
    '6 months': 700,
    '1 year': 1200,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sellerFilter, setSellerFilter] = useState('');

  // Modals States
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [logsModalOpen, setLogsModalOpen] = useState(false);

  // Selected customer for action
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);

  // Form Fields: Add Customer
  const [newName, setNewName] = useState('');
  const [newIdBase, setNewIdBase] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newDuration, setNewDuration] = useState('1 month');
  const [newAmount, setNewAmount] = useState(150);
  const [newPaymentMethod, setNewPaymentMethod] = useState('TRANSFER');
  const [newNotes, setNewNotes] = useState('');

  // Form Fields: Renew
  const [renewDuration, setRenewDuration] = useState('1 month');
  const [renewAmount, setRenewAmount] = useState(150);
  const [renewPaymentMethod, setRenewPaymentMethod] = useState('TRANSFER');
  const [renewNotes, setRenewNotes] = useState('');

  // Form Fields: Edit Details
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editSellerId, setEditSellerId] = useState('');

  // Customer logs state
  const [customerLogs, setCustomerLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Fetch all customers on load
  const fetchCustomers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (sellerFilter) params.append('sellerId', sellerFilter);

      const res = await fetch(`/api/customers?${params.toString()}`);
      if (!res.ok) throw new Error('فشل تحميل قائمة المشتركين');
      const data = await res.json();
      setCustomers(data);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const fetchDynamicPrices = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.pricePlans && Array.isArray(data.pricePlans) && data.pricePlans.length > 0) {
          const opts = data.pricePlans.map((p: any) => ({
            label: p.label,
            value: p.duration
          }));
          setDurationOptions(opts);

          const dict: Record<string, number> = {};
          data.pricePlans.forEach((p: any) => {
            dict[p.duration] = p.price;
          });
          setDefaultPrices(dict);
        }
      }
    } catch (e) {
      console.warn('Could not load dynamic price plans in CustomersManager:', e);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm, statusFilter, sellerFilter]);

  useEffect(() => {
    fetchDynamicPrices();
  }, []);

  // Handle Add Customer duration change to prefill price
  useEffect(() => {
    // If seller, resolve from allowed prices. Otherwise, resolve from defaults.
    if (sessionUser.role === 'SELLER') {
      const plan = sessionUser.allowedPrices.find(p => p.duration === newDuration);
      if (plan) setNewAmount(plan.price);
    } else {
      setNewAmount(defaultPrices[newDuration] || 150);
    }
  }, [newDuration, sessionUser, defaultPrices]);

  // Handle Renew duration change to prefill price
  useEffect(() => {
    if (sessionUser.role === 'SELLER') {
      const plan = sessionUser.allowedPrices.find(p => p.duration === renewDuration);
      if (plan) setRenewAmount(plan.price);
    } else {
      setRenewAmount(defaultPrices[renewDuration] || 150);
    }
  }, [renewDuration, sessionUser, defaultPrices]);

  // Toast alert dismissers
  const triggerSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4000);
  };
  const triggerError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(''), 4000);
  };

  // 1. Submit Add Customer
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          idBase: newIdBase,
          username: newUsername,
          duration: newDuration,
          amount: newAmount,
          paymentMethod: newPaymentMethod,
          notes: newNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ أثناء التفعيل');

      setAddModalOpen(false);
      triggerSuccess('تمت إضافة العميل وتفعيل الاشتراك بنجاح!');
      // Reset fields
      setNewName('');
      setNewIdBase('');
      setNewUsername('');
      setNewNotes('');
      fetchCustomers();
    } catch (err: any) {
      triggerError(err.message || 'فشل التفعيل');
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit Renew Customer
  const handleRenewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCust) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/customers/${selectedCust.id}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration: renewDuration,
          amount: renewAmount,
          paymentMethod: renewPaymentMethod,
          notes: renewNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل التجديد');

      setRenewModalOpen(false);
      triggerSuccess(`تم تجديد اشتراك العميل (${selectedCust.name}) بنجاح!`);
      setRenewNotes('');
      fetchCustomers();
    } catch (err: any) {
      triggerError(err.message || 'فشل التجديد');
    } finally {
      setLoading(false);
    }
  };

  // 3. Submit Suspend Customer
  const handleSuspendCustomer = async () => {
    if (!selectedCust) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/customers/${selectedCust.id}/suspend`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل التعليق');

      setSuspendModalOpen(false);
      triggerSuccess(`تم تعليق حساب العميل (${selectedCust.name}) بنجاح.`);
      fetchCustomers();
    } catch (err: any) {
      triggerError(err.message || 'فشل التعليق');
    } finally {
      setLoading(false);
    }
  };

  // 4. Submit Edit Details
  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCust) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/customers/${selectedCust.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          notes: editNotes,
          sellerId: editSellerId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل التعديل');

      setEditModalOpen(false);
      triggerSuccess('تم تعديل بيانات العميل بنجاح.');
      fetchCustomers();
    } catch (err: any) {
      triggerError(err.message || 'فشل التعديل');
    } finally {
      setLoading(false);
    }
  };

  // 5. Submit Delete Customer (Permanently)
  const handleDeleteCustomer = async (cust: Customer) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف العميل (${cust.name}) نهائياً؟ سيتم إلغاء تفعيله في النظام الخارجي أيضاً.`)) {
      return;
    }
    setLoading(true);

    try {
      const res = await fetch(`/api/customers/${cust.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'فشل الحذف');
      }

      triggerSuccess('تم حذف العميل نهائياً من النظام.');
      fetchCustomers();
    } catch (err: any) {
      triggerError(err.message || 'فشل الحذف');
    } finally {
      setLoading(false);
    }
  };

  // 6. View Customer Logs
  const viewLogs = async (cust: Customer) => {
    setSelectedCust(cust);
    setLogsModalOpen(true);
    setLogsLoading(true);
    setCustomerLogs([]);
    try {
      // MockProvider getLogs endpoint
      const res = await fetch(`/api/logs?userId=${cust.username}`);
      if (res.ok) {
        const data = await res.json();
        setCustomerLogs(data);
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  // Filter allowed options for sellers
  const availableDurations = sessionUser.role === 'SELLER'
    ? durationOptions.filter(d => sessionUser.allowedPrices.some(p => p.duration === d.value))
    : durationOptions;

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

      {/* Header bar and Add customer trigger */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">إدارة العملاء والمشتركين</h2>
          <p className="text-slate-400 text-xs mt-0.5">تفعيل، تجديد، وتعليق اشتراكات البرامج ومتابعة البيانات</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-3 px-5 rounded-xl transition duration-200 glow-primary border border-indigo-500/30 flex items-center gap-2 cursor-pointer"
        >
          <UserPlus className="w-4.5 h-4.5" />
          <span>تفعيل مشترك جديد</span>
        </button>
      </div>

      {/* Filter panel */}
      <div className="glass-panel p-4 rounded-2xl border-slate-800/80 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
        {/* Search Input */}
        <div className="relative sm:col-span-2">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4.5 h-4.5" />
          </div>
          <input
            type="text"
            placeholder="البحث بالاسم، اسم المستخدم، أو معرف القاعدة..."
            className="w-full bg-[#0a0f1d]/60 border border-slate-800 rounded-xl py-2.5 pr-10 pl-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-right"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
            <Filter className="w-4 h-4" />
          </div>
          <select
            className="w-full bg-[#0a0f1d]/60 border border-slate-800 rounded-xl py-2.5 pr-10 pl-4 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 text-right appearance-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">جميع الحالات</option>
            <option value="ACTIVE">نشط</option>
            <option value="EXPIRED">منتهي</option>
            <option value="SUSPENDED">معلق</option>
          </select>
        </div>

        {/* Seller Filter (Admin Only) */}
        {sessionUser.role === 'ADMIN' ? (
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
              <Filter className="w-4 h-4" />
            </div>
            <select
              className="w-full bg-[#0a0f1d]/60 border border-slate-800 rounded-xl py-2.5 pr-10 pl-4 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 text-right appearance-none cursor-pointer"
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
        ) : (
          <div className="text-slate-500 text-xs px-2 text-left sm:text-right">
            الموزع المسؤول: <strong className="text-slate-300">{sessionUser.name}</strong>
          </div>
        )}
      </div>

      {/* Main Customers Table grid */}
      <div className="glass-panel rounded-2xl border-slate-800/80 overflow-hidden">
        {loading && customers.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-sm">
            <span className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin inline-block mb-3" />
            <p>جاري تحميل المشتركين وتحديث الحالات...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl m-4">
            <AlertTriangle className="w-8 h-8 opacity-25 mb-2 mx-auto" />
            <p>لم يتم العثور على أي عملاء يطابقون خيارات البحث.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/10 text-slate-400">
                  <th className="p-4 font-semibold">المشترك والبرنامج</th>
                  <th className="p-4 font-semibold">تاريخ البدء</th>
                  <th className="p-4 font-semibold">تاريخ الانتهاء</th>
                  <th className="p-4 font-semibold text-center">الحالة</th>
                  {sessionUser.role === 'ADMIN' && <th className="p-4 font-semibold">الموزع</th>}
                  <th className="p-4 font-semibold">الملاحظات</th>
                  <th className="p-4 font-semibold text-left">العمليات</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((cust) => {
                  const end = new Date(cust.endSubscription);
                  const diffTime = end.getTime() - Date.now();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  const isExpiringSoon = cust.status === 'ACTIVE' && diffDays > 0 && diffDays <= 3;

                  return (
                    <tr key={cust.id} className="border-b border-slate-900/40 hover:bg-slate-800/10 transition-colors">
                      {/* Name / ID info */}
                      <td className="p-4 font-medium text-slate-100">
                        <div className="font-semibold text-sm">{cust.name}</div>
                        <div className="text-[10px] text-slate-500 mt-1 space-x-1.5 space-x-reverse">
                          <span>المعرف: {cust.username}</span>
                          <span className="text-slate-600">|</span>
                          <span>القاعدة: {cust.idBase}</span>
                        </div>
                      </td>

                      {/* Start Date */}
                      <td className="p-4 text-slate-400">
                        {new Date(cust.startSubscription).toLocaleDateString('ar-SA')}
                      </td>

                      {/* End Date */}
                      <td className="p-4">
                        <span className="text-slate-300">
                          {new Date(cust.endSubscription).toLocaleDateString('ar-SA')}
                        </span>
                        {cust.status === 'ACTIVE' && diffDays > 0 && (
                          <span className="block text-[10px] text-slate-500 mt-0.5">
                            متبقي: {diffDays} أيام
                          </span>
                        )}
                      </td>

                      {/* Status Badges */}
                      <td className="p-4 text-center">
                        {cust.status === 'ACTIVE' ? (
                          isExpiringSoon ? (
                            <span className="bg-amber-500/10 text-amber-500 border border-amber-500/25 px-2.5 py-0.5 rounded-full text-[10px] font-bold animate-pulse inline-block">
                              ينتهي قريباً
                            </span>
                          ) : (
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block">
                              نشط
                            </span>
                          )
                        ) : cust.status === 'SUSPENDED' ? (
                          <span className="bg-amber-600/15 text-amber-500 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block">
                            معلق
                          </span>
                        ) : (
                          <span className="bg-red-500/10 text-red-400 border border-red-500/25 px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block">
                            منتهي
                          </span>
                        )}
                      </td>

                      {/* Seller (Admin only) */}
                      {sessionUser.role === 'ADMIN' && (
                        <td className="p-4 text-slate-400">
                          {cust.seller?.name || 'موزع محذوف'}
                        </td>
                      )}

                      {/* Notes */}
                      <td className="p-4 text-slate-400 max-w-[150px] truncate" title={cust.notes || ''}>
                        {cust.notes || '-'}
                      </td>

                      {/* Action buttons */}
                      <td className="p-4 text-left">
                        <div className="inline-flex items-center gap-1.5" dir="ltr">
                          {/* Log check */}
                          <button
                            onClick={() => viewLogs(cust)}
                            className="p-2 bg-[#121829] hover:bg-[#182035] text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg transition cursor-pointer"
                            title="عرض سجل الدخول"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          {/* Edit Details */}
                          <button
                            onClick={() => {
                              setSelectedCust(cust);
                              setEditName(cust.name);
                              setEditNotes(cust.notes || '');
                              setEditSellerId(cust.sellerId);
                              setEditModalOpen(true);
                            }}
                            className="p-2 bg-[#121829] hover:bg-[#182035] text-slate-400 hover:text-indigo-400 border border-slate-800 rounded-lg transition cursor-pointer"
                            title="تعديل البيانات"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Toggles Status Suspend / Activate */}
                          {cust.status === 'ACTIVE' ? (
                            <button
                              onClick={() => {
                                setSelectedCust(cust);
                                setSuspendModalOpen(true);
                              }}
                              className="p-2 bg-amber-500/5 hover:bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg transition cursor-pointer"
                              title="إيقاف / تعليق الاشتراك"
                            >
                              <Pause className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedCust(cust);
                                setRenewDuration(cust.status === 'SUSPENDED' ? '1 month' : '1 month');
                                setRenewModalOpen(true);
                              }}
                              className="p-2 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg transition cursor-pointer"
                              title="تجديد / تفعيل الاشتراك"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete customer */}
                          <button
                            onClick={() => handleDeleteCustomer(cust)}
                            className="p-2 bg-red-500/5 hover:bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg transition cursor-pointer"
                            title="حذف نهائي"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD CUSTOMER POPUP */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setAddModalOpen(false)} />
          
          <div className="w-full max-w-xl bg-[#0d1322] border border-slate-800 rounded-2xl p-6 md:p-8 z-10 overflow-y-auto max-h-[90vh] glow-primary">
            <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-6">
              <h3 className="font-bold text-slate-100 text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                تفعيل مشترك جديد في النظام
              </h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-4 text-right">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Customer Name */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">اسم العميل الكامل</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: خالد محمد الحربي"
                    className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-right"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>

                {/* Base ID */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">معرف القاعدة (Base ID)</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: base_900"
                    className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-right text-ltr"
                    value={newIdBase}
                    onChange={(e) => setNewIdBase(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Username */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">اسم المستخدم للاشتراك (مفتوح بالإنكليزية)</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: khaled_90"
                    className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-right text-ltr"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">مدة التفعيل</label>
                  <select
                    className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 text-right cursor-pointer"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                  >
                    {availableDurations.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Amount Paid */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">المبلغ المستلم (ر.س)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 text-xs">
                      ر.س
                    </div>
                    <input
                      type="number"
                      required
                      min={0}
                      className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 pr-4 pl-12 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 text-right font-bold"
                      value={newAmount}
                      onChange={(e) => setNewAmount(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">طريقة الدفع</label>
                  <select
                    className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 text-right cursor-pointer"
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value)}
                  >
                    <option value="TRANSFER">حوالة بنكية</option>
                    <option value="CASH">دفع نقدي</option>
                    <option value="USDT">عملة رقمية USDT</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-2">ملاحظات تفعيل الاشتراك</label>
                <textarea
                  placeholder="ملاحظات حول طريقة الدفع أو التفعيل الفوري..."
                  rows={2}
                  className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-right resize-none"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                />
              </div>

              <div className="pt-4 border-t border-slate-900 flex items-center justify-end gap-3" dir="ltr">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2.5 px-4 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 px-5 rounded-xl transition cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>تأكيد التفعيل والخصم</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RENEW CUSTOMER POPUP */}
      {renewModalOpen && selectedCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setRenewModalOpen(false)} />

          <div className="w-full max-w-lg bg-[#0d1322] border border-slate-800 rounded-2xl p-6 z-10 glow-primary text-right">
            <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-6">
              <h3 className="font-bold text-slate-100 text-lg flex items-center gap-2">
                <RotateCw className="w-5 h-5 text-emerald-400" />
                تجديد اشتراك العميل: {selectedCust.name}
              </h3>
              <button onClick={() => setRenewModalOpen(false)} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleRenewCustomer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Renewal Duration */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">الباقة المطلوبة</label>
                  <select
                    className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 text-right cursor-pointer"
                    value={renewDuration}
                    onChange={(e) => setRenewDuration(e.target.value)}
                  >
                    {availableDurations.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount Paid */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">المبلغ المستلم للتجديد</label>
                  <input
                    type="number"
                    required
                    min={0}
                    className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 text-right font-bold"
                    value={renewAmount}
                    onChange={(e) => setRenewAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-2">طريقة دفع التجديد</label>
                <select
                  className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 text-right cursor-pointer"
                  value={renewPaymentMethod}
                  onChange={(e) => setRenewPaymentMethod(e.target.value)}
                >
                  <option value="TRANSFER">حوالة بنكية</option>
                  <option value="CASH">دفع نقدي</option>
                  <option value="USDT">عملة رقمية USDT</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-2">ملاحظات التجديد</label>
                <textarea
                  placeholder="رقم الحوالة البنكية أو ملاحظات إضافية حول التجديد..."
                  rows={2}
                  className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-right resize-none"
                  value={renewNotes}
                  onChange={(e) => setRenewNotes(e.target.value)}
                />
              </div>

              <div className="pt-4 border-t border-slate-900 flex items-center justify-end gap-3" dir="ltr">
                <button
                  type="button"
                  onClick={() => setRenewModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2.5 px-4 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 px-5 rounded-xl transition cursor-pointer flex items-center gap-2 shadow-emerald-950/20 shadow-md"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>تأكيد التجديد وتمديد الصلاحية</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SUSPEND CUSTOMER POPUP */}
      {suspendModalOpen && selectedCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSuspendModalOpen(false)} />

          <div className="w-full max-w-md bg-[#0d1322] border border-slate-800 rounded-2xl p-6 z-10 text-right">
            <h3 className="font-bold text-slate-100 text-base mb-3 text-amber-500 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              تأكيد تعليق حساب المشترك: {selectedCust.name}
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              {"سيتم إرسال طلب إيقاف/حذف فوري للنظام الخارجي API. سيؤدي هذا إلى قطع الخدمة عن المشترك فوراً وحظر اتصاله بالبرنامج، كما ستتغير حالته في النظام إلى 'معلق'. هل تود المتابعة؟"}
            </p>

            <div className="flex items-center justify-end gap-3" dir="ltr">
              <button
                type="button"
                onClick={() => setSuspendModalOpen(false)}
                className="bg-[#121829] hover:bg-[#182035] text-slate-400 hover:text-slate-200 border border-slate-850 py-2.5 px-4 rounded-xl cursor-pointer text-xs"
              >
                تراجع
              </button>
              <button
                onClick={handleSuspendCustomer}
                disabled={loading}
                className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold py-2.5 px-5 rounded-xl transition cursor-pointer"
              >
                نعم، إيقاف الخدمة فوراً
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT CUSTOMER POPUP */}
      {editModalOpen && selectedCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditModalOpen(false)} />

          <div className="w-full max-w-lg bg-[#0d1322] border border-slate-800 rounded-2xl p-6 z-10 text-right glow-primary">
            <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-6">
              <h3 className="font-bold text-slate-100 text-lg flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-400" />
                تعديل بيانات العميل: {selectedCust.name}
              </h3>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditCustomer} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-2">الاسم الكامل للعميل</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 text-right"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              {sessionUser.role === 'ADMIN' && (
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">الموزع المسؤول</label>
                  <select
                    className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 text-right cursor-pointer"
                    value={editSellerId}
                    onChange={(e) => setEditSellerId(e.target.value)}
                  >
                    {sellers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-2">ملاحظات</label>
                <textarea
                  rows={3}
                  className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 text-right resize-none"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </div>

              <div className="pt-4 border-t border-slate-900 flex items-center justify-end gap-3" dir="ltr">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2.5 px-4 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 px-5 rounded-xl transition cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: CUSTOMER LOGIN LOGS POPUP */}
      {logsModalOpen && selectedCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setLogsModalOpen(false)} />

          <div className="w-full max-w-2xl bg-[#0d1322] border border-slate-800 rounded-2xl p-6 z-10 text-right glow-primary overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-6">
              <h3 className="font-bold text-slate-100 text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-400" />
                سجل نشاط ودخول المشترك: {selectedCust.name}
              </h3>
              <button onClick={() => setLogsModalOpen(false)} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            {logsLoading ? (
              <div className="p-16 text-center text-slate-500 text-xs">
                <span className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin inline-block mb-3" />
                <p>جاري تحميل السجلات من API...</p>
              </div>
            ) : customerLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                لم يتم تسجيل أي عمليات دخول سابقة لهذا المشترك في قاعدة الـ API.
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[350px]">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-slate-400 bg-slate-900/10">
                      <th className="p-3 font-semibold">تاريخ وقت الدخول</th>
                      <th className="p-3 font-semibold">عنوان الـ IP</th>
                      <th className="p-3 font-semibold text-center">مدة الاتصال</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerLogs.map((log, index) => {
                      // Check for unrecognized IP flag (e.g. not matching local subnet or first time)
                      // Highlight IPs starting with unrecognized classes for demonstration
                      const isUnusualIp = log.ip.startsWith('82.') || log.ip.startsWith('5.');
                      return (
                        <tr key={index} className="border-b border-slate-900/40 hover:bg-slate-800/10">
                          <td className="p-3 text-slate-300">
                            {new Date(log.login_time).toLocaleString('ar-SA')}
                          </td>
                          <td className="p-3">
                            <span className={isUnusualIp ? 'text-amber-500 font-semibold' : 'text-slate-400'}>
                              {log.ip}
                            </span>
                            {isUnusualIp && (
                              <span className="bg-amber-500/10 text-amber-500 text-[9px] px-1.5 py-0.5 rounded border border-amber-500/20 mr-2 inline-block">
                                IP خارجي مشبوه
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center text-slate-400">
                            {(log.duration_seconds / 60).toFixed(0)} دقيقة
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="pt-4 border-t border-slate-900 mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setLogsModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2 px-4 rounded-xl cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
