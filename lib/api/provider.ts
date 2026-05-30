// lib/api/provider.ts

export interface ExternalUser {
  username: string;
  base_id: string;
  duration: string;
  status: 'active' | 'expired' | 'suspended';
  createdAt: string;
}

export interface ExternalLog {
  user_id: string;
  login_time: string; // ISO string
  ip: string;
  duration_seconds: number;
}

export interface ExternalStatus {
  username: string;
  status: 'active' | 'expired' | 'suspended';
  end_time: string; // ISO string
}

export interface SubscriptionProvider {
  addUser(input: { base_id: string; username: string; duration: string }): Promise<{ ok: boolean; raw?: unknown }>;
  removeUser(input: { username: string }): Promise<{ ok: boolean }>;
  listUsers(): Promise<ExternalUser[]>;
  getLogs(input: { user_id: string; date_from?: string; date_to?: string }): Promise<ExternalLog[]>;
  getUserStatus(input: { user_id: string }): Promise<ExternalStatus>;
  renewUser(input: { username: string; duration: string }): Promise<{ ok: boolean }>;
}
