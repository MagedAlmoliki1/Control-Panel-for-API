// app/api/sales/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const sellerId = searchParams.get('sellerId') || '';
    const duration = searchParams.get('duration') || '';
    const paymentMethod = searchParams.get('paymentMethod') || '';

    const where: any = {};

    // Multi-tenant Seller isolation check
    if (user.role === 'SELLER') {
      where.sellerId = user.id;
    } else if (sellerId) {
      where.sellerId = sellerId;
    }

    if (duration) {
      where.duration = duration;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (search) {
      where.customer = {
        OR: [
          { name: { contains: search } },
          { username: { contains: search } },
        ],
      };
    }

    // Retrieve sales
    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, username: true, idBase: true } },
        seller: { select: { id: true, name: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(sales);
  } catch (error: any) {
    console.error('List sales error:', error);
    return NextResponse.json({ error: 'حدث خطأ في جلب بيانات المبيعات' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 });
    }

    const body = await req.json();
    const { customerId, amount, duration, paymentMethod, notes } = body;

    // Validation
    if (!customerId || amount === undefined || !duration || !paymentMethod) {
      return NextResponse.json({ error: 'يرجى إدخال جميع الحقول المطلوبة' }, { status: 400 });
    }

    // Find customer to make sure it's valid
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json({ error: 'العميل المحدد غير موجود في قاعدة البيانات' }, { status: 404 });
    }

    // Seller isolation check
    if (user.role === 'SELLER' && customer.sellerId !== user.id) {
      return NextResponse.json({ error: 'غير مصرح لك بتسجيل دفعات لعميل غير تابع لك' }, { status: 403 });
    }

    // Save payment
    const sale = await prisma.sale.create({
      data: {
        customerId,
        sellerId: user.id,
        amount: parseFloat(amount),
        currency: 'SAR',
        duration,
        paymentMethod,
        notes: notes || 'دفعة يدوية إضافية',
      },
    });

    // Write System Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        actionType: 'RECORD_PAYMENT',
        changedData: JSON.stringify({
          saleId: sale.id,
          customerId,
          customerName: customer.name,
          amount,
          duration,
        }),
      },
    });

    return NextResponse.json({ success: true, sale });
  } catch (error: any) {
    console.error('Record payment error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تسجيل الدفعة المالية' }, { status: 500 });
  }
}
