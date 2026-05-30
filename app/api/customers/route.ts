// app/api/customers/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { provider } from '@/lib/api';

// Helper to calculate expiry date
function getDurationDate(duration: string, startDate = new Date()): Date {
  const date = new Date(startDate);
  switch (duration) {
    case '2 hours':
      date.setHours(date.getHours() + 2);
      break;
    case '1 day':
      date.setDate(date.getDate() + 1);
      break;
    case '3 days':
      date.setDate(date.getDate() + 3);
      break;
    case '1 week':
      date.setDate(date.getDate() + 7);
      break;
    case '1 month':
      date.setMonth(date.getMonth() + 1);
      break;
    case '3 months':
      date.setMonth(date.getMonth() + 3);
      break;
    case '6 months':
      date.setMonth(date.getMonth() + 6);
      break;
    case '1 year':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      date.setMonth(date.getMonth() + 1);
  }
  return date;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const sellerId = searchParams.get('sellerId') || '';

    // Build Prisma query filters
    const where: any = {};

    // Seller isolation constraint
    if (user.role === 'SELLER') {
      where.sellerId = user.id;
    } else if (sellerId) {
      where.sellerId = sellerId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { username: { contains: search } },
        { idBase: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    // Retrieve customers
    const customers = await prisma.customer.findMany({
      where,
      include: {
        seller: {
          select: { id: true, name: true, username: true },
        },
        sales: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Check actual API status for each customer (simulated or real status sync)
    const syncedCustomers = await Promise.all(
      customers.map(async (cust: any) => {
        try {
          const apiStatus = await provider.getUserStatus({ user_id: cust.username });
          // If status out of sync, update DB
          if (apiStatus.status !== cust.status) {
            const updated = await prisma.customer.update({
              where: { id: cust.id },
              data: { status: apiStatus.status.toUpperCase() },
            });
            cust.status = updated.status;
          }
        } catch (err) {
          console.warn(`Could not sync status for ${cust.username}:`, err);
        }
        return cust;
      })
    );

    return NextResponse.json(syncedCustomers);
  } catch (error: any) {
    console.error('List customers error:', error);
    return NextResponse.json({ error: 'حدث خطأ في جلب العملاء' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 });
    }

    const body = await req.json();
    const { name, idBase, username, duration, amount, paymentMethod, notes } = body;

    // Validation
    if (!name || !idBase || !username || !duration || amount === undefined || !paymentMethod) {
      return NextResponse.json({ error: 'يرجى إدخال جميع الحقول المطلوبة' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();

    // Check if username already exists in DB
    const existing = await prisma.customer.findUnique({
      where: { username: cleanUsername },
    });
    if (existing) {
      return NextResponse.json({ error: 'اسم مستخدم الاشتراك موجود بالفعل في النظام' }, { status: 400 });
    }

    // Role-based Seller Price & Duration checking (prevents manipulation)
    if (user.role === 'SELLER') {
      const allowedPlan = user.allowedPrices.find((p: any) => p.duration === duration);
      if (!allowedPlan) {
        return NextResponse.json({ error: 'هذه الباقة غير مصرح لك ببيعها' }, { status: 403 });
      }
      if (amount < allowedPlan.price) {
        return NextResponse.json({ error: 'السعر المحدد أقل من الحد الأدنى المصرح به' }, { status: 403 });
      }
    }

    // 1. Call External API Provider to activate
    const apiRes = await provider.addUser({
      base_id: idBase,
      username: cleanUsername,
      duration,
    });

    if (!apiRes.ok) {
      return NextResponse.json({ error: 'فشل تفعيل الاشتراك من خلال النظام الخارجي API' }, { status: 500 });
    }

    const start = new Date();
    const end = getDurationDate(duration, start);

    // 2. Transactionally save Customer, Sale, History, and AuditLog
    const result = await prisma.$transaction(async (tx: any) => {
      // Save Customer
      const customer = await tx.customer.create({
        data: {
          name,
          idBase,
          username: cleanUsername,
          sellerId: user.id,
          startSubscription: start,
          endSubscription: end,
          status: 'ACTIVE',
          notes,
        },
      });

      // Save Sale
      const sale = await tx.sale.create({
        data: {
          customerId: customer.id,
          sellerId: user.id,
          amount: parseFloat(amount),
          currency: 'SAR',
          duration,
          paymentMethod,
          notes: notes || 'تفعيل اشتراك تلقائي',
        },
      });

      // Save Subscription History
      await tx.subscriptionHistory.create({
        data: {
          customerId: customer.id,
          sellerId: user.id,
          action: 'ACTIVATE',
          duration,
          startDate: start,
          endDate: end,
        },
      });

      // Save Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          actionType: 'ADD_CUSTOMER',
          changedData: JSON.stringify({
            customerId: customer.id,
            customerName: name,
            username: cleanUsername,
            amount,
            duration,
          }),
        },
      });

      return { customer, sale };
    });

    return NextResponse.json({ success: true, customer: result.customer });
  } catch (error: any) {
    console.error('Create customer error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إضافة العميل وتفعيل الباقة' }, { status: 500 });
  }
}
