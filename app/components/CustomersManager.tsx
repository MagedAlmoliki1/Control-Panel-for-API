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
import { useLanguage } from '@/lib/LanguageContext';

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
  const { language, t } = useLanguage();
  
  // Dynamic duration and price configurations
  const [durationOptions, setDurationOptions] = useState([
    { label: language === 'ar' ? 'ساعتين' : '2 Hours', value: '2 hours' },
    { label: language === 'ar' ? 'يوم واحد' : '1 Day', value: '1 day' },
    { label: language === 'ar' ? '3 أيام' : '3 Days', value: '3 days' },
    { label: language === 'ar' ? 'أسبوع واحد' : '1 Week', value: '1 week' },
    { label: language === 'ar' ? 'شهر واحد' : '1 Month', value: '1 month' },
    { label: language === 'ar' ? '3 أشهر' : '3 Months', value: '3 months' },
    { label: language === 'ar' ? '6 أشهر' : '6 Months', value: '6 months' },
    { label: language === 'ar' ? 'سنة واحدة' : '1 Year', value: '1 year' },
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

  // Update translation options when language changes
  useEffect(() => {
    setDurationOptions([
      { label: language === 'ar' ? 'ساعتين' : '2 Hours', value: '2 hours' },
      { label: language === 'ar' ? 'يوم واحد' : '1 Day', value: '1 day' },
      { label: language === 'ar' ? '3 أيام' : '3 Days', value: '3 days' },
      { label: language === 'ar' ? 'أسبوع واحد' : '1 Week', value: '1 week' },
      { label: language === 'ar' ? 'شهر واحد' : '1 Month', value: '1 month' },
      { label: language === 'ar' ? '3 أشهر' : '3 Months', value: '3 months' },
      { label: language === 'ar' ? '6 أشهر' : '6 Months', value: '6 months' },
      { label: language === 'ar' ? 'سنة واحدة' : '1 Year', value: '1 year' },
    ]);
  }, [language]);

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
      if (!res.ok) throw new Error(language === 'ar' ? 'فشل تحميل قائمة المشتركين' : 'Failed to load subscribers list');
      const data = await res.json();
      setCustomers(data);
    } catch (err: any) {
      setError(err.message || (language === 'ar' ? 'حدث خطأ غير متوقع' : 'Unexpected error occurred'));
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
      if (!res.ok) throw new Error(data.error || (language === 'ar' ? 'حدث خطأ أثناء التفعيل' : 'Error activating subscription'));

      setAddModalOpen(false);
      triggerSuccess(language === 'ar' ? 'تمت إضافة العميل وتفعيل الاشتراك بنجاح!' : 'Customer added and subscription activated successfully!');
      // Reset fields
      setNewName('');
      setNewIdBase('');
      setNewUsername('');
      setNewNotes('');
      fetchCustomers();
    } catch (err: any) {
      triggerError(err.message || (language === 'ar' ? 'فشل التفعيل' : 'Activation failed'));
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
      if (!res.ok) throw new Error(data.error || (language === 'ar' ? 'فشل التجديد' : 'Failed to renew'));

      setRenewModalOpen(false);
      triggerSuccess(
        language === 'ar' 
          ? `تم تجديد اشتراك العميل (${selectedCust.name}) بنجاح!` 
          : `Subscription for client (${selectedCust.name}) renewed successfully!`
      );
      setRenewNotes('');
      fetchCustomers();
    } catch (err: any) {
      triggerError(err.message || (language === 'ar' ? 'فشل التجديد' : 'Failed to renew'));
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
      if (!res.ok) throw new Error(data.error || (language === 'ar' ? 'فشل التعليق' : 'Failed to suspend'));

      setSuspendModalOpen(false);
      triggerSuccess(
        language === 'ar' 
          ? `تم تعليق حساب العميل (${selectedCust.name}) بنجاح.` 
          : `Customer account (${selectedCust.name}) suspended successfully.`
      );
      fetchCustomers();
    } catch (err: any) {
      triggerError(err.message || (language === 'ar' ? 'فشل التعليق' : 'Failed to suspend'));
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
      if (!res.ok) throw new Error(data.error || (language === 'ar' ? 'فشل التعديل' : 'Failed to edit'));

      setEditModalOpen(false);
      triggerSuccess(language === 'ar' ? 'تم تعديل بيانات العميل بنجاح.' : 'Customer information updated successfully.');
      fetchCustomers();
    } catch (err: any) {
      triggerError(err.message || (language === 'ar' ? 'فشل التعديل' : 'Failed to edit'));
    } finally {
      setLoading(false);
    }
  };

  // 5. Submit Delete Customer (Permanently)
  const handleDeleteCustomer = async (cust: Customer) => {
    const confirmMsg = language === 'ar' 
      ? `هل أنت متأكد من رغبتك في حذف العميل (${cust.name}) نهائياً؟ سيتم إلغاء تفعيله في النظام الخارجي أيضاً.`
      : `Are you sure you want to permanently delete customer (${cust.name})? This will also de-activate them on the external API.`;
    if (!confirm(confirmMsg)) {
      return;
    }
    setLoading(true);

    try {
      const res = await fetch(`/api/customers/${cust.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || (language === 'ar' ? 'فشل الحذف' : 'Failed to delete'));
      }

      triggerSuccess(language === 'ar' ? 'تم حذف العميل نهائياً من النظام.' : 'Customer permanently deleted from system.');
      fetchCustomers();
    } catch (err: any) {
      triggerError(err.message || (language === 'ar' ? 'فشل الحذف' : 'Failed to delete'));
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

  const currencySuffix = language === 'ar' ? ' ر.س' : ' SAR';
  const formatNum = (val: number) => val.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US');

  return (
    <div className={`space-y-6 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
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
          <h2 className="text-xl font-bold text-slate-100">{t('customersTitle')}</h2>
          <p className="text-slate-400 text-xs mt-0.5">
            {language === 'ar' ? 'تفعيل، تجديد، وتعليق اشتراكات البرامج ومتابعة البيانات' : 'Activate, renew, and suspend software subscriptions and monitor user data'}
          </p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-3 px-5 rounded-xl transition duration-200 glow-primary border border-indigo-500/20 flex items-center gap-2 cursor-pointer"
        >
          <UserPlus className="w-4.5 h-4.5" />
          <span>{t('addCustomerBtn')}</span>
        </button>
      </div>

      {/* Filter panel */}
      <div className="glass-panel p-4 rounded-2xl border-slate-800/80 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
        {/* Search Input */}
        <div className="relative sm:col-span-2">
          <div className={`absolute inset-y-0 ${language === 'ar' ? 'right-0 pr-3.5' : 'left-0 pl-3.5'} flex items-center pointer-events-none text-slate-500`}>
            <Search className="w-4.5 h-4.5" />
          </div>
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            className={`w-full bg-[#0a0f1d]/60 border border-slate-800 rounded-xl py-2.5 ${
              language === 'ar' ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'
            } text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <div className={`absolute inset-y-0 ${language === 'ar' ? 'right-0 pr-3.5' : 'left-0 pl-3.5'} flex items-center pointer-events-none text-slate-500`}>
            <Filter className="w-4 h-4" />
          </div>
          <select
            className={`w-full bg-[#0a0f1d]/60 border border-slate-800 rounded-xl py-2.5 px-4 ${
              language === 'ar' ? 'pr-10 text-right' : 'pl-10 text-left'
            } text-xs text-slate-300 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer`}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">{t('allStatus')}</option>
            <option value="ACTIVE">{t('activeStatus')}</option>
            <option value="EXPIRED">{t('expiredStatus')}</option>
            <option value="SUSPENDED">{t('suspendedStatus')}</option>
          </select>
        </div>

        {/* Seller Filter (Admin Only) */}
        {sessionUser.role === 'ADMIN' ? (
          <div className="relative">
            <div className={`absolute inset-y-0 ${language === 'ar' ? 'right-0 pr-3.5' : 'left-0 pl-3.5'} flex items-center pointer-events-none text-slate-500`}>
              <Filter className="w-4 h-4" />
            </div>
            <select
              className={`w-full bg-[#0a0f1d]/60 border border-slate-800 rounded-xl py-2.5 px-4 ${
                language === 'ar' ? 'pr-10 text-right' : 'pl-10 text-left'
              } text-xs text-slate-300 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer`}
              value={sellerFilter}
              onChange={(e) => setSellerFilter(e.target.value)}
            >
              <option value="">{language === 'ar' ? 'جميع الموزعين' : 'All Sellers'}</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className={`text-slate-500 text-xs px-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            {language === 'ar' ? 'الموزع المسؤول:' : 'Responsible Seller:'} <strong className="text-slate-300">{sessionUser.name}</strong>
          </div>
        )}
      </div>

      {/* Main Customers Table grid */}
      <div className="glass-panel rounded-2xl border-slate-800/80 overflow-hidden">
        {loading && customers.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-sm">
            <span className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin inline-block mb-3" />
            <p>{language === 'ar' ? 'جاري تحميل المشتركين وتحديث الحالات...' : 'Loading subscribers and updating status...'}</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl m-4">
            <AlertTriangle className="w-8 h-8 opacity-25 mb-2 mx-auto" />
            <p>{t('noCustomersFound')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={`w-full text-xs border-collapse ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/10 text-slate-400">
                  <th className="p-4 font-semibold">{t('tableCustomerName')}</th>
                  <th className="p-4 font-semibold">{language === 'ar' ? 'تاريخ البدء' : 'Start Date'}</th>
                  <th className="p-4 font-semibold">{language === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}</th>
                  <th className="p-4 font-semibold text-center">{t('tableStatus')}</th>
                  {sessionUser.role === 'ADMIN' && <th className="p-4 font-semibold">{language === 'ar' ? 'الموزع' : 'Seller'}</th>}
                  <th className="p-4 font-semibold">{t('notes')}</th>
                  <th className={`p-4 font-semibold ${language === 'ar' ? 'text-left' : 'text-right'}`}>{t('actions')}</th>
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
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5 font-mono">
                          <span>ID: {cust.username}</span>
                          <span className="text-slate-700">|</span>
                          <span>Base: {cust.idBase}</span>
                        </div>
                      </td>

                      {/* Start Date */}
                      <td className="p-4 text-slate-400">
                        {new Date(cust.startSubscription).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                      </td>

                      {/* End Date */}
                      <td className="p-4">
                        <span className="text-slate-300">
                          {new Date(cust.endSubscription).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                        </span>
                        {cust.status === 'ACTIVE' && diffDays > 0 && (
                          <span className="block text-[10px] text-slate-500 mt-0.5">
                            {language === 'ar' ? `متبقي: ${diffDays} يوم` : `${diffDays} days left`}
                          </span>
                        )}
                      </td>

                      {/* Status Badges */}
                      <td className="p-4 text-center">
                        {cust.status === 'ACTIVE' ? (
                          isExpiringSoon ? (
                            <span className="bg-amber-500/10 text-amber-500 border border-amber-500/25 px-2.5 py-0.5 rounded-full text-[10px] font-bold animate-pulse inline-block">
                              {language === 'ar' ? 'ينتهي قريباً' : 'Expiring Soon'}
                            </span>
                          ) : (
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block">
                              {t('activeStatus')}
                            </span>
                          )
                        ) : cust.status === 'SUSPENDED' ? (
                          <span className="bg-amber-600/15 text-amber-500 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block">
                            {t('suspendedStatus')}
                          </span>
                        ) : (
                          <span className="bg-red-500/10 text-red-400 border border-red-500/25 px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block">
                            {t('expiredStatus')}
                          </span>
                        )}
                      </td>

                      {/* Seller (Admin only) */}
                      {sessionUser.role === 'ADMIN' && (
                        <td className="p-4 text-slate-400">
                          {cust.seller?.name || 'Deleted seller'}
                        </td>
                      )}

                      {/* Notes */}
                      <td className="p-4 text-slate-400 max-w-[150px] truncate" title={cust.notes || ''}>
                        {cust.notes || '-'}
                      </td>

                      {/* Action buttons */}
                      <td className={`p-4 ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                        <div className="inline-flex items-center gap-1.5" dir="ltr">
                          {/* Log check */}
                          <button
                            onClick={() => viewLogs(cust)}
                            className="p-2 bg-[#121829] hover:bg-[#182035] text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg transition cursor-pointer"
                            title={language === 'ar' ? 'عرض سجل الدخول' : 'View Access Logs'}
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
                            title={language === 'ar' ? 'تعديل البيانات' : 'Edit Info'}
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Suspend action */}
                          {cust.status === 'ACTIVE' && (
                            <button
                              onClick={() => {
                                setSelectedCust(cust);
                                setSuspendModalOpen(true);
                              }}
                              className="p-2 bg-amber-500/5 hover:bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg transition cursor-pointer"
                              title={t('suspendBtn')}
                            >
                              <Pause className="w-4 h-4" />
                            </button>
                          )}

                          {/* Renew / Reactivate */}
                          <button
                            onClick={() => {
                              setSelectedCust(cust);
                              // set default prefill based on allowed prices or plan values
                              const firstDuration = availableDurations[0]?.value || '1 month';
                              setRenewDuration(firstDuration);
                              setRenewModalOpen(true);
                            }}
                            className="p-2 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg transition cursor-pointer"
                            title={cust.status === 'SUSPENDED' ? t('activateBtn') : t('renewBtn')}
                          >
                            <Play className="w-4 h-4" />
                          </button>

                          {/* Delete permanently (Admin Only) */}
                          {sessionUser.role === 'ADMIN' && (
                            <button
                              onClick={() => handleDeleteCustomer(cust)}
                              className="p-2 bg-red-500/5 hover:bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg transition cursor-pointer"
                              title={language === 'ar' ? 'حذف نهائياً' : 'Delete Permanently'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      {/* MODAL 1: ADD NEW CUSTOMER */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setAddModalOpen(false)} />

          <div className={`w-full max-w-xl bg-[#0d1322] border border-slate-800 rounded-2xl p-6 z-10 glow-primary ${
            language === 'ar' ? 'text-right' : 'text-left'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-6">
              <h3 className="font-bold text-slate-100 text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                {t('addCustomerBtn')}
              </h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Subscriber Name */}
                <div>
                  <label className="block text-slate-350 text-xs font-semibold mb-2">{t('customerName')} *</label>
                  <input
                    type="text"
                    required
                    placeholder={language === 'ar' ? 'الاسم الكامل للمشترك' : 'Subscriber full name'}
                    className={`w-full bg-[#070b13] border border-slate-850 rounded-xl py-3 px-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 ${
                      language === 'ar' ? 'text-right' : 'text-left'
                    }`}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>

                {/* Base ID */}
                <div>
                  <label className="block text-slate-350 text-xs font-semibold mb-2">{t('baseId')} *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. base_101"
                    className={`w-full bg-[#070b13] border border-slate-850 rounded-xl py-3 px-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono ${
                      language === 'ar' ? 'text-right text-ltr' : 'text-left text-ltr'
                    }`}
                    value={newIdBase}
                    onChange={(e) => setNewIdBase(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Subscription Username */}
                <div>
                  <label className="block text-slate-350 text-xs font-semibold mb-2">{t('subscriptionUsername')} *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. user_account"
                    className={`w-full bg-[#070b13] border border-slate-850 rounded-xl py-3 px-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono ${
                      language === 'ar' ? 'text-right text-ltr' : 'text-left text-ltr'
                    }`}
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-slate-350 text-xs font-semibold mb-2">{t('duration')} *</label>
                  <select
                    className={`w-full bg-[#070b13] border border-slate-850 rounded-xl py-3 px-4 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer ${
                      language === 'ar' ? 'text-right' : 'text-left'
                    }`}
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
                {/* Price Amount */}
                <div>
                  <label className="block text-slate-350 text-xs font-semibold mb-2">
                    {language === 'ar' ? 'المبلغ المحصل (ر.س)' : 'Collected Amount (SAR)'} *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    className={`w-full bg-[#070b13] border border-slate-850 rounded-xl py-3 px-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-bold ${
                      language === 'ar' ? 'text-right' : 'text-left'
                    }`}
                    value={newAmount}
                    onChange={(e) => setNewAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-slate-350 text-xs font-semibold mb-2">{t('paymentMethod')} *</label>
                  <select
                    className={`w-full bg-[#070b13] border border-slate-850 rounded-xl py-3 px-4 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer ${
                      language === 'ar' ? 'text-right' : 'text-left'
                    }`}
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value)}
                  >
                    <option value="TRANSFER">{t('paymentMethodTransfer')}</option>
                    <option value="CASH">{t('paymentMethodCash')}</option>
                    <option value="USDT">{t('paymentMethodUsdt')}</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-350 text-xs font-semibold mb-2">{t('notes')}</label>
                <textarea
                  placeholder={t('notesPlaceholder')}
                  rows={2}
                  className={`w-full bg-[#070b13] border border-slate-850 rounded-xl py-3 px-4 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 resize-none ${
                    language === 'ar' ? 'text-right' : 'text-left'
                  }`}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                />
              </div>

              <div className={`pt-4 border-t border-slate-900 flex items-center justify-end gap-3 ${
                language === 'ar' ? 'flex-row' : 'flex-row-reverse'
              }`}>
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2.5 px-4 rounded-xl cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 px-5 rounded-xl transition cursor-pointer"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RENEW SUBSCRIPTION */}
      {renewModalOpen && selectedCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setRenewModalOpen(false)} />

          <div className={`w-full max-w-lg bg-[#0d1322] border border-slate-800 rounded-2xl p-6 z-10 glow-primary ${
            language === 'ar' ? 'text-right' : 'text-left'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-6">
              <h3 className="font-bold text-slate-100 text-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-400" />
                {t('renewDialogTitle')} ({selectedCust.name})
              </h3>
              <button onClick={() => setRenewModalOpen(false)} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleRenewCustomer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Duration */}
                <div>
                  <label className="block text-slate-350 text-xs font-semibold mb-2">{t('duration')} *</label>
                  <select
                    className={`w-full bg-[#070b13] border border-slate-850 rounded-xl py-3 px-4 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer ${
                      language === 'ar' ? 'text-right' : 'text-left'
                    }`}
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

                {/* Amount */}
                <div>
                  <label className="block text-slate-350 text-xs font-semibold mb-2">
                    {language === 'ar' ? 'المبلغ المحصل للتجديد (ر.س)' : 'Collected Renewal Amount (SAR)'} *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    className={`w-full bg-[#070b13] border border-slate-850 rounded-xl py-3 px-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-bold ${
                      language === 'ar' ? 'text-right' : 'text-left'
                    }`}
                    value={renewAmount}
                    onChange={(e) => setRenewAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-slate-350 text-xs font-semibold mb-2">{t('paymentMethod')} *</label>
                <select
                  className={`w-full bg-[#070b13] border border-slate-850 rounded-xl py-3 px-4 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer ${
                    language === 'ar' ? 'text-right' : 'text-left'
                  }`}
                  value={renewPaymentMethod}
                  onChange={(e) => setRenewPaymentMethod(e.target.value)}
                >
                  <option value="TRANSFER">{t('paymentMethodTransfer')}</option>
                  <option value="CASH">{t('paymentMethodCash')}</option>
                  <option value="USDT">{t('paymentMethodUsdt')}</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-355 text-xs font-semibold mb-2">{t('notes')}</label>
                <textarea
                  placeholder={language === 'ar' ? 'ملاحظات إضافية حول التجديد والتحصيل...' : 'Additional notes about renewal and collection...'}
                  rows={2}
                  className={`w-full bg-[#070b13] border border-slate-850 rounded-xl py-3 px-4 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 resize-none ${
                    language === 'ar' ? 'text-right' : 'text-left'
                  }`}
                  value={renewNotes}
                  onChange={(e) => setRenewNotes(e.target.value)}
                />
              </div>

              <div className={`pt-4 border-t border-slate-900 flex items-center justify-end gap-3 ${
                language === 'ar' ? 'flex-row' : 'flex-row-reverse'
              }`}>
                <button
                  type="button"
                  onClick={() => setRenewModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2.5 px-4 rounded-xl cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-650 hover:bg-indigo-550 text-white text-xs font-semibold py-2.5 px-5 rounded-xl transition cursor-pointer"
                >
                  {t('confirmRenew')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SUSPEND CONFIRMATION */}
      {suspendModalOpen && selectedCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSuspendModalOpen(false)} />

          <div className={`w-full max-w-md bg-[#0d1322] border border-slate-800 rounded-2xl p-6 z-10 glow-primary ${
            language === 'ar' ? 'text-right' : 'text-left'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4">
              <h3 className="font-bold text-slate-100 text-lg flex items-center gap-2 text-amber-500">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
                {t('suspendDialogTitle')}
              </h3>
              <button onClick={() => setSuspendModalOpen(false)} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              {language === 'ar' 
                ? 'سيتم إرسال طلب إيقاف/حظر فوري للنظام الخارجي API. سيؤدي هذا إلى قطع الخدمة عن المشترك فوراً وحظر اتصاله بالبرنامج، كما ستتغير حالته في النظام إلى "معلق". هل تود المتابعة؟'
                : 'An immediate suspension/block request will be dispatched to the external API. This will instantly disconnect the user and block their access to the software. Their local system status will change to "Suspended". Do you wish to proceed?'}
            </p>

            <div className={`flex items-center justify-end gap-3 ${
              language === 'ar' ? 'flex-row' : 'flex-row-reverse'
            }`}>
              <button
                type="button"
                onClick={() => setSuspendModalOpen(false)}
                className="bg-[#121829] hover:bg-[#182035] text-slate-400 hover:text-slate-200 border border-slate-850 py-2.5 px-4 rounded-xl cursor-pointer text-xs"
              >
                {language === 'ar' ? 'تراجع' : 'Cancel'}
              </button>
              <button
                onClick={handleSuspendCustomer}
                disabled={loading}
                className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold py-2.5 px-5 rounded-xl transition cursor-pointer"
              >
                {t('confirmSuspend')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT CUSTOMER POPUP */}
      {editModalOpen && selectedCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditModalOpen(false)} />

          <div className={`w-full max-w-lg bg-[#0d1322] border border-slate-800 rounded-2xl p-6 z-10 glow-primary ${
            language === 'ar' ? 'text-right' : 'text-left'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-6">
              <h3 className="font-bold text-slate-100 text-lg flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-400" />
                {language === 'ar' ? `تعديل بيانات العميل: ${selectedCust.name}` : `Edit Customer Details: ${selectedCust.name}`}
              </h3>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditCustomer} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-2">{t('customerName')}</label>
                <input
                  type="text"
                  required
                  className={`w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 ${
                    language === 'ar' ? 'text-right' : 'text-left'
                  }`}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              {sessionUser.role === 'ADMIN' && (
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">{language === 'ar' ? 'الموزع المسؤول' : 'Responsible Seller'}</label>
                  <select
                    className={`w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer ${
                      language === 'ar' ? 'text-right' : 'text-left'
                    }`}
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
                <label className="block text-slate-300 text-xs font-semibold mb-2">{t('notes')}</label>
                <textarea
                  rows={3}
                  className={`w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none ${
                    language === 'ar' ? 'text-right' : 'text-left'
                  }`}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </div>

              <div className={`pt-4 border-t border-slate-900 flex items-center justify-end gap-3 ${
                language === 'ar' ? 'flex-row' : 'flex-row-reverse'
              }`}>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2.5 px-4 rounded-xl cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-650 hover:bg-indigo-550 text-white text-xs font-semibold py-2.5 px-5 rounded-xl transition cursor-pointer"
                >
                  {language === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}
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

          <div className={`w-full max-w-2xl bg-[#0d1322] border border-slate-800 rounded-2xl p-6 z-10 glow-primary overflow-hidden ${
            language === 'ar' ? 'text-right' : 'text-left'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-6">
              <h3 className="font-bold text-slate-100 text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-400" />
                {language === 'ar' ? `سجل نشاط ودخول المشترك: ${selectedCust.name}` : `Access logs for subscriber: ${selectedCust.name}`}
              </h3>
              <button onClick={() => setLogsModalOpen(false)} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            {logsLoading ? (
              <div className="p-16 text-center text-slate-500 text-xs">
                <span className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin inline-block mb-3" />
                <p>{language === 'ar' ? 'جاري تحميل السجلات من API...' : 'Loading logs from API...'}</p>
              </div>
            ) : customerLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                {language === 'ar' 
                  ? 'لم يتم تسجيل أي عمليات دخول سابقة لهذا المشترك في قاعدة الـ API.' 
                  : 'No previous access log entries recorded for this subscriber in the API database.'}
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[350px]">
                <table className={`w-full text-xs border-collapse ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  <thead>
                    <tr className="border-b border-slate-800/80 text-slate-400 bg-slate-900/10">
                      <th className="p-3 font-semibold">{t('tableLogDate')}</th>
                      <th className="p-3 font-semibold">{language === 'ar' ? 'عنوان الـ IP' : 'IP Address'}</th>
                      <th className="p-3 font-semibold text-center">{language === 'ar' ? 'مدة الاتصال' : 'Connection Duration'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerLogs.map((log, index) => {
                      const isUnusualIp = log.ip.startsWith('82.') || log.ip.startsWith('5.');
                      return (
                        <tr key={index} className="border-b border-slate-900/40 hover:bg-slate-800/10">
                          <td className="p-3 text-slate-300">
                            {new Date(log.login_time).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                          </td>
                          <td className="p-3">
                            <span className={isUnusualIp ? 'text-amber-500 font-semibold' : 'text-slate-400'}>
                              {log.ip}
                            </span>
                            {isUnusualIp && (
                              <span className="bg-amber-500/10 text-amber-500 text-[9px] px-1.5 py-0.5 rounded border border-amber-500/20 mx-2 inline-block">
                                {language === 'ar' ? 'IP خارجي مشبوه' : 'Suspicious External IP'}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center text-slate-400">
                            {formatNum(Math.round(log.duration_seconds / 60))} {language === 'ar' ? 'دقيقة' : 'minutes'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className={`pt-4 border-t border-slate-900 mt-6 flex ${language === 'ar' ? 'justify-end' : 'justify-end'}`}>
              <button
                type="button"
                onClick={() => setLogsModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2 px-4 rounded-xl cursor-pointer"
              >
                {language === 'ar' ? 'إغلاق النافذة' : 'Close Window'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
