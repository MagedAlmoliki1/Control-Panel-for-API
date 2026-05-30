// app/components/SellersManager.tsx

'use client';

import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  UserPlus,
  Phone,
  Lock,
  User,
  Settings,
  DollarSign,
  AlertTriangle,
  X,
  CheckCircle,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Edit,
  Trash2,
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
  phone: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  allowedPrices: AllowedPrice[];
  createdAt: string;
  activeCustomersCount: number;
  totalSales: number;
}

export default function SellersManager() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals States
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);

  // Form Fields: Add Seller
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAllowedPrices, setNewAllowedPrices] = useState<AllowedPrice[]>([]);

  // Form Fields: Edit Seller
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [editPassword, setEditPassword] = useState('');
  const [editAllowedPrices, setEditAllowedPrices] = useState<AllowedPrice[]>([]);

  const { language, t } = useLanguage();

  // Predefined default durations (acts as initial fallback)
  const defaultDurations = [
    { label: language === 'ar' ? 'ساعتين' : '2 Hours', value: '2 hours', defaultPrice: 5 },
    { label: language === 'ar' ? 'يوم واحد' : '1 Day', value: '1 day', defaultPrice: 15 },
    { label: language === 'ar' ? '3 أيام' : '3 Days', value: '3 days', defaultPrice: 30 },
    { label: language === 'ar' ? 'أسبوع واحد' : '1 Week', value: '1 week', defaultPrice: 60 },
    { label: language === 'ar' ? 'شهر واحد' : '1 Month', value: '1 month', defaultPrice: 150 },
    { label: language === 'ar' ? '3 أشهر' : '3 Months', value: '3 months', defaultPrice: 400 },
    { label: language === 'ar' ? '6 أشهر' : '6 Months', value: '6 months', defaultPrice: 700 },
    { label: language === 'ar' ? 'سنة واحدة' : '1 Year', value: '1 year', defaultPrice: 1200 },
  ];

  const [pricePlansFromDb, setPricePlansFromDb] = useState<any[]>([]);

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sellers');
      if (!res.ok) throw new Error(language === 'ar' ? 'فشل تحميل بيانات الموزعين' : 'Failed to load sellers data');
      const data = await res.json();
      setSellers(data);
    } catch (err: any) {
      setError(err.message || (language === 'ar' ? 'حدث خطأ غير متوقع' : 'Unexpected error occurred'));
    } finally {
      setLoading(false);
    }
  };

  const fetchPricePlans = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.pricePlans && Array.isArray(data.pricePlans) && data.pricePlans.length > 0) {
          setPricePlansFromDb(data.pricePlans);
        }
      }
    } catch (e) {
      console.warn('Could not fetch price plans for SellersManager:', e);
    }
  };

  useEffect(() => {
    fetchSellers();
    fetchPricePlans();
  }, []);

  const triggerSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4500);
  };
  const triggerError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(''), 4500);
  };

  const getActivePricePlans = () => {
    if (pricePlansFromDb.length > 0) {
      return pricePlansFromDb;
    }
    return defaultDurations;
  };

  const activePlans = getActivePricePlans();

  // Handle Allowed price checkbox toggle in Add Seller
  const handleAddTogglePrice = (duration: string, defaultVal: number) => {
    const exists = newAllowedPrices.find(p => p.duration === duration);
    if (exists) {
      setNewAllowedPrices(newAllowedPrices.filter(p => p.duration !== duration));
    } else {
      setNewAllowedPrices([...newAllowedPrices, { duration, price: defaultVal, currency: 'SAR' }]);
    }
  };

  const handleAddPriceChange = (duration: string, value: number) => {
    setNewAllowedPrices(
      newAllowedPrices.map(p => (p.duration === duration ? { ...p, price: value } : p))
    );
  };

  // Handle Allowed price checkbox toggle in Edit Seller
  const handleEditTogglePrice = (duration: string, defaultVal: number) => {
    const exists = editAllowedPrices.find(p => p.duration === duration);
    if (exists) {
      setEditAllowedPrices(editAllowedPrices.filter(p => p.duration !== duration));
    } else {
      setEditAllowedPrices([...editAllowedPrices, { duration, price: defaultVal, currency: 'SAR' }]);
    }
  };

  const handleEditPriceChange = (duration: string, value: number) => {
    setEditAllowedPrices(
      editAllowedPrices.map(p => (p.duration === duration ? { ...p, price: value } : p))
    );
  };

  // Submit add seller
  const handleAddSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newUsername || !newPassword) {
      triggerError(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة للموزع' : 'Please fill all required seller fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/sellers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          username: newUsername.trim().toLowerCase(),
          password: newPassword,
          phone: newPhone,
          allowedPrices: newAllowedPrices,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (language === 'ar' ? 'فشل إضافة الموزع' : 'Failed to add seller'));

      setAddModalOpen(false);
      triggerSuccess(language === 'ar' ? 'تمت إضافة الموزع بنجاح وتخصيص الباقات!' : 'Seller added successfully with allocated plans!');
      
      // Reset
      setNewName('');
      setNewUsername('');
      setNewPassword('');
      setNewPhone('');
      setNewAllowedPrices([]);
      fetchSellers();
    } catch (err: any) {
      triggerError(err.message || (language === 'ar' ? 'فشل الحفظ' : 'Failed to save'));
    } finally {
      setLoading(false);
    }
  };

  // Submit edit seller
  const handleEditSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeller) return;

    setLoading(true);
    try {
      const payload: any = {
        name: editName,
        phone: editPhone,
        status: editStatus,
        allowedPrices: editAllowedPrices,
      };
      if (editPassword) {
        payload.password = editPassword;
      }

      const res = await fetch(`/api/sellers/${selectedSeller.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (language === 'ar' ? 'فشل تعديل بيانات الموزع' : 'Failed to update seller data'));

      setEditModalOpen(false);
      triggerSuccess(language === 'ar' ? `تم تعديل بيانات الموزع (${editName}) بنجاح` : `Seller (${editName}) updated successfully`);
      setEditPassword('');
      fetchSellers();
    } catch (err: any) {
      triggerError(err.message || (language === 'ar' ? 'فشل الحفظ' : 'Failed to save'));
    } finally {
      setLoading(false);
    }
  };

  // Toggle seller status
  const handleToggleStatus = async (seller: Seller) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sellers/${seller.id}/toggle`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (language === 'ar' ? 'فشل تغيير حالة الموزع' : 'Failed to toggle seller status'));

      triggerSuccess(
        language === 'ar' 
          ? `تم تغيير حالة الموزع (${seller.name}) بنجاح إلى: ${data.status === 'ACTIVE' ? 'نشط' : 'موقف'}`
          : `Seller (${seller.name}) status toggled successfully to: ${data.status === 'ACTIVE' ? 'Active' : 'Disabled'}`
      );
      fetchSellers();
    } catch (err: any) {
      triggerError(err.message || (language === 'ar' ? 'فشل التغيير' : 'Failed to toggle status'));
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (seller: Seller) => {
    setSelectedSeller(seller);
    setEditName(seller.name);
    setEditPhone(seller.phone || '');
    setEditStatus(seller.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE');
    setEditAllowedPrices(seller.allowedPrices || []);
    setEditModalOpen(true);
  };

  const currencySuffix = language === 'ar' ? ' ر.س' : ' SAR';
  const formatNum = (val: number) => val.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US');

  return (
    <div className={`space-y-6 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
      {/* Toast Alert elements */}
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

      {/* Header bar section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <span>{t('sellersTitle')}</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            {language === 'ar' 
              ? 'إنشاء وإدارة حسابات الموزعين وتخصيص باقات البيع المسموحة والحدود الدنيا لأسعارهم' 
              : 'Create and manage distributor accounts, assign allowed plans, and limit minimum prices'}
          </p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-3 px-5 rounded-xl transition duration-200 glow-primary border border-indigo-500/20 flex items-center gap-2 cursor-pointer"
        >
          <UserPlus className="w-4.5 h-4.5" />
          <span>{t('addSellerBtn')}</span>
        </button>
      </div>

      {/* Sellers Grid Cards */}
      {loading && sellers.length === 0 ? (
        <div className="glass-panel p-16 text-center text-slate-500 text-xs rounded-2xl border-slate-800">
          <span className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin inline-block mb-3" />
          <p>{language === 'ar' ? 'جاري جلب تفاصيل وبيانات الموزعين الأكفاء...' : 'Fetching distributor records and data...'}</p>
        </div>
      ) : sellers.length === 0 ? (
        <div className="p-16 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
          <User className="w-8 h-8 opacity-25 mb-2 mx-auto text-slate-400" />
          <p>{t('noSellersFound')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sellers.map((seller) => (
            <div key={seller.id} className="glass-panel rounded-2xl border-slate-800/80 overflow-hidden flex flex-col justify-between">
              {/* Card Header info */}
              <div className="p-6 border-b border-slate-900/60 bg-slate-900/10 flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                    {seller.name}
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                      seller.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'
                    }`} />
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">@{seller.username}</p>
                  {seller.phone && (
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>{seller.phone}</span>
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(seller)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-350 border border-slate-700/50 rounded-lg transition cursor-pointer"
                    title={language === 'ar' ? 'تعديل البيانات والباقات' : 'Edit Details & Packages'}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(seller)}
                    className={`p-2 rounded-lg border transition cursor-pointer ${
                      seller.status === 'ACTIVE' 
                        ? 'bg-amber-500/5 text-amber-500 border-amber-500/20 hover:bg-amber-500/10' 
                        : 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10'
                    }`}
                    title={t('statusActionToggle')}
                  >
                    {seller.status === 'ACTIVE' ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Card Body stats */}
              <div className="p-6 space-y-4 flex-1">
                {/* Stats cards inside */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-[#0a0f1d] border border-slate-900 rounded-xl">
                    <span className="text-slate-500 text-[10px] block">{language === 'ar' ? 'العملاء النشطون' : 'Active Customers'}</span>
                    <strong className="text-slate-200 text-sm mt-1 block">{formatNum(seller.activeCustomersCount)} {language === 'ar' ? 'عميل' : 'clients'}</strong>
                  </div>
                  <div className="p-3 bg-[#0a0f1d] border border-slate-900 rounded-xl">
                    <span className="text-slate-500 text-[10px] block">{language === 'ar' ? 'حجم المبيعات' : 'Sales Volume'}</span>
                    <strong className="text-emerald-400 text-sm mt-1 block font-bold">{formatNum(seller.totalSales)}{currencySuffix}</strong>
                  </div>
                </div>

                {/* Allowed prices */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2.5">
                    {language === 'ar' ? 'الباقات المتاح بيعها والحد الأدنى للأسعار' : 'Allowed Packages & Min Prices'}
                  </h4>
                  {seller.allowedPrices.length === 0 ? (
                    <p className="text-[10px] text-red-400 bg-red-500/5 border border-red-500/10 p-2 rounded-lg">
                      {language === 'ar' ? '⚠️ هذا الموزع لا يملك صلاحية لبيع أي باقة حالياً.' : '⚠️ This seller has no authorization to sell any plan currently.'}
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto pr-1">
                      {seller.allowedPrices.map((plan, idx) => (
                        <span key={idx} className="text-[10px] font-medium bg-[#121829] text-indigo-400 border border-slate-800/80 px-2.5 py-1 rounded-lg">
                          {plan.duration}: <strong className="text-emerald-400 font-bold">{plan.price}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: ADD SELLER */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setAddModalOpen(false)} />

          <div className={`w-full max-w-2xl bg-[#0d1322] border border-slate-800 rounded-2xl p-6 z-10 glow-primary ${
            language === 'ar' ? 'text-right' : 'text-left'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-5">
              <h3 className="font-bold text-slate-100 text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                {t('dialogAddSeller')}
              </h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddSeller} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-slate-350 text-xs font-medium mb-1.5">{t('sellerName')} *</label>
                  <div className="relative">
                    <User className={`absolute inset-y-0 ${language === 'ar' ? 'right-3' : 'left-3'} w-4 h-4 top-1/2 -translate-y-1/2 text-slate-500`} />
                    <input
                      type="text"
                      required
                      placeholder={language === 'ar' ? 'الاسم الكامل للموزع' : 'Distributor full name'}
                      className={`w-full bg-[#070b13] border border-slate-850 rounded-xl py-2.5 ${
                        language === 'ar' ? 'pr-9 pl-4' : 'pl-9 pr-4'
                      } text-xs text-slate-200 focus:outline-none focus:border-indigo-500`}
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-slate-355 text-xs font-medium mb-1.5">{t('usernameLabel')} *</label>
                  <div className="relative">
                    <User className={`absolute inset-y-0 ${language === 'ar' ? 'right-3' : 'left-3'} w-4 h-4 top-1/2 -translate-y-1/2 text-slate-500`} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. seller123"
                      className={`w-full bg-[#070b13] border border-slate-850 rounded-xl py-2.5 ${
                        language === 'ar' ? 'pr-9 pl-4 text-ltr text-right' : 'pl-9 pr-4 text-ltr text-left'
                      } text-xs text-slate-200 focus:outline-none focus:border-indigo-500`}
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Password */}
                <div>
                  <label className="block text-slate-350 text-xs font-medium mb-1.5">{t('passwordLabel')} *</label>
                  <div className="relative">
                    <Lock className={`absolute inset-y-0 ${language === 'ar' ? 'right-3' : 'left-3'} w-4 h-4 top-1/2 -translate-y-1/2 text-slate-500`} />
                    <input
                      type="password"
                      required
                      placeholder={language === 'ar' ? 'كلمة مرور الدخول' : 'Access password'}
                      className={`w-full bg-[#070b13] border border-slate-855 rounded-xl py-2.5 ${
                        language === 'ar' ? 'pr-9 pl-4' : 'pl-9 pr-4'
                      } text-xs text-slate-200 focus:outline-none focus:border-indigo-500`}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-slate-350 text-xs font-medium mb-1.5">{t('sellerPhone')}</label>
                  <div className="relative">
                    <Phone className={`absolute inset-y-0 ${language === 'ar' ? 'right-3' : 'left-3'} w-4 h-4 top-1/2 -translate-y-1/2 text-slate-500`} />
                    <input
                      type="text"
                      placeholder="e.g. +966500000000"
                      className={`w-full bg-[#070b13] border border-slate-850 rounded-xl py-2.5 ${
                        language === 'ar' ? 'pr-9 pl-4 text-ltr text-right' : 'pl-9 pr-4 text-ltr text-left'
                      } text-xs text-slate-200 focus:outline-none focus:border-indigo-500`}
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Set Allowed Prices and Plans */}
              <div className="pt-2 border-t border-slate-900">
                <label className="block text-slate-300 text-xs font-semibold mb-3">
                  {language === 'ar' ? 'تحديد باقات البيع المصرحة وتعديل أسعارها الدنيا (اختياري)' : 'Authorized plans & custom min prices (Optional)'}
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-1">
                  {activePlans.map((plan: any) => {
                    const priceItem = newAllowedPrices.find(p => p.duration === plan.duration);
                    const isChecked = !!priceItem;
                    return (
                      <div
                        key={plan.duration}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                          isChecked 
                            ? 'bg-indigo-500/10 border-indigo-500/40 text-slate-100' 
                            : 'bg-[#070b13] border-slate-850 text-slate-400 hover:border-slate-800'
                        }`}
                      >
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium">
                          <input
                            type="checkbox"
                            className="accent-indigo-500 cursor-pointer"
                            checked={isChecked}
                            onChange={() => handleAddTogglePrice(plan.duration, plan.price || plan.defaultPrice)}
                          />
                          <span>{plan.label || plan.duration}</span>
                        </label>

                        {isChecked && (
                          <div className="flex items-center gap-1.5 max-w-[100px]">
                            <input
                              type="number"
                              min={1}
                              className="w-full bg-[#0d1322] border border-slate-800 rounded-lg py-1 px-2 text-[11px] font-bold text-center focus:outline-none focus:border-indigo-500"
                              value={priceItem.price}
                              onChange={(e) => handleAddPriceChange(plan.duration, parseFloat(e.target.value) || 0)}
                            />
                            <span className="text-[10px] text-slate-500">SAR</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
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
                  {t('saveSeller')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT SELLER */}
      {editModalOpen && selectedSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditModalOpen(false)} />

          <div className={`w-full max-w-2xl bg-[#0d1322] border border-slate-800 rounded-2xl p-6 z-10 glow-primary ${
            language === 'ar' ? 'text-right' : 'text-left'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-5">
              <h3 className="font-bold text-slate-100 text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                {language === 'ar' ? `تعديل صلاحيات وحساب: ${selectedSeller.name}` : `Edit settings & access: ${selectedSeller.name}`}
              </h3>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditSeller} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Edit Name */}
                <div>
                  <label className="block text-slate-350 text-xs font-medium mb-1.5">{t('sellerName')} *</label>
                  <div className="relative">
                    <User className={`absolute inset-y-0 ${language === 'ar' ? 'right-3' : 'left-3'} w-4 h-4 top-1/2 -translate-y-1/2 text-slate-500`} />
                    <input
                      type="text"
                      required
                      className={`w-full bg-[#070b13] border border-slate-850 rounded-xl py-2.5 ${
                        language === 'ar' ? 'pr-9 pl-4' : 'pl-9 pr-4'
                      } text-xs text-slate-200 focus:outline-none focus:border-indigo-500`}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Edit Phone */}
                <div>
                  <label className="block text-slate-350 text-xs font-medium mb-1.5">{t('sellerPhone')}</label>
                  <div className="relative">
                    <Phone className={`absolute inset-y-0 ${language === 'ar' ? 'right-3' : 'left-3'} w-4 h-4 top-1/2 -translate-y-1/2 text-slate-500`} />
                    <input
                      type="text"
                      className={`w-full bg-[#070b13] border border-slate-850 rounded-xl py-2.5 ${
                        language === 'ar' ? 'pr-9 pl-4 text-ltr text-right' : 'pl-9 pr-4 text-ltr text-left'
                      } text-xs text-slate-200 focus:outline-none focus:border-indigo-500`}
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Reset Password */}
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1.5">
                    {language === 'ar' ? 'تغيير كلمة المرور (اتركه فارغاً لعدم التعديل)' : 'Change password (leave blank to keep current)'}
                  </label>
                  <div className="relative">
                    <Lock className={`absolute inset-y-0 ${language === 'ar' ? 'right-3' : 'left-3'} w-4 h-4 top-1/2 -translate-y-1/2 text-slate-500`} />
                    <input
                      type="password"
                      placeholder={language === 'ar' ? 'كلمة مرور جديدة' : 'New password'}
                      className={`w-full bg-[#070b13] border border-slate-855 rounded-xl py-2.5 ${
                        language === 'ar' ? 'pr-9 pl-4' : 'pl-9 pr-4'
                      } text-xs text-slate-200 focus:outline-none focus:border-indigo-500`}
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                    />
                  </div>
                </div>

                {/* Edit status */}
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1.5">{t('statusText')}</label>
                  <select
                    className={`w-full bg-[#070b13] border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-slate-350 focus:outline-none focus:border-indigo-500 cursor-pointer ${
                      language === 'ar' ? 'text-right' : 'text-left'
                    }`}
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                  >
                    <option value="ACTIVE">{t('statusActive')}</option>
                    <option value="INACTIVE">{t('statusDisabled')}</option>
                  </select>
                </div>
              </div>

              {/* Set Allowed Prices and Plans */}
              <div className="pt-2 border-t border-slate-900">
                <label className="block text-slate-300 text-xs font-semibold mb-3">
                  {language === 'ar' ? 'تعديل الباقات المتاح بيعها والأسعار الخاصة' : 'Edit Authorized Plans & Custom Prices'}
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-1">
                  {activePlans.map((plan: any) => {
                    const priceItem = editAllowedPrices.find(p => p.duration === plan.duration);
                    const isChecked = !!priceItem;
                    return (
                      <div
                        key={plan.duration}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                          isChecked 
                            ? 'bg-indigo-500/10 border-indigo-500/40 text-slate-100' 
                            : 'bg-[#070b13] border-slate-850 text-slate-400 hover:border-slate-800'
                        }`}
                      >
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium">
                          <input
                            type="checkbox"
                            className="accent-indigo-500 cursor-pointer"
                            checked={isChecked}
                            onChange={() => handleEditTogglePrice(plan.duration, plan.price || plan.defaultPrice)}
                          />
                          <span>{plan.label || plan.duration}</span>
                        </label>

                        {isChecked && (
                          <div className="flex items-center gap-1.5 max-w-[100px]">
                            <input
                              type="number"
                              min={1}
                              className="w-full bg-[#0d1322] border border-slate-800 rounded-lg py-1 px-2 text-[11px] font-bold text-center focus:outline-none focus:border-indigo-500"
                              value={priceItem.price}
                              onChange={(e) => handleEditPriceChange(plan.duration, parseFloat(e.target.value) || 0)}
                            />
                            <span className="text-[10px] text-slate-500">SAR</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
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
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 px-5 rounded-xl transition cursor-pointer"
                >
                  {language === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
