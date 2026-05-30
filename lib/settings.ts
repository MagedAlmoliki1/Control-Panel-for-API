// lib/settings.ts
// Settings are stored in the `SystemSetting` database table (key="singleton")
// instead of the filesystem so they work on Vercel's read-only environment.

import { prisma } from './db';

export interface PricePlan {
  label: string;
  duration: string;
  price: number;
  currency: string;
}

export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number; // in seconds
  providerType: 'MOCK' | 'REAL';
}

export interface SystemSettings {
  api: ApiConfig;
  pricePlans: PricePlan[];
  expiryThresholdDays: number;
}

const defaultSettings: SystemSettings = {
  api: {
    baseUrl: 'https://api.partner-software.com/v1',
    apiKey: 'mock_api_key_xyz_123_abc',
    timeout: 5,
    providerType: 'MOCK',
  },
  pricePlans: [
    { label: 'ساعتين', duration: '2 hours', price: 5, currency: 'SAR' },
    { label: 'يوم واحد', duration: '1 day', price: 15, currency: 'SAR' },
    { label: '3 أيام', duration: '3 days', price: 30, currency: 'SAR' },
    { label: 'أسبوع واحد', duration: '1 week', price: 60, currency: 'SAR' },
    { label: 'شهر واحد', duration: '1 month', price: 150, currency: 'SAR' },
    { label: '3 أشهر', duration: '3 months', price: 400, currency: 'SAR' },
    { label: '6 أشهر', duration: '6 months', price: 700, currency: 'SAR' },
    { label: 'سنة واحدة', duration: '1 year', price: 1200, currency: 'SAR' },
  ],
  expiryThresholdDays: 3,
};

export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const row = await prisma.systemSetting.findUnique({ where: { id: 'singleton' } });
    if (!row) {
      await saveSystemSettings(defaultSettings);
      return defaultSettings;
    }
    const parsed = JSON.parse(row.data);
    // Deep merge to ensure all properties exist
    return {
      api: { ...defaultSettings.api, ...parsed.api },
      pricePlans: Array.isArray(parsed.pricePlans) ? parsed.pricePlans : defaultSettings.pricePlans,
      expiryThresholdDays:
        typeof parsed.expiryThresholdDays === 'number'
          ? parsed.expiryThresholdDays
          : defaultSettings.expiryThresholdDays,
    };
  } catch (err) {
    console.error('Failed to read system settings, using defaults:', err);
    return defaultSettings;
  }
}

export async function saveSystemSettings(settings: SystemSettings): Promise<boolean> {
  try {
    await prisma.systemSetting.upsert({
      where: { id: 'singleton' },
      update: { data: JSON.stringify(settings) },
      create: { id: 'singleton', data: JSON.stringify(settings) },
    });
    return true;
  } catch (err) {
    console.error('Failed to write system settings:', err);
    return false;
  }
}
