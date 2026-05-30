// app/(dashboard)/settings/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Server,
  Key,
  Shield,
  Clock,
  Plus,
  Trash2,
  Lock,
  Save,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Percent,
} from 'lucide-react';

interface PricePlan {
  label: string;
  duration: string;
  price: number;
  currency: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'api' | 'prices' | 'security'>('api');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // API Config Fields
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [timeout, setTimeoutVal] = useState(5);
  const [providerType, setProviderType] = useState<'MOCK' | 'REAL'>('MOCK');

  // Expiry Threshold
  const [expiryThresholdDays, setExpiryThresholdDays] = useState(3);

  // Price Plans List
  const [pricePlans, setPricePlans] = useState<PricePlan[]>([]);
  
  // New Price Plan Fields
  const [newLabel, setNewLabel] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newPrice, setNewPrice] = useState(0);

  // Password Change Fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4500);
  };

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4500);
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('فشل جلب إعدادات النظام');
      const data = await res.json();
      
      setBaseUrl(data.api.baseUrl);
      setApiKey(data.api.apiKey);
      setTimeoutVal(data.api.timeout);
      setProviderType(data.api.providerType);
      setExpiryThresholdDays(data.expiryThresholdDays);
      setPricePlans(data.pricePlans || []);
    } catch (err: any) {
      triggerError(err.message || 'فشل تحميل الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Submit API & General Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api: {
            baseUrl,
            apiKey,
            timeout,
            providerType,
          },
          expiryThresholdDays,
          pricePlans,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل حفظ التعديلات');

      triggerSuccess('تم حفظ إعدادات النظام وتعديلات خوادم الربط بنجاح!');
      fetchSettings();
    } catch (err: any) {
      triggerError(err.message || 'فشل الحفظ');
    } finally {
      setSubmitting(false);
    }
  };

  // Pricing Plan CRUD: Add
  const handleAddPricePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel || !newDuration || newPrice <= 0) {
      triggerError('يرجى ملء جميع حقول الباقة وتحديد سعر أكبر من الصفر');
      return;
    }

    // Check if duration exists
    if (pricePlans.some(p => p.duration.toLowerCase() === newDuration.toLowerCase())) {
      triggerError('هذه المدة أو الباقة مسجلة بالفعل');
      return;
    }

    const updatedPlans = [
      ...pricePlans,
      { label: newLabel, duration: newDuration, price: newPrice, currency: 'SAR' },
    ];
    setPricePlans(updatedPlans);
    
    // Reset inputs
    setNewLabel('');
    setNewDuration('');
    setNewPrice(0);
    triggerSuccess('تمت إضافة الباقة مؤقتاً. يرجى الضغط على زر حفظ لحفظها نهائياً.');
  };

  // Pricing Plan CRUD: Delete
  const handleDeletePricePlan = (duration: string) => {
    const updatedPlans = pricePlans.filter(p => p.duration !== duration);
    setPricePlans(updatedPlans);
    triggerSuccess('تمت إزالة الباقة مؤقتاً. يرجى الضغط على زر حفظ لحفظ التغييرات.');
  };

  // Submit Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      triggerError('كلمة المرور الجديدة غير متطابقة مع التأكيد');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/settings/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تعديل كلمة المرور');

      triggerSuccess('تم تحديث كلمة المرور لمدير النظام بنجاح!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      triggerError(err.message || 'فشل تعديل الحساب');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Toast Alerters */}
      {successMsg && (
        <div className="fixed top-5 left-5 z-50 bg-emerald-500 text-white font-semibold py-3 px-6 rounded-2xl shadow-xl flex items-center gap-3 animate-slide-in">
          <CheckCircle className="w-5 h-5" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="fixed top-5 left-5 z-50 bg-red-500 text-white font-semibold py-3 px-6 rounded-2xl shadow-xl flex items-center gap-3 animate-slide-in">
          <XCircle className="w-5 h-5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Header bar */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <span>إعدادات النظام الفنية (أدمن فقط)</span>
        </h2>
        <p className="text-slate-400 text-xs mt-1">تعديل معاملات الربط البرمجي للـ API، قائمة أسعار الباقات الموحدة وحماية حساب الإدارة</p>
      </div>

      {/* Nav Tabs */}
      <div className="flex border-b border-slate-900 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('api')}
          className={`pb-3.5 px-6 font-semibold text-xs transition duration-200 cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'api'
              ? 'border-indigo-500 text-slate-100'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          إعدادات الربط والـ API
        </button>
        <button
          onClick={() => setActiveTab('prices')}
          className={`pb-3.5 px-6 font-semibold text-xs transition duration-200 cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'prices'
              ? 'border-indigo-500 text-slate-100'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          إدارة خطط وباقات الأسعار
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3.5 px-6 font-semibold text-xs transition duration-200 cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'security'
              ? 'border-indigo-500 text-slate-100'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          أمان حساب المسؤول
        </button>
      </div>

      {loading ? (
        <div className="glass-panel p-16 text-center text-slate-500 text-xs rounded-2xl border-slate-800">
          <span className="w-7 h-7 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin inline-block mb-3" />
          <p>جاري تحميل ملف إعدادات الخادم الفني وتدقيق الصلاحيات الفيدرالية...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          
          {/* TAB 1: API SETTINGS */}
          {activeTab === 'api' && (
            <form onSubmit={handleSaveSettings} className="glass-panel p-6 md:p-8 rounded-2xl border-slate-800/80 space-y-6">
              <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2 border-b border-slate-900 pb-3">
                <Server className="w-4.5 h-4.5 text-indigo-400" />
                <span>إعدادات الاتصال بمزود الاشتراكات الخارجي (API)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Provider Type */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">نوع مزود الخدمة النشط</label>
                  <select
                    className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 text-right cursor-pointer"
                    value={providerType}
                    onChange={(e) => setProviderType(e.target.value as 'MOCK' | 'REAL')}
                  >
                    <option value="MOCK">محاكي اختبار داخلي (Mock System Provider)</option>
                    <option value="REAL">مزود الشريك الفعلي المباشر (Production API Endpoint)</option>
                  </select>
                </div>

                {/* Expiry Alert Days */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">تنبيهات اقتراب انتهاء الاشتراك (بالأيام)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 text-right font-bold"
                    value={expiryThresholdDays}
                    onChange={(e) => setExpiryThresholdDays(parseInt(e.target.value) || 3)}
                  />
                  <span className="text-[10px] text-slate-500 mt-1.5 block">إظهار إنذار في لوحة التحكم للاشتراكات التي ينتهي تاريخها خلال هذه الأيام.</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Base URL */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">رابط الخادم الأساسي (Base URL)</label>
                  <input
                    type="url"
                    required
                    placeholder="https://api.partner-software.com/v1"
                    className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 text-right text-ltr"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                  />
                </div>

                {/* Timeout */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">مهلة استجابة الخادم الخارجي (بالثواني)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 text-xs font-semibold">
                      ثواني
                    </div>
                    <input
                      type="number"
                      min={1}
                      required
                      className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 pr-4 pl-16 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 text-right font-bold"
                      value={timeout}
                      onChange={(e) => setTimeoutVal(parseInt(e.target.value) || 5)}
                    />
                  </div>
                </div>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-2">مفتاح ترخيص الـ API (Access Key)</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
                  >
                    {showApiKey ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="أدخل مفتاح ترخيص الخادم"
                    className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 pr-4 pl-12 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 text-right text-ltr font-mono"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1.5 block">يتم تعتيم المفتاح تلقائياً لحمايته. سيؤدي تركه أو إدخال نقاط التعتيم لحفظ المفتاح القديم المخزن مسبقاً دون تغييره.</span>
              </div>

              <div className="pt-4 border-t border-slate-900 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-3 px-6 rounded-xl transition duration-200 glow-primary border border-indigo-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ إعدادات الخوادم والـ API</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: PRICE PLANS MANAGEMENT */}
          {activeTab === 'prices' && (
            <div className="space-y-6">
              
              {/* Form to Add Price Plan */}
              <form onSubmit={handleAddPricePlan} className="glass-panel p-6 rounded-2xl border-slate-800/80 space-y-4">
                <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2 border-b border-slate-900 pb-3">
                  <Plus className="w-4.5 h-4.5 text-indigo-400" />
                  <span>إضافة باقة أسعار وتفعيل جديدة للموزعين</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  {/* Plan Name in Arabic */}
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-2">اسم الباقة بالعربية</label>
                    <input
                      type="text"
                      placeholder="مثال: أسبوعين"
                      className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 text-right"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                    />
                  </div>

                  {/* Plan duration in English */}
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-2">مدة التفعيل (بالإنكليزية للـ API)</label>
                    <input
                      type="text"
                      placeholder="مثال: 2 weeks, 2 years"
                      className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 text-right text-ltr"
                      value={newDuration}
                      onChange={(e) => setNewDuration(e.target.value)}
                    />
                  </div>

                  {/* Default price in SAR */}
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-2">سعر البيع الافتراضي للموزعين (ر.س)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={0}
                        placeholder="مثال: 120"
                        className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 text-right font-bold"
                        value={newPrice || ''}
                        onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                      />
                      <button
                        type="submit"
                        className="bg-indigo-650 hover:bg-indigo-550 text-white text-xs font-bold py-3 px-5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>إضافة الباقة</span>
                      </button>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">يجب تدوين مدة التفعيل باللغة الإنكليزية بالشكل المطابق لمدخلات الـ API (مثل: 2 hours, 1 day, 3 days, 1 week, 1 month, 3 months, 6 months, 1 year).</span>
              </form>

              {/* Price Plans Table list */}
              <div className="glass-panel rounded-2xl border-slate-800/80 overflow-hidden">
                <div className="p-4 bg-slate-900/10 border-b border-slate-850 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-200 text-sm">خطط الأسعار المسجلة في النظام حالياً</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">يمكنك تعديل القائمة وحذف ما لا ترغب به، ثم اضغط حفظ الإعدادات لتطبيق التغيير النهائي.</p>
                  </div>
                  
                  {/* Save button for pricing plans change */}
                  <button
                    onClick={handleSaveSettings}
                    disabled={submitting}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>حفظ القائمة والتعديلات</span>
                  </button>
                </div>

                {pricePlans.length === 0 ? (
                  <div className="p-16 text-center text-slate-500 text-xs">
                    قائمة الأسعار فارغة تماماً! الرجاء إضافة باقة واحدة على الأقل.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-850 text-slate-400">
                          <th className="p-4 font-semibold">باقة الاشتراك (اسم العرض)</th>
                          <th className="p-4 font-semibold">مدة التفعيل الفنية</th>
                          <th className="p-4 font-semibold">سعر البيع الافتراضي</th>
                          <th className="p-4 font-semibold text-left">العمليات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pricePlans.map((plan, idx) => (
                          <tr key={idx} className="border-b border-slate-900/40 hover:bg-slate-800/10 transition">
                            <td className="p-4 font-semibold text-slate-200">{plan.label}</td>
                            <td className="p-4 text-slate-400 font-mono">{plan.duration}</td>
                            <td className="p-4 font-bold text-emerald-400">{plan.price} ر.س</td>
                            <td className="p-4 text-left">
                              <button
                                onClick={() => handleDeletePricePlan(plan.duration)}
                                className="p-2 bg-red-500/5 hover:bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg transition cursor-pointer"
                                title="حذف الباقة"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ADMIN PASSWORD SECURITY */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="glass-panel p-6 md:p-8 rounded-2xl border-slate-800/80 space-y-6">
              <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2 border-b border-slate-900 pb-3">
                <Shield className="w-4.5 h-4.5 text-indigo-400" />
                <span>تحديث معلومات حماية خادم الإدارة (تغيير كلمة المرور)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Old Password */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">كلمة المرور الحالية</label>
                  <div className="relative">
                    <Lock className="absolute inset-y-0 right-3.5 w-4 h-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      type="password"
                      required
                      placeholder="أدخل كلمة المرور الحالية"
                      className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 pr-10 pl-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 text-right"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                    />
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">كلمة المرور الجديدة</label>
                  <div className="relative">
                    <Lock className="absolute inset-y-0 right-3.5 w-4 h-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      type="password"
                      required
                      placeholder="كلمة مرور قوية (6 رموز على الأقل)"
                      className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 pr-10 pl-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 text-right"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">تأكيد كلمة المرور الجديدة</label>
                  <div className="relative">
                    <Lock className="absolute inset-y-0 right-3.5 w-4 h-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      type="password"
                      required
                      placeholder="أعد كتابة كلمة المرور الجديدة"
                      className="w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 pr-10 pl-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 text-right"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-900 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-3 px-6 rounded-xl transition duration-200 glow-primary border border-indigo-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>تحديث كلمة مرور المسؤول</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
