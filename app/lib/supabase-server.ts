import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;
let publicClient: SupabaseClient | null = null;

function getNonEmptyEnvValue(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function getSupabaseServerUrl(): string {
  const url =
    getNonEmptyEnvValue(process.env.SUPABASE_URL) ||
    getNonEmptyEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);

  if (!url) {
    throw new Error("Missing Supabase URL. Set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.");
  }

  return url;
}

function getSupabaseServiceRoleKey(): string {
  const key = getNonEmptyEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!key) {
    throw new Error("Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY");
  }

  return key;
}

function getSupabaseAnonKey(): string {
  const key = getNonEmptyEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!key) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return key;
}

export function getSupabaseServerAdminClient(): SupabaseClient {
  if (adminClient) return adminClient;

  adminClient = createClient(getSupabaseServerUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return adminClient;
}

export function getSupabaseServerPublicClient(): SupabaseClient {
  if (publicClient) return publicClient;

  publicClient = createClient(getSupabaseServerUrl(), getSupabaseAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return publicClient;
}
