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

  // Predefined default durations (acts as initial fallback)
  const [defaultDurations, setDefaultDurations] = useState([
    { label: 'ساعتين', value: '2 hours', defaultPrice: 5 },
    { label: 'يوم واحد', value: '1 day', defaultPrice: 15 },
    { label: '3 أيام', value: '3 days', defaultPrice: 30 },
    { label: 'أسبوع واحد', value: '1 week', defaultPrice: 60 },
    { label: 'شهر واحد', value: '1 month', defaultPrice: 150 },
    { label: '3 أشهر', value: '3 months', defaultPrice: 400 },
    { label: '6 أشهر', value: '6 months', defaultPrice: 700 },
    { label: 'سنة واحدة', value: '1 year', defaultPrice: 1200 },
  ]);

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sellers');
      if (!res.ok) throw new Error('فشل تحميل بيانات الموزعين');
      const data = await res.json();
      setSellers(data);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع');
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
          const mapped = data.pricePlans.map((p: any) => ({
            label: p.label,
            value: p.duration,
            defaultPrice: p.price
          }));
          setDefaultDurations(mapped);
        }
      }
    } catch (e) {
      console.warn('Could not load dynamic price plans, using fallbacks:', e);
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

  // 1. Add Seller Allowed Price Toggle Helper
  const handleToggleDuration = (duration: string, defaultPrice: number, isEdit = false) => {
    const list = isEdit ? editAllowedPrices : newAllowedPrices;
    const setList = isEdit ? setEditAllowedPrices : setNewAllowedPrices;

    const existing = list.find((p) => p.duration === duration);
    if (existing) {
      setList(list.filter((p) => p.duration !== duration));
    } else {
      setList([...list, { duration, price: defaultPrice, currency: 'SAR' }]);
    }
  };

  const handlePriceChange = (duration: string, price: number, isEdit = false) => {
    const list = isEdit ? editAllowedPrices : newAllowedPrices;
    const setList = isEdit ? setEditAllowedPrices : setNewAllowedPrices;

    setList(
      list.map((p) => (p.duration === duration ? { ...p, price } : p))
    );
  };

  // 2. Submit Add Seller
  const handleAddSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/sellers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          username: newUsername,
          password: newPassword,
          phone: newPhone,
          allowedPrices: newAllowedPrices,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إضافة الموزع');

      setAddModalOpen(false);
      triggerSuccess('تمت إضافة الموزع وتعيين تسعيرة الباقات المخصصة بنجاح!');
      // Reset
      setNewName('');
      setNewUsername('');
      setNewPassword('');
      setNewPhone('');
      setNewAllowedPrices([]);
      fetchSellers();
    } catch (err: any) {
      triggerError(err.message || 'فشل التسجيل');
    } finally {
      setLoading(false);
    }
  };

  // 3. Quick Toggle Seller Status (Enable/Disable)
  const handleToggleStatus = async (seller: Seller) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sellers/${seller.id}/toggle`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تعديل الحالة');

      triggerSuccess(`تمت ${data.status === 'ACTIVE' ? 'إعادة تفعيل' : 'تعطيل'} حساب الموزع (${seller.name}) بنجاح.`);
      fetchSellers();
    } catch (err: any) {
      triggerError(err.message || 'فشل التعديل');
    } finally {
      setLoading(false);
    }
  };

  // 4. Submit Edit Seller
  const handleEditSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeller) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/sellers/${selectedSeller.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          status: editStatus,
          allowedPrices: editAllowedPrices,
          password: editPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تعديل البيانات');

      setEditModalOpen(false);
      triggerSuccess('تم تعديل بيانات الموزع وتسعيرات الصلاحيات بنجاح.');
      setEditPassword('');
      fetchSellers();
    } catch (err: any) {
      triggerError(err.message || 'فشل التعديل');
    } finally {
      setLoading(false);
    }
  };

  // 5. Delete Seller permanently
  const handleDeleteSeller = async (seller: Seller) => {
    if (!confirm(`تحذير خطير: هل أنت متأكد من رغبتك في حذف حساب الموزع (${seller.name}) نهائياً؟ سيؤدي هذا لحذف كل سجلات الدفع المرتبطة به.`)) {
      return;
    }
    setLoading(true);

    try {
      const res = await fetch(`/api/sellers/${seller.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'فشل الحذف');
      }

      triggerSuccess('تم حذف الموزع نهائياً من النظام.');
      fetchSellers();
    } catch (err: any) {
      triggerError(err.message || 'فشل الحذف');
    } finally {
      setLoading(false);
    }
  };

  // Total Sellers Metrics
  const totalSellersCount = sellers.length;
  const activeSellersCount = sellers.filter((s) => s.status === 'ACTIVE').length;
  const totalSellerSalesSum = sellers.reduce((acc, curr) => acc + curr.totalSales, 0);

  return (
    <div className="space-y-6">
      {/* Toasts */}
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

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">إدارة حسابات الموزعين المعتمدين</h2>
          <p className="text-slate-400 text-xs mt-0.5">تسجيل الموزعين الفرعيين، تحديد قوائم الأسعار والتحكم بالصلاحيات</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-3 px-5 rounded-xl transition duration-200 glow-primary border border-indigo-500/30 flex items-center gap-2 cursor-pointer"
        >
          <UserPlus className="w-4.5 h-4.5" />
          <span>تسجيل موزع جديد</span>
        </button>
      </div>

      {/* Sellers Metrics overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Metric 1: Total Sellers */}
        <div className="glass-panel p-5 rounded-2xl border-slate-800/80">
          <span className="text-slate-400 text-xs font-semibold">إجمالي الموزعين</span>
          <h3 className="text-2xl font-bold text-slate-100 mt-2">{totalSellersCount}</h3>
          <span className="text-[10px] text-slate-500 mt-1.5 block">إجمالي الحسابات المسجلة</span>
        </div>

        {/* Metric 2: Active Sellers */}
        <div className="glass-panel p-5 rounded-2xl border-slate-800/80">
          <span className="text-slate-400 text-xs font-semibold">الموزعين النشطين</span>
          <h3 className="text-2xl font-bold text-slate-100 mt-2 text-emerald-400">{activeSellersCount}</h3>
          <span className="text-[10px] text-emerald-400/90 mt-1.5 block">حسابات مسموح لها بالتفعيل والبيع</span>
        </div>

        {/* Metric 3: Total Sales Revenue */}
        <div className="glass-panel p-5 rounded-2xl border-slate-800/80">
          <span className="text-slate-400 text-xs font-semibold">مجموع مبيعات الموزعين</span>
          <h3 className="text-2xl font-bold text-indigo-400 mt-2">
            {totalSellerSalesSum.toLocaleString('ar-SA')} <span className="text-xs font-normal text-slate-400">ر.س</span>
          </h3>
          <span className="text-[10px] text-indigo-400/90 mt-1.5 block">إجمالي الأرباح المستلمة من الفرعيين</span>
        </div>
      </div>

      {/* Sellers Table grid */}
      <div className="glass-panel rounded-2xl border-slate-800/80 overflow-hidden">
        {loading && sellers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <span className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin inline-block mb-3" />
            <p>جاري تحميل قائمة الموزعين والأسعار المسموحة...</p>
          </div>
        ) : sellers.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-xs m-4 border border-dashed border-slate-800 rounded-2xl">
            لم يتم تسجيل أي موزع فرعي بعد. يمكنك إضافة أول موزع الآن!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/10 text-slate-400">
                  <th className="p-4 font-semibold">اسم الموزع</th>
                  <th className="p-4 font-semibold">رقم الهاتف</th>
                  <th className="p-4 font-semibold text-center">العملاء النشطين</th>
                  <th className="p-4 font-semibold text-center">إجمالي المبيعات</th>
                  <th className="p-4 font-semibold">باقات الصلاحية المصرحة</th>
                  <th className="p-4 font-semibold text-center">حالة الحساب</th>
                  <th className="p-4 font-semibold text-left">العمليات</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((s) => (
                  <tr key={s.id} className="border-b border-slate-900/40 hover:bg-slate-800/10 transition">
                    <td className="p-4 font-medium text-slate-100">
                      <div className="font-semibold text-sm">{s.name}</div>
                      <div className="text-[10px] text-slate-500 mt-1">@{s.username}</div>
                    </td>
                    <td className="p-4 text-slate-400">{s.phone || '-'}</td>
                    <td className="p-4 text-center font-bold text-slate-300">
                      {s.activeCustomersCount}
                    </td>
                    <td className="p-4 text-center text-emerald-400 font-bold">
                      {s.totalSales.toLocaleString('ar-SA')} ر.س
                    </td>
                    <td className="p-4 max-w-[200px]">
                      <div className="flex flex-wrap gap-1">
                        {s.allowedPrices.length === 0 ? (
                          <span className="text-[9px] text-red-400 bg-red-500/10 border border-red-500/25 px-1.5 py-0.5 rounded">
                            لا يوجد صلاحيات بيع
                          </span>
                        ) : (
                          s.allowedPrices.map((p, idx) => (
                            <span key={idx} className="bg-[#121829] text-indigo-400 border border-slate-800 px-1.5 py-0.5 rounded text-[9px]">
                              {p.duration}: {p.price} ر.س
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(s)}
                        className={`inline-flex items-center gap-1.5 py-1 px-3 rounded-full font-bold border text-[10px] cursor-pointer transition ${
                          s.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                            : 'bg-red-500/10 text-red-400 border-red-500/25 hover:bg-red-500/20'
                        }`}
                      >
                        {s.status === 'ACTIVE' ? 'نشط ومفعل' : 'معطل ومحظور'}
                      </button>
                    </td>
                    <td className="p-4 text-left">
                      <div className="inline-flex items-center gap-2" dir="ltr">
                        {/* Edit details popup trigger */}
                        <button
                          onClick={() => {
                            setSelectedSeller(s);
                            setEditName(s.name);
                            setEditPhone(s.phone || '');
                            setEditStatus(s.status);
                            setEditAllowedPrices(s.allowedPrices);
                            setEditModalOpen(true);
                          }}
                          className="p-2 bg-[#121829] hover:bg-[#182035] text-slate-400 hover:text-indigo-400 border border-slate-800 rounded-lg transition cursor-pointer"
                          title="تعديل التسعيرة والصلاحيات"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        {/* Delete permanently */}
                        <button
                          onClick={() => handleDeleteSeller(s)}
                          className="p-2 bg-red-500/5 hover:bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg transition cursor-pointer"
                          title="حذف الموزع"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD SELLER */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setAddModalOpen(false)} />

          <div className="w-full max-w-2xl bg-[#0d1322] border border-slate-800 rounded-2xl p-6 md:p-8 z-10 overflow-y-auto max-h-[90vh] glow-primary text-right">
            <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-6">
              <h3 className="font-bold text-slate-100 text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                تسجيل موزع فرعي جديد وتعيين صلاحياته
              </h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddSeller} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full name */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">الاسم الكامل للموزع</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أحمد صالح العتيبي"
                    className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 text-right"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">اسم المستخدم للدخول (بالإنكليزية)</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: ahmad_seller"
                    className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 text-right text-ltr"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Password */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">كلمة المرور للدخول</label>
                  <input
                    type="password"
                    required
                    placeholder="أدخل كلمة مرور قوية"
                    className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 text-right"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">رقم الهاتف (اختياري)</label>
                  <input
                    type="text"
                    placeholder="مثال: +966500000000"
                    className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 text-right text-ltr"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Price plan checklist manager */}
              <div className="border-t border-slate-900 pt-4 mt-6">
                <h4 className="font-semibold text-slate-200 text-sm mb-3">تخصيص الباقات المسموحة وأدنى سعر بيع (ر.س)</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
                  {defaultDurations.map((d) => {
                    const isSelected = newAllowedPrices.some((p) => p.duration === d.value);
                    const activePrice = newAllowedPrices.find((p) => p.duration === d.value)?.price || d.defaultPrice;
                    return (
                      <div
                        key={d.value}
                        className={`p-3 bg-[#070b13] border rounded-xl flex items-center justify-between transition ${
                          isSelected ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-slate-850'
                        }`}
                      >
                        <label className="flex items-center gap-2.5 cursor-pointer select-none text-slate-300">
                          <input
                            type="checkbox"
                            className="accent-indigo-500"
                            checked={isSelected}
                            onChange={() => handleToggleDuration(d.value, d.defaultPrice)}
                          />
                          <span className="text-xs font-semibold">{d.label} ({d.value})</span>
                        </label>
                        {isSelected && (
                          <div className="flex items-center gap-1.5 w-24">
                            <input
                              type="number"
                              min={0}
                              className="w-full bg-[#0d1322] border border-slate-800 rounded py-1 px-2 text-[11px] text-center text-emerald-400 font-bold"
                              value={activePrice}
                              onChange={(e) => handlePriceChange(d.value, parseFloat(e.target.value) || 0)}
                            />
                            <span className="text-[10px] text-slate-500">ر.س</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-900 flex items-center justify-end gap-3" dir="ltr">
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
                  <span>تأكيد وتسجيل حساب الموزع</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT SELLER & PRICES */}
      {editModalOpen && selectedSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditModalOpen(false)} />

          <div className="w-full max-w-2xl bg-[#0d1322] border border-slate-800 rounded-2xl p-6 md:p-8 z-10 overflow-y-auto max-h-[90vh] glow-primary text-right">
            <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-6">
              <h3 className="font-bold text-slate-100 text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                تعديل صلاحيات وتسعيرة الموزع: {selectedSeller.name}
              </h3>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditSeller} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full name */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">اسم الموزع الكامل</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 text-right"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">رقم الهاتف</label>
                  <input
                    type="text"
                    className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 text-right text-ltr"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Password reset optional */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">تغيير كلمة المرور (اختياري)</label>
                  <input
                    type="password"
                    placeholder="اتركه فارغاً لعدم التغيير"
                    className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 text-right"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">حالة حساب الموزع</label>
                  <select
                    className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 text-right cursor-pointer"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                  >
                    <option value="ACTIVE">نشط ومفعل</option>
                    <option value="INACTIVE">معطل ومحظور</option>
                  </select>
                </div>
              </div>

              {/* Price plan checklist manager */}
              <div className="border-t border-slate-900 pt-4 mt-6">
                <h4 className="font-semibold text-slate-200 text-sm mb-3">تخصيص الباقات المسموحة وأدنى سعر بيع (ر.س)</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
                  {defaultDurations.map((d) => {
                    const isSelected = editAllowedPrices.some((p) => p.duration === d.value);
                    const activePrice = editAllowedPrices.find((p) => p.duration === d.value)?.price || d.defaultPrice;
                    return (
                      <div
                        key={d.value}
                        className={`p-3 bg-[#070b13] border rounded-xl flex items-center justify-between transition ${
                          isSelected ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-slate-850'
                        }`}
                      >
                        <label className="flex items-center gap-2.5 cursor-pointer select-none text-slate-300">
                          <input
                            type="checkbox"
                            className="accent-indigo-500"
                            checked={isSelected}
                            onChange={() => handleToggleDuration(d.value, d.defaultPrice, true)}
                          />
                          <span className="text-xs font-semibold">{d.label} ({d.value})</span>
                        </label>
                        {isSelected && (
                          <div className="flex items-center gap-1.5 w-24">
                            <input
                              type="number"
                              min={0}
                              className="w-full bg-[#0d1322] border border-slate-800 rounded py-1 px-2 text-[11px] text-center text-emerald-400 font-bold"
                              value={activePrice}
                              onChange={(e) => handlePriceChange(d.value, parseFloat(e.target.value) || 0, true)}
                            />
                            <span className="text-[10px] text-slate-500">ر.س</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-900 flex items-center justify-end gap-3" dir="ltr">
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
                  تحديث الحساب والصلاحيات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
