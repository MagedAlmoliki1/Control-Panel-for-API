// app/api/cron/check-expiries/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { provider } from '@/lib/api';

export async function GET(req: NextRequest) {
  try {
    // Secret header check or simple cron execution
    const authHeader = req.headers.get('authorization');
    const isLocalTrigger = !authHeader || authHeader === `Bearer ${process.env.CRON_SECRET || 'local-cron-secret-123'}`;

    if (!isLocalTrigger) {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 });
    }

    const now = new Date();

    // 1. Fetch all ACTIVE customers whose subscription end date has passed
    const expiredCustomers = await prisma.customer.findMany({
      where: {
        status: 'ACTIVE',
        endSubscription: {
          lt: now,
        },
      },
    });

    const results = [];

    // 2. Disable them on external API and update DB state
    for (const customer of expiredCustomers) {
      try {
        // Call external API provider to remove/suspend
        const apiRes = await provider.removeUser({ username: customer.username });
        
        if (apiRes.ok) {
          await prisma.$transaction(async (tx) => {
            // Update DB status to EXPIRED
            await tx.customer.update({
              where: { id: customer.id },
              data: { status: 'EXPIRED' },
            });

            // Write subscription history
            await tx.subscriptionHistory.create({
              data: {
                customerId: customer.id,
                sellerId: customer.sellerId,
                action: 'SUSPEND', // Marks API access cut off
                duration: 'EXPIRED',
                startDate: customer.startSubscription,
                endDate: customer.endSubscription,
              },
            });

            // Write system audit log
            await tx.auditLog.create({
              data: {
                userId: customer.sellerId, // Linked to responsible seller
                actionType: 'AUTO_EXPIRY',
                changedData: JSON.stringify({
                  customerId: customer.id,
                  customerName: customer.name,
                  username: customer.username,
                  expiryTime: customer.endSubscription.toISOString(),
                }),
              },
            });
          });

          results.push({ username: customer.username, status: 'EXPIRED' });
        } else {
          console.error(`External API suspend failed for expired customer: ${customer.username}`);
        }
      } catch (err: any) {
        console.error(`Error processing auto-expiry for ${customer.username}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      processedCount: expiredCustomers.length,
      expired: results,
    });
  } catch (error: any) {
    console.error('Cron check-expiries error:', error);
    return NextResponse.json({ error: 'خطأ في معالجة انتهاء الاشتراكات تلقائياً' }, { status: 500 });
  }
}
