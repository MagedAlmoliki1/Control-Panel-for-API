// app/api/customers/[id]/renew/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { provider } from '@/lib/api';

// Helper to calculate extended expiry date
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { duration, amount, paymentMethod, notes } = body;

    // Validation
    if (!duration || amount === undefined || !paymentMethod) {
      return NextResponse.json({ error: 'يرجى إدخال جميع الحقول المطلوبة للتجديد' }, { status: 400 });
    }

    // Find customer
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      return NextResponse.json({ error: 'العميل غير موجود' }, { status: 404 });
    }

    // Strict multi-tenant Seller isolation check
    if (user.role === 'SELLER' && customer.sellerId !== user.id) {
      return NextResponse.json({ error: 'غير مصرح لك بتجديد اشتراك هذا العميل' }, { status: 403 });
    }

    // Role-based Seller pricing check (prevents client manipulation)
    if (user.role === 'SELLER') {
      const allowedPlan = user.allowedPrices.find((p: any) => p.duration === duration);
      if (!allowedPlan) {
        return NextResponse.json({ error: 'هذه الباقة غير مصرح لك ببيعها' }, { status: 403 });
      }
      if (amount < allowedPlan.price) {
        return NextResponse.json({ error: 'السعر المحدد أقل من الحد الأدنى المصرح به' }, { status: 403 });
      }
    }

    // 1. Call External Provider API to renew
    const apiRes = await provider.renewUser({
      username: customer.username,
      duration,
    });

    if (!apiRes.ok) {
      return NextResponse.json({ error: 'فشل تجديد الاشتراك من خلال النظام الخارجي API' }, { status: 500 });
    }

    // Calculate start & end
    const now = new Date();
    const currentEnd = new Date(customer.endSubscription);
    // If subscription is active, extend from the current end date; otherwise, start from now
    const startFrom = currentEnd.getTime() > now.getTime() && customer.status === 'ACTIVE' ? currentEnd : now;
    const newEnd = getDurationDate(duration, startFrom);

    // 2. Transactionally record renewal data in DB
    const updatedCustomer = await prisma.$transaction(async (tx) => {
      // Update Customer record
      const updated = await tx.customer.update({
        where: { id },
        data: {
          endSubscription: newEnd,
          status: 'ACTIVE',
        },
      });

      // Record renewal Sale / Payment
      await tx.sale.create({
        data: {
          customerId: customer.id,
          sellerId: user.id,
          amount: parseFloat(amount),
          currency: 'SAR',
          duration,
          paymentMethod,
          notes: notes || 'تجديد اشتراك تلقائي',
        },
      });

      // Write Subscription History
      await tx.subscriptionHistory.create({
        data: {
          customerId: customer.id,
          sellerId: user.id,
          action: 'RENEW',
          duration,
          startDate: startFrom,
          endDate: newEnd,
        },
      });

      // Write Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          actionType: 'RENEW_CUSTOMER',
          changedData: JSON.stringify({
            customerId: customer.id,
            customerName: customer.name,
            username: customer.username,
            amount,
            duration,
            extendedTo: newEnd.toISOString(),
          }),
        },
      });

      return updated;
    });

    return NextResponse.json({ success: true, customer: updatedCustomer });
  } catch (error: any) {
    console.error('Renew customer error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تجديد اشتراك العميل' }, { status: 500 });
  }
}
