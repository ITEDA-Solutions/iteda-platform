// Centralized Supabase Database Client
// Use this for all server-side database operations instead of Drizzle ORM

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Get the Supabase admin client for server-side database operations.
 * Uses service role key to bypass RLS policies.
 * This client should only be used in API routes, never on the client side.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  supabaseInstance = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseInstance;
}

// Export a default instance for convenience
export const supabaseAdmin = {
  get client() {
    return getSupabaseAdmin();
  },

  // Convenience methods for common operations
  from(table: string) {
    return getSupabaseAdmin().from(table);
  },

  auth: {
    getUser(token: string) {
      return getSupabaseAdmin().auth.getUser(token);
    },
  },
};

export default supabaseAdmin;
