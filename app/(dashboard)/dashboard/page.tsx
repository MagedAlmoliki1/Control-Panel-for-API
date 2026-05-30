// app/(dashboard)/dashboard/page.tsx

import React from 'react';
import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  Users,
  DollarSign,
  AlertTriangle,
  BadgeAlert,
  ShoppingBag,
  TrendingUp,
  UserCheck,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import WeeklySalesChart from '@/app/components/WeeklySalesChart';

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const now = new Date();

  // 1. Metric Isolation Filters
  const sellerFilter = user.role === 'SELLER' ? { sellerId: user.id } : {};

  // Active Customers Count
  const activeCount = await prisma.customer.count({
    where: { status: 'ACTIVE', ...sellerFilter },
  });

  // Expired Customers Count
  const expiredCount = await prisma.customer.count({
    where: { status: { in: ['EXPIRED', 'SUSPENDED'] }, ...sellerFilter },
  });

  // Start of today & Start of month dates
  const startOfToday = new Date(now.setHours(0, 0, 0, 0));
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Today's Sales Revenue
  const salesTodayRes = await prisma.sale.aggregate({
    _sum: { amount: true },
    where: {
      createdAt: { gte: startOfToday },
      ...sellerFilter,
    },
  });
  const salesToday = salesTodayRes._sum.amount || 0;

  // Monthly Sales Revenue
  const salesMonthRes = await prisma.sale.aggregate({
    _sum: { amount: true },
    where: {
      createdAt: { gte: startOfMonth },
      ...sellerFilter,
    },
  });
  const salesMonth = salesMonthRes._sum.amount || 0;

  // 2. Upcoming Expirations Alert (within 3 days)
  const expiringSoon = await prisma.customer.findMany({
    where: {
      status: 'ACTIVE',
      endSubscription: {
        gt: new Date(),
        lt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // next 3 days
      },
      ...sellerFilter,
    },
    include: {
      seller: { select: { name: true } },
    },
    orderBy: { endSubscription: 'asc' },
    take: 5,
  });

  // 3. Last 10 Recent Sales Operations
  const recentSales = await prisma.sale.findMany({
    where: sellerFilter,
    include: {
      customer: { select: { name: true, username: true } },
      seller: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  // 4. Calculate Weekly Revenue data for the Recharts Bar Chart
  const weeklyData = [];
  const weekdaysFormatter = new Intl.DateTimeFormat('ar-SA', { weekday: 'short' });

  for (let i = 6; i >= 0; i--) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - i);
    const dayStart = new Date(targetDate.setHours(0, 0, 0, 0));
    const dayEnd = new Date(targetDate.setHours(23, 59, 59, 999));

    const daySalesRes = await prisma.sale.aggregate({
      _sum: { amount: true },
      where: {
        createdAt: { gte: dayStart, lte: dayEnd },
        ...sellerFilter,
      },
    });

    weeklyData.push({
      day: weekdaysFormatter.format(dayStart),
      revenue: daySalesRes._sum.amount || 0,
    });
  }

  // 5. Active Sellers Summary Stats (Admin Only)
  let sellersList: any[] = [];
  if (user.role === 'ADMIN') {
    const sellers = await prisma.user.findMany({
      where: { role: 'SELLER' },
      include: {
        _count: {
          select: {
            customers: { where: { status: 'ACTIVE' } },
            sales: true,
          },
        },
      },
    });

    sellersList = await Promise.all(
      sellers.map(async (s) => {
        const sumSales = await prisma.sale.aggregate({
          _sum: { amount: true },
          where: { sellerId: s.id },
        });
        return {
          id: s.id,
          name: s.name,
          username: s.username,
          activeCustomers: s._count.customers,
          totalSalesAmount: sumSales._sum.amount || 0,
          status: s.status,
        };
      })
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-100">نظرة عامة على النظام</h2>
        <p className="text-slate-400 text-xs mt-0.5">لوحة التحكم الرئيسية وتحليل المبيعات الحالية</p>
      </div>

      {/* Summary metrics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Active customers */}
        <div className="glass-panel p-6 rounded-2xl glow-primary border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-semibold">المشتركين النشطين</span>
            <h3 className="text-2xl font-bold text-slate-100 mt-2">{activeCount.toLocaleString('ar-SA')}</h3>
            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-0.5 mt-1">
              <TrendingUp className="w-3.5 h-3.5" /> باقات نشطة حالياً
            </span>
          </div>
          <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Expired Subscriptions */}
        <div className="glass-panel p-6 rounded-2xl border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-semibold">الاشتراكات المنتهية</span>
            <h3 className="text-2xl font-bold text-slate-100 mt-2">{expiredCount.toLocaleString('ar-SA')}</h3>
            <span className="text-[10px] text-red-400 font-medium flex items-center gap-0.5 mt-1">
              <Clock className="w-3.5 h-3.5" /> بحاجة للتجديد أو المتابعة
            </span>
          </div>
          <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-400">
            <BadgeAlert className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Today's Revenue */}
        <div className="glass-panel p-6 rounded-2xl border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-semibold">مبيعات اليوم</span>
            <h3 className="text-2xl font-bold text-slate-100 mt-2">
              {salesToday.toLocaleString('ar-SA')} <span className="text-xs font-normal text-slate-400">ر.س</span>
            </h3>
            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-0.5 mt-1">
              <TrendingUp className="w-3.5 h-3.5" /> اليوم الحالي
            </span>
          </div>
          <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4: This Month's Revenue */}
        <div className="glass-panel p-6 rounded-2xl border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-semibold">مبيعات الشهر الحالي</span>
            <h3 className="text-2xl font-bold text-slate-100 mt-2">
              {salesMonth.toLocaleString('ar-SA')} <span className="text-xs font-normal text-slate-400">ر.س</span>
            </h3>
            <span className="text-[10px] text-indigo-400 font-medium flex items-center gap-0.5 mt-1">
              <ShoppingBag className="w-3.5 h-3.5" /> إجمالي صفقات الشهر
            </span>
          </div>
          <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid: Charts and Expiry Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly sales chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border-slate-800/80">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-100">تحليلات المبيعات اليومية</h3>
              <p className="text-slate-400 text-[10px]">مخطط الإيرادات لآخر 7 أيام عمل</p>
            </div>
            <span className="text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1">
              أسبوعي
            </span>
          </div>
          <WeeklySalesChart data={weeklyData} />
        </div>

        {/* Subscription Expiring Alerts */}
        <div className="glass-panel p-6 rounded-2xl border-slate-800/80">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-100 text-amber-500 flex items-center gap-1.5">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
                اشتراكات تنتهي قريباً
              </h3>
              <p className="text-slate-400 text-[10px]">المشتركين المتبقي لهم أقل من 3 أيام</p>
            </div>
          </div>

          {expiringSoon.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center text-slate-500 border border-dashed border-slate-800 rounded-xl p-4">
              <AlertTriangle className="w-8 h-8 opacity-20 mb-2" />
              <p className="text-xs">لا يوجد اشتراكات قاربت على الانتهاء حالياً</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
              {expiringSoon.map((cust) => {
                const diffTime = new Date(cust.endSubscription).getTime() - Date.now();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return (
                  <div
                    key={cust.id}
                    className="p-3.5 bg-[#0a0f1d] border border-slate-900 rounded-xl hover:border-amber-500/20 transition flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-semibold text-slate-200 text-xs">{cust.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-1">
                        المعرف: {cust.username} | {cust.seller.name}
                      </p>
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-md">
                        متبقي {diffDays} يوم
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Grid: Recent operations & Seller performance (Admin) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent operations */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border-slate-800/80">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-100">آخر العمليات والتفعيلات</h3>
              <p className="text-slate-400 text-[10px]">آخر 10 مبيعات تم تسجيلها بنجاح</p>
            </div>
            <Link
              href="/sales"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              عرض الكل <ArrowUpRight className="w-4.5 h-4.5" />
            </Link>
          </div>

          {recentSales.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
              لا يوجد عمليات مبيعات مسجلة بعد
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-semibold">المشترك</th>
                    <th className="pb-3 font-semibold">الموزع</th>
                    <th className="pb-3 font-semibold text-center">المدة</th>
                    <th className="pb-3 font-semibold text-center">المبلغ</th>
                    <th className="pb-3 font-semibold text-left">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((sale) => (
                    <tr key={sale.id} className="border-b border-slate-900/60 hover:bg-slate-800/10">
                      <td className="py-3 text-slate-200 font-medium">
                        {sale.customer ? sale.customer.name : 'عميل محذوف'}
                        <span className="block text-[10px] text-slate-500">@{sale.customer?.username || 'N/A'}</span>
                      </td>
                      <td className="py-3 text-slate-400">{sale.seller.name}</td>
                      <td className="py-3 text-center">
                        <span className="bg-[#121829] text-indigo-400 border border-slate-800/80 px-2 py-0.5 rounded text-[10px]">
                          {sale.duration}
                        </span>
                      </td>
                      <td className="py-3 text-center text-emerald-400 font-bold">
                        {sale.amount.toLocaleString('ar-SA')} ر.س
                      </td>
                      <td className="py-3 text-left text-slate-500">
                        {new Date(sale.createdAt).toLocaleDateString('ar-SA')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sellers performance summary (Admin only) */}
        {user.role === 'ADMIN' && (
          <div className="glass-panel p-6 rounded-2xl border-slate-800/80">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-100">أداء الموزعين</h3>
                <p className="text-slate-400 text-[10px]">ترتيب ونشاط الموزعين المعتمدين</p>
              </div>
              <UserCheck className="w-5 h-5 text-indigo-400" />
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {sellersList.map((seller) => (
                <div key={seller.id} className="p-3.5 bg-[#0a0f1d] border border-slate-900 rounded-xl hover:border-slate-800 transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                        {seller.name}
                        <span className={`w-2 h-2 rounded-full ${seller.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">@{seller.username}</p>
                    </div>
                    <div className="text-left">
                      <span className="block text-xs font-bold text-emerald-400">
                        {seller.totalSalesAmount.toLocaleString('ar-SA')} ر.س
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        {seller.activeCustomers} عميل نشط
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
