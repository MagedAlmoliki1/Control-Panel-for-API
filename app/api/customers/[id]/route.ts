// app/api/customers/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { provider } from '@/lib/api';

export async function PUT(
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
    const { name, notes, sellerId } = body;

    if (!name) {
      return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 });
    }

    // Find customer
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      return NextResponse.json({ error: 'العميل غير موجود' }, { status: 404 });
    }

    // Strict Seller isolation check
    if (user.role === 'SELLER' && customer.sellerId !== user.id) {
      return NextResponse.json({ error: 'غير مصرح لك بتعديل بيانات هذا العميل' }, { status: 403 });
    }

    const updateData: any = { name, notes };

    // Only Admin can change the responsible seller
    if (user.role === 'ADMIN' && sellerId) {
      updateData.sellerId = sellerId;
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: updateData,
    });

    // Write Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        actionType: 'EDIT_CUSTOMER',
        changedData: JSON.stringify({
          customerId: customer.id,
          nameBefore: customer.name,
          nameAfter: name,
          notes,
        }),
      },
    });

    return NextResponse.json({ success: true, customer: updated });
  } catch (error: any) {
    console.error('Edit customer error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تعديل بيانات العميل' }, { status: 500 });
  }
}

export async function DELETE(
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

    // Strict Seller isolation check
    if (user.role === 'SELLER' && customer.sellerId !== user.id) {
      return NextResponse.json({ error: 'غير مصرح لك بحذف هذا العميل' }, { status: 403 });
    }

    // 1. Call External Provider API to make sure they are removed
    try {
      await provider.removeUser({ username: customer.username });
    } catch (err) {
      console.warn(`Could not suspend user on external API during deletion: ${customer.username}`, err);
    }

    // 2. Transactionally delete from DB
    await prisma.$transaction(async (tx) => {
      // Delete Customer (cascade will delete sales/histories if specified, or we let Prisma delete cascade)
      await tx.customer.delete({
        where: { id },
      });

      // Write Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          actionType: 'DELETE_CUSTOMER',
          changedData: JSON.stringify({
            customerId: customer.id,
            customerName: customer.name,
            username: customer.username,
          }),
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete customer error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء حذف العميل' }, { status: 500 });
  }
}
