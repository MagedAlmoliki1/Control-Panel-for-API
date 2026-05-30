import { prisma } from '../lib/db';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Seeding database...');

  // Clean old data
  await prisma.auditLog.deleteMany({});
  await prisma.subscriptionHistory.deleteMany({});
  await prisma.sale.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.user.deleteMany({});

  // Hashes
  const adminPasswordHash = await bcrypt.hash('adminpassword123', 10);
  const sellerPasswordHash = await bcrypt.hash('sellerpassword123', 10);

  // 1. Create System Admin
  const admin = await prisma.user.create({
    data: {
      name: 'مدير النظام',
      username: 'admin',
      password: adminPasswordHash,
      phone: '+966500000001',
      role: 'ADMIN',
      status: 'ACTIVE',
      allowedPrices: JSON.stringify([
        { duration: '2 hours', price: 5, currency: 'SAR' },
        { duration: '1 day', price: 15, currency: 'SAR' },
        { duration: '3 days', price: 30, currency: 'SAR' },
        { duration: '1 week', price: 60, currency: 'SAR' },
        { duration: '1 month', price: 150, currency: 'SAR' },
        { duration: '3 months', price: 400, currency: 'SAR' },
        { duration: '6 months', price: 700, currency: 'SAR' },
        { duration: '1 year', price: 1200, currency: 'SAR' },
      ]),
    },
  });

  // 2. Create Test Seller
  const seller = await prisma.user.create({
    data: {
      name: 'أحمد صالح',
      username: 'seller_test',
      password: sellerPasswordHash,
      phone: '+966500000002',
      role: 'SELLER',
      status: 'ACTIVE',
      allowedPrices: JSON.stringify([
        { duration: '2 hours', price: 5, currency: 'SAR' },
        { duration: '1 day', price: 15, currency: 'SAR' },
        { duration: '3 days', price: 30, currency: 'SAR' },
        { duration: '1 week', price: 60, currency: 'SAR' },
        { duration: '1 month', price: 150, currency: 'SAR' },
      ]),
    },
  });

  console.log('Seeded users: admin (adminpassword123), seller_test (sellerpassword123)');

  // 3. Create Sample Customers
  const now = new Date();

  // Active Customer linked to seller
  const activeCustomer = await prisma.customer.create({
    data: {
      name: 'خالد عبد الله',
      idBase: 'base_200',
      username: 'khaled_sub',
      sellerId: seller.id,
      startSubscription: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      endSubscription: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),  // 20 days remaining
      status: 'ACTIVE',
      notes: 'عميل مميز لتفعيل باقة الشهر',
    },
  });

  // Expiring soon Customer (within 3 days)
  const expiringCustomer = await prisma.customer.create({
    data: {
      name: 'محمد العتيبي',
      idBase: 'base_201',
      username: 'mohammed_sub',
      sellerId: seller.id,
      startSubscription: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000), // 28 days ago
      endSubscription: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),    // 2 days remaining
      status: 'ACTIVE',
      notes: 'توشك باقته على الانتهاء',
    },
  });

  // Expired Customer
  const expiredCustomer = await prisma.customer.create({
    data: {
      name: 'سلطان الحربي',
      idBase: 'base_202',
      username: 'sultan_sub',
      sellerId: seller.id,
      startSubscription: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000), // 40 days ago
      endSubscription: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),  // expired 10 days ago
      status: 'EXPIRED',
      notes: 'لم يقم بالتجديد بعد',
    },
  });

  // Active Customer linked to admin
  const adminCustomer = await prisma.customer.create({
    data: {
      name: 'فيصل الشمري',
      idBase: 'base_203',
      username: 'faisal_sub',
      sellerId: admin.id,
      startSubscription: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      endSubscription: new Date(now.getTime() + 363 * 24 * 60 * 60 * 1000), // 1 year package
      status: 'ACTIVE',
      notes: 'اشتراك سنوي مباشر',
    },
  });

  console.log('Seeded sample customers.');

  // 4. Create Sample Sales / Payments
  await prisma.sale.createMany({
    data: [
      {
        customerId: activeCustomer.id,
        sellerId: seller.id,
        amount: 150.0,
        currency: 'SAR',
        duration: '1 month',
        paymentMethod: 'TRANSFER',
        notes: 'حوالة بنكية الراجحي تم التحقق منها',
        createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        customerId: expiringCustomer.id,
        sellerId: seller.id,
        amount: 150.0,
        currency: 'SAR',
        duration: '1 month',
        paymentMethod: 'CASH',
        notes: 'دفع نقدي مباشر',
        createdAt: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000),
      },
      {
        customerId: expiredCustomer.id,
        sellerId: seller.id,
        amount: 150.0,
        currency: 'SAR',
        duration: '1 month',
        paymentMethod: 'TRANSFER',
        createdAt: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
      },
      {
        customerId: adminCustomer.id,
        sellerId: admin.id,
        amount: 1200.0,
        currency: 'SAR',
        duration: '1 year',
        paymentMethod: 'USDT',
        notes: 'دفع بالعملات الرقمية محفظة بايننس',
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log('Seeded sample sales.');

  // 5. Create Subscription Histories
  await prisma.subscriptionHistory.createMany({
    data: [
      {
        customerId: activeCustomer.id,
        sellerId: seller.id,
        action: 'ACTIVATE',
        duration: '1 month',
        startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        customerId: expiringCustomer.id,
        sellerId: seller.id,
        action: 'ACTIVATE',
        duration: '1 month',
        startDate: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000),
      },
      {
        customerId: adminCustomer.id,
        sellerId: admin.id,
        action: 'ACTIVATE',
        duration: '1 year',
        startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 363 * 24 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // 6. Create Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        actionType: 'ADD_SELLER',
        changedData: JSON.stringify({ sellerName: 'أحمد صالح', username: 'seller_test' }),
        createdAt: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000),
      },
      {
        userId: seller.id,
        actionType: 'ADD_CUSTOMER',
        changedData: JSON.stringify({ customerName: 'خالد عبد الله', username: 'khaled_sub' }),
        createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        userId: admin.id,
        actionType: 'ADD_CUSTOMER',
        changedData: JSON.stringify({ customerName: 'فيصل الشمري', username: 'faisal_sub' }),
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log('Seeded audit logs.');
  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
