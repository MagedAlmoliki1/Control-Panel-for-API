// app/(dashboard)/customers/page.tsx

import React from 'react';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import CustomersManager from '@/app/components/CustomersManager';

export default async function CustomersPage() {
  const user = await getSessionUser();
  if (!user) return null;

  // Fetch list of active sellers (only used by Admin for filtering and assigning/editing)
  let sellersList: any[] = [];
  if (user.role === 'ADMIN') {
    sellersList = await prisma.user.findMany({
      where: { role: 'SELLER' },
      select: { id: true, name: true, username: true },
      orderBy: { name: 'asc' },
    });
  }

  // Pass current session user role, name, and allowed prices directly to client component
  return (
    <CustomersManager
      sessionUser={user}
      sellers={sellersList}
    />
  );
}
