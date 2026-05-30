// app/api/customers/[id]/suspend/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { provider } from '@/lib/api';

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

    // Find customer
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      return NextResponse.json({ error: 'العميل غير موجود' }, { status: 404 });
    }

    // Strict multi-tenant Seller isolation check
    if (user.role === 'SELLER' && customer.sellerId !== user.id) {
      return NextResponse.json({ error: 'غير مصرح لك بتعليق اشتراك هذا العميل' }, { status: 403 });
    }

    // 1. Call External Provider API to suspend
    const apiRes = await provider.removeUser({
      username: customer.username,
    });

    if (!apiRes.ok) {
      return NextResponse.json({ error: 'فشل إيقاف الاشتراك من خلال النظام الخارجي API' }, { status: 500 });
    }

    // 2. Transactionally update DB
    const updatedCustomer = await prisma.$transaction(async (tx) => {
      // Update customer status to SUSPENDED
      const updated = await tx.customer.update({
        where: { id },
        data: { status: 'SUSPENDED' },
      });

      // Write Subscription History
      await tx.subscriptionHistory.create({
        data: {
          customerId: customer.id,
          sellerId: user.id,
          action: 'SUSPEND',
          duration: 'N/A',
          startDate: customer.startSubscription,
          endDate: customer.endSubscription,
        },
      });

      // Write Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          actionType: 'SUSPEND_CUSTOMER',
          changedData: JSON.stringify({
            customerId: customer.id,
            customerName: customer.name,
            username: customer.username,
          }),
        },
      });

      return updated;
    });

    return NextResponse.json({ success: true, customer: updatedCustomer });
  } catch (error: any) {
    console.error('Suspend customer error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تعليق اشتراك العميل' }, { status: 500 });
  }
}
