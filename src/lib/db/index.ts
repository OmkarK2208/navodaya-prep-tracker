import { IDataRepository } from './repository';
import { LocalPersistentRepository } from './local-db';
import { SupabaseRepository } from './supabase-db';
import { isSupabaseConfigured } from '../supabase/config';

let localRepoInstance: LocalPersistentRepository | null = null;
let supabaseRepoInstance: SupabaseRepository | null = null;

export function getDataRepository(): IDataRepository {
  if (isSupabaseConfigured()) {
    if (!supabaseRepoInstance) {
      supabaseRepoInstance = new SupabaseRepository();
    }
    return supabaseRepoInstance;
  }

  if (!localRepoInstance) {
    localRepoInstance = new LocalPersistentRepository();
  }
  return localRepoInstance;
}

export function getRepositoryMode(): 'supabase' | 'local' {
  return isSupabaseConfigured() ? 'supabase' : 'local';
}
