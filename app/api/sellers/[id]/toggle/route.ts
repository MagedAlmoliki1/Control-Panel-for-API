// app/api/sellers/[id]/toggle/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 });
    }

    const { id } = await params;

    // Find seller
    const seller = await prisma.user.findUnique({
      where: { id },
    });

    if (!seller) {
      return NextResponse.json({ error: 'الموزع غير موجود' }, { status: 404 });
    }

    const newStatus = seller.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    const updated = await prisma.user.update({
      where: { id },
      data: { status: newStatus },
    });

    // Write Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        actionType: 'TOGGLE_SELLER_STATUS',
        changedData: JSON.stringify({
          sellerId: seller.id,
          sellerName: seller.name,
          username: seller.username,
          statusBefore: seller.status,
          statusAfter: newStatus,
        }),
      },
    });

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error: any) {
    console.error('Toggle seller status error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تغيير حالة الموزع' }, { status: 500 });
  }
}
