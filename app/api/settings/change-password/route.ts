// app/api/settings/change-password/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, comparePassword, hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 });
    }

    const body = await req.json();
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: 'يرجى إدخال كلمة المرور القديمة والجديدة' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'يجب أن لا تقل كلمة المرور الجديدة عن 6 أحرف' }, { status: 400 });
    }

    // Load actual user record from DB
    const adminUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'مستخدم غير موجود' }, { status: 404 });
    }

    // Verify old password
    const match = await comparePassword(oldPassword, adminUser.password);
    if (!match) {
      return NextResponse.json({ error: 'كلمة المرور القديمة غير صحيحة' }, { status: 400 });
    }

    // Hash and save new password
    const hashedNewPassword = await hashPassword(newPassword);
    
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { password: hashedNewPassword }
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          actionType: 'CHANGE_ADMIN_PASSWORD',
          changedData: JSON.stringify({ message: 'Admin modified account password successfully' })
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Change admin password error:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع أثناء تغيير كلمة المرور' }, { status: 500 });
  }
}
