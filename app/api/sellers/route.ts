// app/api/sellers/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 });
    }

    // Retrieve all sellers with active customer counts
    const sellers = await prisma.user.findMany({
      where: { role: 'SELLER' },
      select: {
        id: true,
        name: true,
        username: true,
        phone: true,
        status: true,
        allowedPrices: true,
        createdAt: true,
        _count: {
          select: {
            customers: { where: { status: 'ACTIVE' } },
            sales: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Aggregate sales amounts for each seller
    const formattedSellers = await Promise.all(
      sellers.map(async (s) => {
        const sumSales = await prisma.sale.aggregate({
          _sum: { amount: true },
          where: { sellerId: s.id },
        });

        return {
          id: s.id,
          name: s.name,
          username: s.username,
          phone: s.phone,
          status: s.status,
          allowedPrices: JSON.parse(s.allowedPrices || '[]'),
          createdAt: s.createdAt,
          activeCustomersCount: s._count.customers,
          totalSales: sumSales._sum.amount || 0,
        };
      })
    );

    return NextResponse.json(formattedSellers);
  } catch (error: any) {
    console.error('List sellers error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب قائمة الموزعين' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 });
    }

    const body = await req.json();
    const { name, username, password, phone, allowedPrices } = body;

    // Validation
    if (!name || !username || !password) {
      return NextResponse.json({ error: 'الاسم واسم المستخدم وكلمة المرور مطلوبة' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();

    // Check if username already exists
    const existing = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });
    if (existing) {
      return NextResponse.json({ error: 'اسم المستخدم مسجل بالفعل لشخص آخر' }, { status: 400 });
    }

    // Encrypt password
    const hashedPassword = await hashPassword(password);

    // Save seller
    const seller = await prisma.user.create({
      data: {
        name,
        username: cleanUsername,
        password: hashedPassword,
        phone: phone || null,
        role: 'SELLER',
        status: 'ACTIVE',
        allowedPrices: JSON.stringify(allowedPrices || []),
      },
    });

    // Write System Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        actionType: 'ADD_SELLER',
        changedData: JSON.stringify({
          sellerId: seller.id,
          sellerName: seller.name,
          username: seller.username,
        }),
      },
    });

    return NextResponse.json({ success: true, seller: { id: seller.id, name: seller.name } });
  } catch (error: any) {
    console.error('Create seller error:', error);
    return NextResponse.json({ error: 'حدث خطأ في النظام أثناء تسجيل الموزع الجديد' }, { status: 500 });
  }
}
