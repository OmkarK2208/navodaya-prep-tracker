import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isSupabaseConfigured, isSupabaseAdminConfigured } from '../supabase/config';

describe('Environment Variable Validation', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('detects placeholder or missing Supabase credentials correctly', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://placeholder.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'placeholder-anon-key';
    expect(isSupabaseConfigured()).toBe(false);

    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    expect(isSupabaseConfigured()).toBe(false);
  });

  it('validates genuine live Supabase URL and keys', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://abcdefghijkl.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service';

    expect(isSupabaseConfigured()).toBe(true);
    expect(isSupabaseAdminConfigured()).toBe(true);
  });
});
