// Utility to check if Supabase has live valid credentials

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return false;
  if (url.includes('placeholder') || anonKey.includes('placeholder')) return false;
  if (!url.startsWith('https://')) return false;

  return true;
}

export function isSupabaseAdminConfigured(): boolean {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey || serviceRoleKey.includes('placeholder')) return false;
  return isSupabaseConfigured();
}
