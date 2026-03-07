import "server-only";

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

function getOptionalSupabaseServiceRoleKey(): string | null {
  return (
    getNonEmptyEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY) ||
    getNonEmptyEnvValue(process.env.SUPABASE_SERVICE_KEY)
  );
}

function getSupabaseServiceRoleKey(): string {
  const key = getOptionalSupabaseServiceRoleKey();

  if (!key) {
    throw new Error(
      "Missing Supabase service role key. Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY."
    );
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

export function getSupabaseServerWriteClient(accessToken: string): SupabaseClient {
  const serviceRoleKey = getOptionalSupabaseServiceRoleKey();
  if (serviceRoleKey) {
    return getSupabaseServerAdminClient();
  }

  const anonKey = getSupabaseAnonKey();
  return createClient(getSupabaseServerUrl(), anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
