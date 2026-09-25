import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase admin client.
 * Uses the service_role key — NEVER import this in client-side code.
 * Used in: API route handlers only (POST /api/device/telemetry, etc.)
 * Bypasses Row Level Security — has full DB access.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
