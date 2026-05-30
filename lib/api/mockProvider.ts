// lib/api/mockProvider.ts

import fs from 'fs';
import path from 'path';
import { SubscriptionProvider, ExternalUser, ExternalLog, ExternalStatus } from './provider';

const STORE_PATH = path.join(process.cwd(), 'prisma', 'mock_api_store.json');

interface MockStore {
  users: Array<{
    username: string;
    base_id: string;
    duration: string;
    status: 'active' | 'expired' | 'suspended';
    createdAt: string;
    endTime: string;
  }>;
  logs: ExternalLog[];
}

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
      // Default fallback 1 month
      date.setMonth(date.getMonth() + 1);
  }
  return date;
}

export class MockProvider implements SubscriptionProvider {
  private initStore(): MockStore {
    if (!fs.existsSync(STORE_PATH)) {
      const initial: MockStore = {
        users: [
          {
            username: 'test_user_1',
            base_id: 'base_100',
            duration: '1 month',
            status: 'active',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            endTime: getDurationDate('1 month', new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)).toISOString()
          },
          {
            username: 'test_user_2',
            base_id: 'base_101',
            duration: '3 days',
            status: 'expired',
            createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            endTime: getDurationDate('3 days', new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)).toISOString()
          }
        ],
        logs: [
          {
            user_id: 'test_user_1',
            login_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            ip: '192.168.1.10',
            duration_seconds: 3600
          },
          {
            user_id: 'test_user_1',
            login_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            ip: '192.168.1.15',
            duration_seconds: 7200
          },
          {
            user_id: 'test_user_2',
            login_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            ip: '82.165.44.12',
            duration_seconds: 1200
          }
        ]
      };
      fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    try {
      const content = fs.readFileSync(STORE_PATH, 'utf-8');
      return JSON.parse(content);
    } catch {
      return { users: [], logs: [] };
    }
  }

  private saveStore(store: MockStore) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  }

  async addUser(input: { base_id: string; username: string; duration: string }): Promise<{ ok: boolean; raw?: unknown }> {
    const store = this.initStore();
    const existing = store.users.find(u => u.username === input.username);
    const now = new Date();
    const endTime = getDurationDate(input.duration, now);

    if (existing) {
      existing.base_id = input.base_id;
      existing.duration = input.duration;
      existing.status = 'active';
      existing.createdAt = now.toISOString();
      existing.endTime = endTime.toISOString();
    } else {
      store.users.push({
        username: input.username,
        base_id: input.base_id,
        duration: input.duration,
        status: 'active',
        createdAt: now.toISOString(),
        endTime: endTime.toISOString()
      });
    }

    // Add a quick login log for the new user activation
    const ips = ['197.34.200.12', '188.45.10.82', '82.165.44.12', '5.100.92.15'];
    const randomIp = ips[Math.floor(Math.random() * ips.length)];
    store.logs.push({
      user_id: input.username,
      login_time: now.toISOString(),
      ip: randomIp,
      duration_seconds: 180 // 3 minutes test
    });

    this.saveStore(store);
    return { ok: true, raw: { mock_success: true, time: now.toISOString() } };
  }

  async removeUser(input: { username: string }): Promise<{ ok: boolean }> {
    const store = this.initStore();
    const existing = store.users.find(u => u.username === input.username);
    if (existing) {
      existing.status = 'suspended';
      this.saveStore(store);
      return { ok: true };
    }
    return { ok: false };
  }

  async listUsers(): Promise<ExternalUser[]> {
    const store = this.initStore();
    return store.users.map(u => ({
      username: u.username,
      base_id: u.base_id,
      duration: u.duration,
      status: u.status,
      createdAt: u.createdAt
    }));
  }

  async getLogs(input: { user_id: string; date_from?: string; date_to?: string }): Promise<ExternalLog[]> {
    const store = this.initStore();
    let results = store.logs;

    if (input.user_id) {
      results = results.filter(l => l.user_id.toLowerCase().includes(input.user_id.toLowerCase()));
    }

    if (input.date_from) {
      const from = new Date(input.date_from).getTime();
      results = results.filter(l => new Date(l.login_time).getTime() >= from);
    }

    if (input.date_to) {
      const to = new Date(input.date_to).getTime();
      results = results.filter(l => new Date(l.login_time).getTime() <= to);
    }

    return results;
  }

  async getUserStatus(input: { user_id: string }): Promise<ExternalStatus> {
    const store = this.initStore();
    const u = store.users.find(x => x.username === input.user_id);
    if (!u) {
      throw new Error('User not found on mock provider');
    }
    
    // Check if subscription has expired in the mock store
    const now = new Date();
    const isExpired = new Date(u.endTime).getTime() < now.getTime();
    const finalStatus = isExpired && u.status === 'active' ? 'expired' : u.status;

    if (finalStatus !== u.status) {
      u.status = finalStatus as 'active' | 'expired' | 'suspended';
      this.saveStore(store);
    }

    return {
      username: u.username,
      status: u.status,
      end_time: u.endTime
    };
  }

  async renewUser(input: { username: string; duration: string }): Promise<{ ok: boolean }> {
    const store = this.initStore();
    const u = store.users.find(x => x.username === input.username);
    if (!u) {
      return { ok: false };
    }

    const now = new Date();
    const currentEnd = new Date(u.endTime);
    // If active and not expired, extend from the current end date. Otherwise, start from now.
    const startFrom = currentEnd.getTime() > now.getTime() && u.status === 'active' ? currentEnd : now;
    const newEnd = getDurationDate(input.duration, startFrom);

    u.duration = input.duration;
    u.status = 'active';
    u.endTime = newEnd.toISOString();

    this.saveStore(store);
    return { ok: true };
  }
}
