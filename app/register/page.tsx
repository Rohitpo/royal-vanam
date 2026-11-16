"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Account registration is not configured yet. Add your Supabase project URL and anon key to .env.local, then restart the dev server.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const fullName = `${formData.get("firstName")} ${formData.get("lastName")}`.trim();
    const email = String(formData.get("email")).trim().toLowerCase();
    const phone = String(formData.get("phone")).trim();
    const password = String(formData.get("password"));

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone },
        emailRedirectTo: `${window.location.origin}/account`,
      },
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      router.push("/account");
      router.refresh();
      return;
    }

    setMessage("Your account has been created. Check your email for the confirmation link before logging in.");
    setConfirmationEmail(email);
  }

  async function resendConfirmation() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !confirmationEmail) return;

    setError("");
    setResending(true);
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: confirmationEmail,
      options: { emailRedirectTo: `${window.location.origin}/account` },
    });
    setResending(false);

    if (resendError) {
      setError(resendError.message);
      return;
    }
    setMessage(`A new confirmation link has been sent to ${confirmationEmail}.`);
  }

  return (
    <div className="container-shell py-16">
      <div className="mx-auto max-w-xl rounded-[32px] border border-[#e6d7b1] bg-[#fffdf9] p-8 shadow-lg">
        <p className="text-xs uppercase tracking-[0.28em] text-[#7c6a4d]">New account</p>
        <h1 className="mt-3 font-serif text-4xl text-[#12372a]">Create your Royal Vanam account</h1>

        <form className="mt-8 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm text-[#4d5b54]">
            First name
            <input name="firstName" autoComplete="given-name" required className="rounded-xl border border-[#d9caa4] bg-white px-4 py-3 text-[#12372a]" />
          </label>
          <label className="grid gap-2 text-sm text-[#4d5b54]">
            Last name
            <input name="lastName" autoComplete="family-name" required className="rounded-xl border border-[#d9caa4] bg-white px-4 py-3 text-[#12372a]" />
          </label>
          <label className="md:col-span-2 grid gap-2 text-sm text-[#4d5b54]">
            Email address
            <input name="email" type="email" autoComplete="email" required className="rounded-xl border border-[#d9caa4] bg-white px-4 py-3 text-[#12372a]" />
          </label>
          <label className="md:col-span-2 grid gap-2 text-sm text-[#4d5b54]">
            Mobile number
            <input name="phone" type="tel" autoComplete="tel" required className="rounded-xl border border-[#d9caa4] bg-white px-4 py-3 text-[#12372a]" />
          </label>
          <label className="md:col-span-2 grid gap-2 text-sm text-[#4d5b54]">
            Password
            <input name="password" type="password" autoComplete="new-password" minLength={8} required className="rounded-xl border border-[#d9caa4] bg-white px-4 py-3 text-[#12372a]" />
            <span className="text-xs text-[#7a6e58]">Use at least 8 characters.</span>
          </label>

          {error && <p role="alert" className="md:col-span-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
          {message && <p role="status" className="md:col-span-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
          {confirmationEmail && (
            <button type="button" onClick={resendConfirmation} disabled={resending} className="md:col-span-2 text-sm font-medium text-[#765b2c] underline underline-offset-4 disabled:opacity-60">
              {resending ? "Sending confirmation…" : "Resend confirmation email"}
            </button>
          )}

          <button disabled={loading} className="md:col-span-2 rounded-full bg-[#12372a] px-5 py-3 text-sm font-medium text-[#f8f3e8] disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[#4d5b54]">
          Already have an account? <Link href="/login" className="font-semibold text-[#12372a]">Log in</Link>
        </p>
      </div>
    </div>
  );
}
