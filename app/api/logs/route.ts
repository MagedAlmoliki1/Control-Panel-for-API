// app/api/logs/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { provider } from '@/lib/api';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const searchUserId = searchParams.get('userId') || ''; // Specific customer username
    const searchIp = searchParams.get('ip') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    // 1. Enforce strict Seller isolation
    let allowedUsernames: Set<string> | null = null;
    if (user.role === 'SELLER') {
      const myCustomers = await prisma.customer.findMany({
        where: { sellerId: user.id },
        select: { username: true }
      });
      allowedUsernames = new Set(myCustomers.map(c => c.username.toLowerCase()));
      
      // If Seller requests a specific customer, verify they own it
      if (searchUserId && !allowedUsernames.has(searchUserId.toLowerCase())) {
        return NextResponse.json({ error: 'غير مصرح لك بالوصول لسجلات هذا العميل' }, { status: 403 });
      }
    }

    // 2. Fetch logs from pluggable API provider
    // In our MockProvider, if we pass empty user_id, it fetches all logs.
    // If a specific username is requested, fetch logs for that user.
    const rawLogs = await provider.getLogs({
      user_id: searchUserId,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    });

    // 3. Load DB Customers to map usernames to display names and seller names
    const dbCustomers = await prisma.customer.findMany({
      where: user.role === 'SELLER' ? { sellerId: user.id } : {},
      select: {
        username: true,
        name: true,
        seller: {
          select: { name: true }
        }
      }
    });

    const customerNameMap = new Map(dbCustomers.map(c => [c.username.toLowerCase(), c.name]));
    const sellerNameMap = new Map(dbCustomers.map(c => [c.username.toLowerCase(), c.seller?.name || '']));

    // 4. Trace unrecognized IP address sequence (Chronological IP history tracking)
    // To ensure exact history tracking, sort ALL logs in memory chronologically first
    const chronologicalLogs = [...rawLogs].sort(
      (a, b) => new Date(a.login_time).getTime() - new Date(b.login_time).getTime()
    );

    const ipHistoryMap = new Map<string, Set<string>>();
    const flaggedLogs = chronologicalLogs.map(log => {
      const usernameKey = log.user_id.toLowerCase();
      
      if (!ipHistoryMap.has(usernameKey)) {
        ipHistoryMap.set(usernameKey, new Set());
      }
      
      const seenIps = ipHistoryMap.get(usernameKey)!;
      // Mark as unrecognized IP if we have already recorded other IPs and this is a brand new one
      const isNewIp = seenIps.size > 0 && !seenIps.has(log.ip);
      seenIps.add(log.ip);

      return {
        ...log,
        isNewIp
      };
    });

    // 5. Apply filters & maps to retrieve final result list
    let filteredLogs = flaggedLogs;

    // Filter by seller ownership in-memory if user is a SELLER
    if (user.role === 'SELLER' && allowedUsernames) {
      filteredLogs = filteredLogs.filter(log => allowedUsernames!.has(log.user_id.toLowerCase()));
    }

    // Filter by IP if requested
    if (searchIp) {
      filteredLogs = filteredLogs.filter(log => log.ip.includes(searchIp));
    }

    // Merge with DB Customer info
    const finalLogs = filteredLogs.map(log => {
      const lowerUser = log.user_id.toLowerCase();
      return {
        ...log,
        customerName: customerNameMap.get(lowerUser) || 'عميل خارجي',
        sellerName: sellerNameMap.get(lowerUser) || 'غير محدد',
      };
    });

    // Return descending (most recent first) for presentation
    const finalSorted = finalLogs.sort(
      (a, b) => new Date(b.login_time).getTime() - new Date(a.login_time).getTime()
    );

    return NextResponse.json(finalSorted);
  } catch (error: any) {
    console.error('Fetch logs API error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب سجلات الدخول' }, { status: 500 });
  }
}
