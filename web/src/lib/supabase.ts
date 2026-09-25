import { createClient } from '@supabase/supabase-js';

/**
 * Browser-side Supabase client.
 * Uses the anon public key — safe to expose in client bundles.
 * Used for: Realtime subscriptions on dashboard/live-location pages.
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);
