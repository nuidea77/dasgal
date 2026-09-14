import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { WorkoutRecord } from '@/store/types';
import { UserProfile } from '@/domain/profile/types';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

/** Returns the Supabase client, or null when the app runs in local-only mode. */
export function getSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  if (!client) client = createClient(url, anonKey, { auth: { persistSession: false } });
  return client;
}

export function isCloudConfigured(): boolean {
  return Boolean(url && anonKey);
}

/**
 * Best-effort upsert of profile + progress. Only numeric/JSON stats are sent —
 * no camera data ever leaves the device. Silently no-ops offline.
 *
 * Expected tables (see supabase/schema.sql):
 *   profiles(device_id text pk, profile jsonb, updated_at timestamptz)
 *   workouts(id text pk, device_id text, record jsonb, date date)
 */
export async function syncToCloud(deviceId: string, profile: UserProfile | null, history: WorkoutRecord[]): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    if (profile) {
      await sb.from('profiles').upsert({ device_id: deviceId, profile, updated_at: new Date().toISOString() });
    }
    if (history.length > 0) {
      const rows = history.slice(-50).map((r) => ({ id: r.id, device_id: deviceId, record: r, date: r.date }));
      await sb.from('workouts').upsert(rows, { onConflict: 'id' });
    }
    return true;
  } catch {
    return false;
  }
}
