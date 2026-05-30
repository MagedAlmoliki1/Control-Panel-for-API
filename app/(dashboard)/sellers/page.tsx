// app/(dashboard)/sellers/page.tsx

import React from 'react';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SellersManager from '@/app/components/SellersManager';

export default async function SellersPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return <SellersManager />;
}
