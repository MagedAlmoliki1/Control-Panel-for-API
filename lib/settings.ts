// lib/settings.ts

import fs from 'fs';
import path from 'path';

const SETTINGS_PATH = path.join(process.cwd(), 'prisma', 'system_settings.json');

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

export function getSystemSettings(): SystemSettings {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) {
      saveSystemSettings(defaultSettings);
      return defaultSettings;
    }
    const content = fs.readFileSync(SETTINGS_PATH, 'utf-8');
    const parsed = JSON.parse(content);
    
    // Deep merge to ensure all properties exist
    return {
      api: { ...defaultSettings.api, ...parsed.api },
      pricePlans: Array.isArray(parsed.pricePlans) ? parsed.pricePlans : defaultSettings.pricePlans,
      expiryThresholdDays: typeof parsed.expiryThresholdDays === 'number' ? parsed.expiryThresholdDays : defaultSettings.expiryThresholdDays,
    };
  } catch (err) {
    console.error('Failed to read system settings, using defaults:', err);
    return defaultSettings;
  }
}

export function saveSystemSettings(settings: SystemSettings): boolean {
  try {
    // Format JSON with 2 spaces indent
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to write system settings:', err);
    return false;
  }
}
