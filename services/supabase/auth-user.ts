import { supabase } from '@/lib/supabase';

export async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getCurrentUserCreatedAt(): Promise<Date | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.created_at) return null;
  const createdAt = new Date(user.created_at);
  return Number.isNaN(createdAt.getTime()) ? null : createdAt;
}
