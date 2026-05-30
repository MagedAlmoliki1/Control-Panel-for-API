// app/(dashboard)/sales/page.tsx

import React from 'react';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import SalesManager from '@/app/components/SalesManager';

export default async function SalesPage() {
  const user = await getSessionUser();
  if (!user) return null;

  // Load active sellers list for dropdown filtering in SalesManager
  let sellersList: any[] = [];
  if (user.role === 'ADMIN') {
    sellersList = await prisma.user.findMany({
      where: { role: 'SELLER' },
      select: { id: true, name: true, username: true },
      orderBy: { name: 'asc' },
    });
  }

  // Load all customers in the database for selecting inside custom "Record Payment" form
  const customersList = await prisma.customer.findMany({
    where: user.role === 'SELLER' ? { sellerId: user.id } : {},
    select: { id: true, name: true, username: true },
    orderBy: { name: 'asc' },
  });

  return (
    <SalesManager
      sessionUser={user}
      sellers={sellersList}
      customers={customersList}
    />
  );
}
