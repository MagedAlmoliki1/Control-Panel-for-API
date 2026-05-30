// app/api/sellers/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, hashPassword } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, phone, status, allowedPrices, password } = body;

    if (!name) {
      return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 });
    }

    // Find seller
    const seller = await prisma.user.findUnique({
      where: { id },
    });

    if (!seller) {
      return NextResponse.json({ error: 'الموزع غير موجود' }, { status: 404 });
    }

    const updateData: any = {
      name,
      phone: phone || null,
      status: status || 'ACTIVE',
      allowedPrices: JSON.stringify(allowedPrices || []),
    };

    // If new password is provided, rehash it
    if (password && password.trim() !== '') {
      updateData.password = await hashPassword(password);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Write System Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        actionType: 'EDIT_SELLER',
        changedData: JSON.stringify({
          sellerId: seller.id,
          nameBefore: seller.name,
          nameAfter: name,
          status,
        }),
      },
    });

    return NextResponse.json({ success: true, seller: updated });
  } catch (error: any) {
    console.error('Update seller error:', error);
    return NextResponse.json({ error: 'حدث خطأ في النظام أثناء تعديل بيانات الموزع' }, { status: 500 });
  }
}

export async function DELETE(
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

    // Transactionally delete
    await prisma.$transaction(async (tx) => {
      // Cascade delete or manual clean if needed. (DB will cascade delete customer-linked logs or we can reassign)
      await tx.user.delete({
        where: { id },
      });

      // Write Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          actionType: 'DELETE_SELLER',
          changedData: JSON.stringify({
            sellerId: seller.id,
            sellerName: seller.name,
            username: seller.username,
          }),
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete seller error:', error);
    return NextResponse.json({ error: 'حدث خطأ في النظام أثناء حذف الموزع' }, { status: 500 });
  }
}
