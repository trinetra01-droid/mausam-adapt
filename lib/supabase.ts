import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variable extraction supporting both Vite client (import.meta.env) and Node server (process.env)
const getEnv = (key: string, viteKey: string, fallback: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      if (import.meta.env[viteKey]) return import.meta.env[viteKey];
      if (import.meta.env[key]) return import.meta.env[key];
    }
  } catch {
    // Ignore in non-Vite environments
  }

  try {
    if (typeof process !== 'undefined' && process.env) {
      if (process.env[key]) return process.env[key];
      if (process.env[viteKey]) return process.env[viteKey];
    }
  } catch {
    // Ignore in browser environments without process
  }

  return fallback;
};

// Project credentials with fallback to active Supabase project
export const SUPABASE_URL = getEnv('SUPABASE_URL', 'VITE_SUPABASE_URL', 'https://zipkqmqtaaraidyraikb.supabase.co');
export const SUPABASE_ANON_KEY = getEnv(
  'SUPABASE_ANON_KEY',
  'VITE_SUPABASE_ANON_KEY',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppcGtxbXF0YWFyYWlkeXJhaWtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzODU5MTMsImV4cCI6MjEwNjk2MTkxM30.fT4pt9lVzOR_pfXUiO3xSWtXhaYeukT0FV_pWWiqC8Y'
);

/**
 * Initializes and exports the Supabase client singleton instance.
 */
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: typeof window !== 'undefined',
    autoRefreshToken: typeof window !== 'undefined',
    detectSessionInUrl: typeof window !== 'undefined',
  },
});

export interface ConnectionStatusResult {
  isConnected: boolean;
  isConfigured: boolean;
  status: 'connected' | 'unconfigured' | 'error';
  message: string;
  latencyMs?: number;
  timestamp: string;
  endpoint: string;
  error?: string;
}

/**
 * Checks the connection status of the Supabase database integration.
 * Verifies if valid credentials are provided and tests connectivity against the Supabase API.
 */
export async function checkConnectionStatus(): Promise<ConnectionStatusResult> {
  const timestamp = new Date().toISOString();
  const isDefaultPlaceholder =
    SUPABASE_URL.includes('your-project.supabase.co') ||
    SUPABASE_ANON_KEY.includes('placeholder-key') ||
    !SUPABASE_URL ||
    !SUPABASE_ANON_KEY;

  if (isDefaultPlaceholder) {
    return {
      isConnected: false,
      isConfigured: false,
      status: 'unconfigured',
      message: 'Supabase credentials are not configured yet. Set SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_ANON_KEY (or VITE_SUPABASE_ANON_KEY) in your environment variables.',
      endpoint: SUPABASE_URL,
      timestamp,
    };
  }

  const startTime = Date.now();

  try {
    // Probe Supabase REST / Auth service to verify reachability and credential acceptance
    const { error } = await supabase.auth.getSession();
    const latencyMs = Date.now() - startTime;

    if (error) {
      return {
        isConnected: false,
        isConfigured: true,
        status: 'error',
        message: `Failed to connect to Supabase: ${error.message}`,
        latencyMs,
        endpoint: SUPABASE_URL,
        timestamp,
        error: error.message,
      };
    }

    return {
      isConnected: true,
      isConfigured: true,
      status: 'connected',
      message: 'Successfully connected to Supabase database & authentication service.',
      latencyMs,
      endpoint: SUPABASE_URL,
      timestamp,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : String(err);

    return {
      isConnected: false,
      isConfigured: true,
      status: 'error',
      message: `Network or configuration error connecting to Supabase: ${errorMessage}`,
      latencyMs,
      endpoint: SUPABASE_URL,
      timestamp,
      error: errorMessage,
    };
  }
}

export default supabase;
