"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

function getDisplayName(user: User) {
  const metadataName = user.user_metadata?.full_name;
  if (typeof metadataName === "string" && metadataName.trim()) return metadataName.trim();
  return user.email?.split("@")[0] ?? "Customer";
}

export function HeaderAccountMenu() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setSigningOut(true);
    await supabase.auth.signOut();
    setOpen(false);
    setSigningOut(false);
    router.refresh();
  }

  if (!user) {
    return (
      <Link href="/login" className="rounded-full border border-[#b48f3a] px-4 py-2 text-[#12372a]">
        Login
      </Link>
    );
  }

  const name = getDisplayName(user);
  const initial = name.charAt(0).toUpperCase();
  const phone = user.user_metadata?.phone;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Open ${name}'s account menu`}
        className="flex items-center gap-2 rounded-full border border-[#d9c99f] bg-[#fffdf9] py-1.5 pl-1.5 pr-3 text-left text-[#12372a] shadow-sm transition hover:border-[#b48f3a]"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#12372a] text-sm font-semibold text-[#f8f3e8]">{initial}</span>
        <span className="hidden max-w-32 truncate text-sm font-medium sm:block">{name}</span>
        <span aria-hidden="true" className="text-[10px] text-[#7c6a4d]">▾</span>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-3 w-72 rounded-2xl border border-[#e6d7b1] bg-[#fffdf9] p-3 text-[#12372a] shadow-[0_16px_48px_rgba(18,55,42,0.16)]">
          <div className="border-b border-[#eee4ce] px-3 py-3">
            <div className="font-semibold">{name}</div>
            <div className="mt-1 break-all text-xs text-[#6f766e]">{user.email}</div>
            {typeof phone === "string" && phone.trim() && <div className="mt-1 text-xs text-[#6f766e]">{phone}</div>}
          </div>
          <div className="grid gap-1 py-2 text-sm">
            <Link role="menuitem" href="/account" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2 hover:bg-[#f3ebdc]">My account</Link>
            <Link role="menuitem" href="/orders" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2 hover:bg-[#f3ebdc]">My orders</Link>
          </div>
          <button
            type="button"
            role="menuitem"
            disabled={signingOut}
            onClick={handleSignOut}
            className="w-full rounded-xl border-t border-[#eee4ce] px-3 py-3 text-left text-sm font-medium text-[#765b2c] hover:bg-[#f3ebdc] disabled:opacity-60"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
