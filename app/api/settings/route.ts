// app/api/settings/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { getSystemSettings, saveSystemSettings, SystemSettings } from '@/lib/settings';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 });
    }

    const settings = getSystemSettings();

    // Mask the API Key to prevent leakage
    const apiKey = settings.api.apiKey;
    let maskedKey = '••••••••••••';
    if (apiKey && apiKey.length > 8) {
      maskedKey = `${apiKey.substring(0, 4)}••••••••${apiKey.substring(apiKey.length - 4)}`;
    }

    const safeSettings = {
      ...settings,
      api: {
        ...settings.api,
        apiKey: maskedKey,
      },
    };

    return NextResponse.json(safeSettings);
  } catch (error: any) {
    console.error('Get system settings API error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب إعدادات النظام' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 });
    }

    const body = await req.json();
    const currentSettings = getSystemSettings();

    // Parse values from body
    const { api, pricePlans, expiryThresholdDays } = body;

    // Validate inputs
    if (!api || !api.baseUrl || !api.providerType || typeof expiryThresholdDays !== 'number') {
      return NextResponse.json({ error: 'المدخلات غير كاملة أو غير صالحة' }, { status: 400 });
    }

    // Resolve API Key: if it's masked or contains bullets, preserve the current one
    let targetApiKey = api.apiKey;
    if (!targetApiKey || targetApiKey.includes('••••') || targetApiKey.trim() === '') {
      targetApiKey = currentSettings.api.apiKey;
    }

    const updatedSettings: SystemSettings = {
      api: {
        baseUrl: api.baseUrl.trim(),
        apiKey: targetApiKey.trim(),
        timeout: parseInt(api.timeout) || 5,
        providerType: api.providerType === 'REAL' ? 'REAL' : 'MOCK',
      },
      pricePlans: Array.isArray(pricePlans) ? pricePlans : currentSettings.pricePlans,
      expiryThresholdDays: expiryThresholdDays,
    };

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        actionType: 'UPDATE_SETTINGS',
        changedData: JSON.stringify({
          baseUrl: updatedSettings.api.baseUrl,
          providerType: updatedSettings.api.providerType,
          plansCount: updatedSettings.pricePlans.length,
          expiryThresholdDays: updatedSettings.expiryThresholdDays,
        }),
      },
    });

    const success = saveSystemSettings(updatedSettings);
    if (!success) {
      throw new Error('Could not save system settings to file');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update system settings API error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء حفظ إعدادات النظام' }, { status: 500 });
  }
}
