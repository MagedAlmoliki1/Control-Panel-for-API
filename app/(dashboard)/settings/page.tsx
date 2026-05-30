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
import { useLanguage } from '@/lib/LanguageContext';

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

  const { language, t } = useLanguage();

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
      if (!res.ok) throw new Error(language === 'ar' ? 'فشل جلب إعدادات النظام' : 'Failed to fetch system settings');
      const data = await res.json();
      
      setBaseUrl(data.api.baseUrl);
      setApiKey(data.api.apiKey);
      setTimeoutVal(data.api.timeout);
      setProviderType(data.api.providerType);
      setExpiryThresholdDays(data.expiryThresholdDays);
      setPricePlans(data.pricePlans || []);
    } catch (err: any) {
      triggerError(err.message || (language === 'ar' ? 'فشل تحميل الإعدادات' : 'Failed to load settings'));
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
      if (!res.ok) throw new Error(data.error || (language === 'ar' ? 'فشل حفظ التعديلات' : 'Failed to save changes'));

      triggerSuccess(
        language === 'ar' 
          ? 'تم حفظ إعدادات النظام وتعديلات خوادم الربط بنجاح!' 
          : 'System settings and API connections saved successfully!'
      );
      fetchSettings();
    } catch (err: any) {
      triggerError(err.message || (language === 'ar' ? 'فشل الحفظ' : 'Failed to save'));
    } finally {
      setSubmitting(false);
    }
  };

  // Pricing Plan CRUD: Add
  const handleAddPricePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel || !newDuration || newPrice <= 0) {
      triggerError(
        language === 'ar' 
          ? 'يرجى ملء جميع حقول الباقة وتحديد سعر أكبر من الصفر' 
          : 'Please fill all plan fields and select a price greater than zero'
      );
      return;
    }

    // Check if duration exists
    if (pricePlans.some(p => p.duration.toLowerCase() === newDuration.toLowerCase())) {
      triggerError(language === 'ar' ? 'هذه المدة أو الباقة مسجلة بالفعل' : 'This duration or package is already registered');
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
    triggerSuccess(
      language === 'ar' 
        ? 'تمت إضافة الباقة مؤقتاً. يرجى الضغط على زر حفظ لحفظها نهائياً.' 
        : 'Package added temporarily. Please click Save Settings to save permanently.'
    );
  };

  // Pricing Plan CRUD: Delete
  const handleDeletePricePlan = (duration: string) => {
    const updatedPlans = pricePlans.filter(p => p.duration !== duration);
    setPricePlans(updatedPlans);
    triggerSuccess(
      language === 'ar' 
        ? 'تمت إزالة الباقة مؤقتاً. يرجى الضغط على زر حفظ لحفظ التغييرات.' 
        : 'Package removed temporarily. Please click Save Settings to save changes.'
    );
  };

  // Submit Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      triggerError(
        language === 'ar' 
          ? 'كلمة المرور الجديدة غير متطابقة مع التأكيد' 
          : 'New password does not match confirmation'
      );
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
      if (!res.ok) throw new Error(data.error || (language === 'ar' ? 'فشل تعديل كلمة المرور' : 'Failed to change password'));

      triggerSuccess(
        language === 'ar' 
          ? 'تم تحديث كلمة المرور لمدير النظام بنجاح!' 
          : 'Administrator password updated successfully!'
      );
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      triggerError(err.message || (language === 'ar' ? 'فشل تعديل الحساب' : 'Failed to update account'));
    } finally {
      setSubmitting(false);
    }
  };

  const currencySuffix = language === 'ar' ? ' ر.س' : ' SAR';

  return (
    <div className={`space-y-6 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
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
          <span>{language === 'ar' ? 'إعدادات النظام الفنية (أدمن فقط)' : 'System Settings (Admin Only)'}</span>
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          {language === 'ar' 
            ? 'تعديل معاملات الربط البرمجي للـ API، قائمة أسعار الباقات الموحدة وحماية حساب الإدارة' 
            : 'Configure API integrations, unified packages pricing lists, and admin authentication security'}
        </p>
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
          {language === 'ar' ? 'إعدادات الربط والـ API' : 'Connection & API Settings'}
        </button>
        <button
          onClick={() => setActiveTab('prices')}
          className={`pb-3.5 px-6 font-semibold text-xs transition duration-200 cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'prices'
              ? 'border-indigo-500 text-slate-100'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          {language === 'ar' ? 'إدارة خطط وباقات الأسعار' : 'Pricing Plans & Packages'}
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3.5 px-6 font-semibold text-xs transition duration-200 cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'security'
              ? 'border-indigo-500 text-slate-100'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          {language === 'ar' ? 'أمان حساب المسؤول' : 'Admin Security'}
        </button>
      </div>

      {loading ? (
        <div className="glass-panel p-16 text-center text-slate-500 text-xs rounded-2xl border-slate-800">
          <span className="w-7 h-7 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin inline-block mb-3" />
          <p>{language === 'ar' ? 'جاري تحميل ملف إعدادات الخادم الفني...' : 'Loading technical server configuration file...'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          
          {/* TAB 1: API SETTINGS */}
          {activeTab === 'api' && (
            <form onSubmit={handleSaveSettings} className="glass-panel p-6 md:p-8 rounded-2xl border-slate-800/80 space-y-6">
              <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2 border-b border-slate-900 pb-3">
                <Server className="w-4.5 h-4.5 text-indigo-400" />
                <span>{t('apiSettingsCard')}</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Provider Type */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">{t('apiProviderMode')}</label>
                  <select
                    className={`w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer ${
                      language === 'ar' ? 'text-right' : 'text-left'
                    }`}
                    value={providerType}
                    onChange={(e) => setProviderType(e.target.value as 'MOCK' | 'REAL')}
                  >
                    <option value="MOCK">{t('mockMode')}</option>
                    <option value="REAL">{t('liveMode')}</option>
                  </select>
                </div>

                {/* Expiry Alert Days */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">
                    {language === 'ar' ? 'تنبيهات اقتراب انتهاء الاشتراك (بالأيام)' : 'Subscription Expiry Alert (Days)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    className={`w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-bold ${
                      language === 'ar' ? 'text-right' : 'text-left'
                    }`}
                    value={expiryThresholdDays}
                    onChange={(e) => setExpiryThresholdDays(parseInt(e.target.value) || 3)}
                  />
                  <span className="text-[10px] text-slate-500 mt-1.5 block">
                    {language === 'ar' 
                      ? 'إظهار إنذار في لوحة التحكم للاشتراكات التي ينتهي تاريخها خلال هذه الأيام.' 
                      : 'Show warning on dashboard for subscriptions expiring within this number of days.'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Base URL */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">{t('apiEndpointUrl')}</label>
                  <input
                    type="url"
                    required
                    placeholder="https://api.partner-software.com/v1"
                    className={`w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 text-ltr ${
                      language === 'ar' ? 'text-right' : 'text-left'
                    }`}
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                  />
                </div>

                {/* Timeout */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">
                    {language === 'ar' ? 'مهلة استجابة الخادم الخارجي (بالثواني)' : 'External Server Timeout (Seconds)'}
                  </label>
                  <div className="relative">
                    <div className={`absolute inset-y-0 ${language === 'ar' ? 'left-0 pl-4' : 'right-0 pr-4'} flex items-center pointer-events-none text-slate-500 text-xs font-semibold`}>
                      {language === 'ar' ? 'ثواني' : 'seconds'}
                    </div>
                    <input
                      type="number"
                      min={1}
                      required
                      className={`w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 pr-4 pl-16 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-bold ${
                        language === 'ar' ? 'text-right' : 'text-left'
                      }`}
                      value={timeout}
                      onChange={(e) => setTimeoutVal(parseInt(e.target.value) || 5)}
                    />
                  </div>
                </div>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-2">{t('apiToken')}</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className={`absolute inset-y-0 ${language === 'ar' ? 'left-0 pl-3.5' : 'right-0 pr-3.5'} flex items-center text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer`}
                  >
                    {showApiKey ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    placeholder={language === 'ar' ? 'أدخل مفتاح ترخيص الخادم' : 'Enter server authorization key'}
                    className={`w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 pr-4 pl-12 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 text-ltr font-mono ${
                      language === 'ar' ? 'text-right' : 'text-left'
                    }`}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1.5 block">
                  {language === 'ar' 
                    ? 'يتم تعتيم المفتاح تلقائياً لحمايته. سيؤدي تركه أو إدخال نقاط التعتيم لحفظ المفتاح القديم المخزن مسبقاً دون تغييره.' 
                    : 'The key is automatically masked for security. Leaving it unchanged will keep the stored value.'}
                </span>
              </div>

              <div className={`pt-4 border-t border-slate-900 flex items-center ${language === 'ar' ? 'justify-end' : 'justify-end'}`}>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-3 px-6 rounded-xl transition duration-200 glow-primary border border-indigo-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{t('saveSettingsBtn')}</span>
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
                  <span>{language === 'ar' ? 'إضافة باقة أسعار وتفعيل جديدة للموزعين' : 'Add New Pricing & Activation Plan'}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  {/* Plan Name */}
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-2">
                      {language === 'ar' ? 'اسم الباقة (مثال: أسبوعين)' : 'Plan Label (e.g. 2 Weeks)'}
                    </label>
                    <input
                      type="text"
                      placeholder={language === 'ar' ? 'مثال: أسبوعين' : 'e.g. 2 Weeks'}
                      className={`w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 ${
                        language === 'ar' ? 'text-right' : 'text-left'
                      }`}
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                    />
                  </div>

                  {/* Plan duration in English */}
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-2">
                      {language === 'ar' ? 'مدة التفعيل (بالإنكليزية للـ API)' : 'Activation Duration (English API)'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2 weeks, 2 years"
                      className={`w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 text-ltr ${
                        language === 'ar' ? 'text-right' : 'text-left'
                      }`}
                      value={newDuration}
                      onChange={(e) => setNewDuration(e.target.value)}
                    />
                  </div>

                  {/* Default price */}
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-2">
                      {language === 'ar' ? 'السعر الافتراضي للموزعين (ر.س)' : 'Default Seller Price (SAR)'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={0}
                        placeholder={language === 'ar' ? 'مثال: 120' : 'e.g. 120'}
                        className={`w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-bold ${
                          language === 'ar' ? 'text-right' : 'text-left'
                        }`}
                        value={newPrice || ''}
                        onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                      />
                      <button
                        type="submit"
                        className="bg-[#1b223c] hover:bg-[#252e50] text-indigo-400 border border-indigo-500/20 text-xs font-bold py-3 px-5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{language === 'ar' ? 'إضافة' : 'Add'}</span>
                      </button>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {language === 'ar' 
                    ? 'يجب تدوين مدة التفعيل باللغة الإنكليزية بالشكل المطابق لمدخلات الـ API (مثل: 2 hours, 1 day, 3 days, 1 week, 1 month, 3 months, 6 months, 1 year).' 
                    : 'The duration value must follow standard API strings (e.g. 2 hours, 1 day, 3 days, 1 week, 1 month, 3 months, 6 months, 1 year).'}
                </span>
              </form>

              {/* Price Plans Table list */}
              <div className="glass-panel rounded-2xl border-slate-800/80 overflow-hidden">
                <div className="p-4 bg-slate-900/10 border-b border-slate-850 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-200 text-sm">
                      {language === 'ar' ? 'خطط الأسعار المسجلة في النظام حالياً' : 'Pricing Plans Registered in System'}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {language === 'ar' 
                        ? 'يمكنك تعديل القائمة وحذف ما لا ترغب به، ثم اضغط حفظ الإعدادات لتطبيق التغيير النهائي.' 
                        : 'Adjust or delete plans here, then click Save changes to save permanently.'}
                    </p>
                  </div>
                  
                  {/* Save button for pricing plans change */}
                  <button
                    onClick={handleSaveSettings}
                    disabled={submitting}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{language === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}</span>
                  </button>
                </div>

                {pricePlans.length === 0 ? (
                  <div className="p-16 text-center text-slate-500 text-xs">
                    {language === 'ar' ? 'قائمة الأسعار فارغة تماماً! الرجاء إضافة باقة واحدة على الأقل.' : 'Price list is completely empty! Please add at least one plan.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className={`w-full text-xs border-collapse ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                      <thead>
                        <tr className="border-b border-slate-850 text-slate-400">
                          <th className="p-4 font-semibold">{language === 'ar' ? 'باقة الاشتراك' : 'Subscription Plan'}</th>
                          <th className="p-4 font-semibold">{language === 'ar' ? 'مدة التفعيل الفنية' : 'Activation Code / Duration'}</th>
                          <th className="p-4 font-semibold">{language === 'ar' ? 'السعر الافتراضي' : 'Default Price'}</th>
                          <th className={`p-4 font-semibold ${language === 'ar' ? 'text-left' : 'text-right'}`}>{language === 'ar' ? 'العمليات' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pricePlans.map((plan, idx) => (
                          <tr key={idx} className="border-b border-slate-900/40 hover:bg-slate-800/10 transition">
                            <td className="p-4 font-semibold text-slate-200">{plan.label}</td>
                            <td className="p-4 text-slate-400 font-mono">{plan.duration}</td>
                            <td className="p-4 font-bold text-emerald-400">{plan.price}{currencySuffix}</td>
                            <td className={`p-4 ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                              <button
                                onClick={() => handleDeletePricePlan(plan.duration)}
                                className="p-2 bg-red-500/5 hover:bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg transition cursor-pointer"
                                title={language === 'ar' ? 'حذف الباقة' : 'Delete Plan'}
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
                <span>{language === 'ar' ? 'تحديث معلومات حماية المسؤول (تغيير كلمة المرور)' : 'Update Admin Credentials (Change Password)'}</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Old Password */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">{t('currentPassword')}</label>
                  <div className="relative">
                    <Lock className={`absolute inset-y-0 ${language === 'ar' ? 'right-3.5' : 'left-3.5'} w-4 h-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none`} />
                    <input
                      type="password"
                      required
                      placeholder={language === 'ar' ? 'أدخل كلمة المرور الحالية' : 'Enter current password'}
                      className={`w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 ${
                        language === 'ar' ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'
                      } text-xs text-slate-200 focus:outline-none focus:border-indigo-500`}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                    />
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">{t('newPassword')}</label>
                  <div className="relative">
                    <Lock className={`absolute inset-y-0 ${language === 'ar' ? 'right-3.5' : 'left-3.5'} w-4 h-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none`} />
                    <input
                      type="password"
                      required
                      placeholder={language === 'ar' ? 'كلمة مرور جديدة' : 'New password'}
                      className={`w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 ${
                        language === 'ar' ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'
                      } text-xs text-slate-200 focus:outline-none focus:border-indigo-500`}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">{t('confirmNewPassword')}</label>
                  <div className="relative">
                    <Lock className={`absolute inset-y-0 ${language === 'ar' ? 'right-3.5' : 'left-3.5'} w-4 h-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none`} />
                    <input
                      type="password"
                      required
                      placeholder={language === 'ar' ? 'أعد كتابة كلمة المرور' : 'Confirm password'}
                      className={`w-full bg-[#070b13] border border-slate-800 rounded-xl py-3 ${
                        language === 'ar' ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'
                      } text-xs text-slate-200 focus:outline-none focus:border-indigo-500`}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className={`pt-4 border-t border-slate-900 flex items-center ${language === 'ar' ? 'justify-end' : 'justify-end'}`}>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-3 px-6 rounded-xl transition duration-200 glow-primary border border-indigo-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>{t('changePasswordBtn')}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
