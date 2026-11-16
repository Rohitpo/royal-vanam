"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState("");
  const [resending, setResending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Login is not configured yet. Add your Supabase project URL and publishable (or anon) key to .env.local, then restart the dev server.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: String(formData.get("email")).trim().toLowerCase(),
        password: String(formData.get("password")),
      });

      if (signInError) {
        if (signInError.code === "email_not_confirmed") {
          setUnconfirmedEmail(String(formData.get("email")).trim().toLowerCase());
          setError("Please confirm your email address using the link we sent before logging in.");
          return;
        }
        setError(signInError.message);
        return;
      }

      router.push("/account");
      router.refresh();
    } catch {
      setError("Could not connect to the account service. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function resendConfirmation() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !unconfirmedEmail) return;

    setError("");
    setResending(true);
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: unconfirmedEmail,
      options: { emailRedirectTo: `${window.location.origin}/account` },
    });
    setResending(false);
    setError(resendError ? resendError.message : `A new confirmation link has been sent to ${unconfirmedEmail}.`);
  }

  return (
    <div className="container-shell py-16">
      <div className="mx-auto max-w-md rounded-[32px] border border-[#e6d7b1] bg-[#fffdf9] p-8 shadow-lg">
        <p className="text-xs uppercase tracking-[0.28em] text-[#7c6a4d]">Welcome back</p>
        <h1 className="mt-3 font-serif text-4xl text-[#12372a]">Customer login</h1>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm text-[#4d5b54]">
            Email address
            <input name="email" type="email" autoComplete="email" required className="w-full rounded-xl border border-[#d9caa4] bg-white px-4 py-3 text-[#12372a]" />
          </label>
          <label className="grid gap-2 text-sm text-[#4d5b54]">
            Password
            <input name="password" type="password" autoComplete="current-password" required className="w-full rounded-xl border border-[#d9caa4] bg-white px-4 py-3 text-[#12372a]" />
          </label>
          {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
          {unconfirmedEmail && (
            <button type="button" onClick={resendConfirmation} disabled={resending} className="w-full text-sm font-medium text-[#765b2c] underline underline-offset-4 disabled:opacity-60">
              {resending ? "Sending confirmation…" : "Resend confirmation email"}
            </button>
          )}
          <button disabled={loading} className="w-full rounded-full bg-[#12372a] px-5 py-3 text-sm font-medium text-[#f8f3e8] disabled:opacity-60">
            {loading ? "Signing in…" : "Login"}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-[#4d5b54]">
          Need an account? <Link href="/register" className="font-semibold text-[#12372a]">Register here</Link>
        </div>
      </div>
    </div>
  );
}
