import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export type AuthContext =
  | { status: "not-configured" }
  | { status: "signed-out" }
  | { status: "role-unavailable" }
  | { status: "signed-in"; userId: string; email: string | null; role: string | null };

export async function getServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey || url.includes("example.supabase.co") || url.includes("your-project-id.supabase.co") || anonKey.startsWith("your-")) {
    return null;
  }

  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server components cannot mutate cookies; middleware or a route handler refreshes sessions.
        }
      },
    },
  });
}

export async function getAuthContext(): Promise<AuthContext> {
  const supabase = await getServerSupabaseClient();
  if (!supabase) return { status: "not-configured" };

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { status: "signed-out" };

  const admin = getSupabaseAdminClient();
  if (!admin) return { status: "role-unavailable" };

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Could not load profile role:", profileError.message);
    return { status: "role-unavailable" };
  }

  return { status: "signed-in", userId: user.id, email: user.email ?? null, role: profile?.role ?? null };
}
