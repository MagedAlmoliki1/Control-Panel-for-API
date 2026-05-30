// lib/api/mockProvider.ts
// Mock data is now stored in MockUser + MockLog tables in the database
// instead of the filesystem, so it works on Vercel's read-only environment.

import { prisma } from '../db';
import { SubscriptionProvider, ExternalUser, ExternalLog, ExternalStatus } from './provider';

function getDurationDate(duration: string, startDate = new Date()): Date {
  const date = new Date(startDate);
  switch (duration) {
    case '2 hours':
      date.setHours(date.getHours() + 2);
      break;
    case '1 day':
      date.setDate(date.getDate() + 1);
      break;
    case '3 days':
      date.setDate(date.getDate() + 3);
      break;
    case '1 week':
      date.setDate(date.getDate() + 7);
      break;
    case '1 month':
      date.setMonth(date.getMonth() + 1);
      break;
    case '3 months':
      date.setMonth(date.getMonth() + 3);
      break;
    case '6 months':
      date.setMonth(date.getMonth() + 6);
      break;
    case '1 year':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      date.setMonth(date.getMonth() + 1);
  }
  return date;
}

async function ensureSeeded() {
  const count = await prisma.mockUser.count();
  if (count > 0) return;

  // Seed initial mock data on first run
  await prisma.mockUser.createMany({
    data: [
      {
        username: 'test_user_1',
        baseId: 'base_100',
        duration: '1 month',
        status: 'active',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: getDurationDate('1 month', new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)).toISOString(),
      },
      {
        username: 'test_user_2',
        baseId: 'base_101',
        duration: '3 days',
        status: 'expired',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: getDurationDate('3 days', new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)).toISOString(),
      },
    ],
  });

  await prisma.mockLog.createMany({
    data: [
      {
        userId: 'test_user_1',
        loginTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        ip: '192.168.1.10',
        durationSeconds: 3600,
      },
      {
        userId: 'test_user_1',
        loginTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        ip: '192.168.1.15',
        durationSeconds: 7200,
      },
      {
        userId: 'test_user_2',
        loginTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        ip: '82.165.44.12',
        durationSeconds: 1200,
      },
    ],
  });
}

export class MockProvider implements SubscriptionProvider {
  async addUser(input: { base_id: string; username: string; duration: string }): Promise<{ ok: boolean; raw?: unknown }> {
    await ensureSeeded();
    const now = new Date();
    const endTime = getDurationDate(input.duration, now);

    await prisma.mockUser.upsert({
      where: { username: input.username },
      update: {
        baseId: input.base_id,
        duration: input.duration,
        status: 'active',
        createdAt: now.toISOString(),
        endTime: endTime.toISOString(),
      },
      create: {
        username: input.username,
        baseId: input.base_id,
        duration: input.duration,
        status: 'active',
        createdAt: now.toISOString(),
        endTime: endTime.toISOString(),
      },
    });

    const ips = ['197.34.200.12', '188.45.10.82', '82.165.44.12', '5.100.92.15'];
    const randomIp = ips[Math.floor(Math.random() * ips.length)];
    await prisma.mockLog.create({
      data: {
        userId: input.username,
        loginTime: now.toISOString(),
        ip: randomIp,
        durationSeconds: 180,
      },
    });

    return { ok: true, raw: { mock_success: true, time: now.toISOString() } };
  }

  async removeUser(input: { username: string }): Promise<{ ok: boolean }> {
    await ensureSeeded();
    const existing = await prisma.mockUser.findUnique({ where: { username: input.username } });
    if (!existing) return { ok: false };

    await prisma.mockUser.update({
      where: { username: input.username },
      data: { status: 'suspended' },
    });
    return { ok: true };
  }

  async listUsers(): Promise<ExternalUser[]> {
    await ensureSeeded();
    const users = await prisma.mockUser.findMany();
    return users.map((u) => ({
      username: u.username,
      base_id: u.baseId,
      duration: u.duration,
      status: u.status as 'active' | 'expired' | 'suspended',
      createdAt: u.createdAt,
    }));
  }

  async getLogs(input: { user_id: string; date_from?: string; date_to?: string }): Promise<ExternalLog[]> {
    await ensureSeeded();
    const logs = await prisma.mockLog.findMany();

    let results = logs.filter((l) =>
      l.userId.toLowerCase().includes(input.user_id.toLowerCase())
    );

    if (input.date_from) {
      const from = new Date(input.date_from).getTime();
      results = results.filter((l) => new Date(l.loginTime).getTime() >= from);
    }

    if (input.date_to) {
      const to = new Date(input.date_to).getTime();
      results = results.filter((l) => new Date(l.loginTime).getTime() <= to);
    }

    return results.map((l) => ({
      user_id: l.userId,
      login_time: l.loginTime,
      ip: l.ip,
      duration_seconds: l.durationSeconds,
    }));
  }

  async getUserStatus(input: { user_id: string }): Promise<ExternalStatus> {
    await ensureSeeded();
    const u = await prisma.mockUser.findUnique({ where: { username: input.user_id } });
    if (!u) throw new Error('User not found on mock provider');

    const now = new Date();
    const isExpired = new Date(u.endTime).getTime() < now.getTime();
    const finalStatus = isExpired && u.status === 'active' ? 'expired' : u.status;

    if (finalStatus !== u.status) {
      await prisma.mockUser.update({
        where: { username: u.username },
        data: { status: finalStatus },
      });
    }

    return {
      username: u.username,
      status: finalStatus as 'active' | 'expired' | 'suspended',
      end_time: u.endTime,
    };
  }

  async renewUser(input: { username: string; duration: string }): Promise<{ ok: boolean }> {
    await ensureSeeded();
    const u = await prisma.mockUser.findUnique({ where: { username: input.username } });
    if (!u) return { ok: false };

    const now = new Date();
    const currentEnd = new Date(u.endTime);
    const startFrom = currentEnd.getTime() > now.getTime() && u.status === 'active' ? currentEnd : now;
    const newEnd = getDurationDate(input.duration, startFrom);

    await prisma.mockUser.update({
      where: { username: input.username },
      data: {
        duration: input.duration,
        status: 'active',
        endTime: newEnd.toISOString(),
      },
    });

    return { ok: true };
  }
}
