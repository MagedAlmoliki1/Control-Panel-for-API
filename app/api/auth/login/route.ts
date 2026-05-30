// app/api/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { comparePassword, setSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'يرجى إدخال اسم المستخدم وكلمة المرور' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
    });

    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'اسم المستخدم أو كلمة المرور غير صحيحة، أو الحساب معطل' },
        { status: 401 }
      );
    }

    // Compare password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // Set Session Cookie
    await setSessionCookie({
      userId: user.id,
      role: user.role as 'ADMIN' | 'SELLER',
      name: user.name,
    });

    // Write Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        actionType: 'LOGIN',
        changedData: JSON.stringify({ ip: req.headers.get('x-forwarded-for') || '127.0.0.1' }),
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في النظام أثناء تسجيل الدخول' },
      { status: 500 }
    );
  }
}
