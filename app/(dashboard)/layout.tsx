// app/(dashboard)/layout.tsx

import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { provider } from '@/lib/api';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  UserCheck,
  History,
  Settings as SettingsIcon,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  AlertTriangle,
  Menu,
} from 'lucide-react';
import ClientLayoutHelper from '../components/ClientLayoutHelper';

// Perform auto-expiry check on page loads to keep state accurate in real-time
async function runAutoExpiryCheck() {
  try {
    const now = new Date();
    const expiredCustomers = await prisma.customer.findMany({
      where: {
        status: 'ACTIVE',
        endSubscription: {
          lt: now,
        },
      },
    });

    for (const customer of expiredCustomers) {
      try {
        const apiRes = await provider.removeUser({ username: customer.username });
        if (apiRes.ok) {
          await prisma.$transaction(async (tx) => {
            await tx.customer.update({
              where: { id: customer.id },
              data: { status: 'EXPIRED' },
            });
            await tx.subscriptionHistory.create({
              data: {
                customerId: customer.id,
                sellerId: customer.sellerId,
                action: 'SUSPEND',
                duration: 'EXPIRED',
                startDate: customer.startSubscription,
                endDate: customer.endSubscription,
              },
            });
            await tx.auditLog.create({
              data: {
                userId: customer.sellerId,
                actionType: 'AUTO_EXPIRY',
                changedData: JSON.stringify({
                  customerId: customer.id,
                  customerName: customer.name,
                  username: customer.username,
                }),
              },
            });
          });
        }
      } catch (e) {
        console.error('Auto-expiry layout check error:', e);
      }
    }
  } catch (err) {
    console.error('Auto-expiry layout query error:', err);
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  // Sync db expiries in the background
  await runAutoExpiryCheck();

  // Find expiring soon alerts (within next 3 days)
  const expiringCount = await prisma.customer.count({
    where: {
      status: 'ACTIVE',
      sellerId: user.role === 'SELLER' ? user.id : undefined,
      endSubscription: {
        gt: new Date(),
        lt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
    },
  });

  return (
    <div className="min-h-screen bg-[#070b13] flex flex-col md:flex-row relative">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-900/5 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Navigation & Shell Sidebar */}
      <ClientLayoutHelper
        user={user}
        expiringCount={expiringCount}
      >
        {children}
      </ClientLayoutHelper>
    </div>
  );
}
