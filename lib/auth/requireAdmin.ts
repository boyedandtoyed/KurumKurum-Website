import { createClient } from "@/lib/supabase/server";

export interface AdminContext {
  userId: string;
  fullName: string | null;
}

/**
 * Returns the admin context if the current session belongs to an admin,
 * otherwise null. Used by the admin layout (pages) and every /api/admin/*
 * route (data) for defense in depth.
 */
export async function getAdminContext(): Promise<AdminContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, full_name")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return null;
  return { userId: user.id, fullName: profile.full_name };
}
