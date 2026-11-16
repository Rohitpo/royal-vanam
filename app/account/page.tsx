import { Suspense } from "react";
import Link from "next/link";
import { getAuthContext } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="container-shell py-20 text-center text-[#7c6a4d]" role="status">Loading your account…</div>}>
      <AccountContent />
    </Suspense>
  );
}

async function AccountContent() {
  const auth = await getAuthContext();
  if (auth.status !== "signed-in") {
    return (
      <div className="container-shell py-20 text-center">
        <h1 className="font-serif text-4xl text-[#12372a]">Sign in to view your account</h1>
        <Link href="/login" className="mt-6 inline-flex rounded-full bg-[#12372a] px-6 py-3 text-sm font-medium text-[#f8f3e8]">Log in</Link>
      </div>
    );
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return <div className="container-shell py-20 text-center text-[#4d5b54]">Account database is not configured.</div>;

  const [{ data: profile }, { data: customer }] = await Promise.all([
    supabase.from("profiles").select("full_name, email, phone, role").eq("id", auth.userId).maybeSingle(),
    supabase.from("customers").select("business_name, gstin, wholesale_approved").eq("profile_id", auth.userId).maybeSingle(),
  ]);

  return (
    <div className="container-shell py-16">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.28em] text-[#7c6a4d]">My account</p>
        <h1 className="mt-3 font-serif text-5xl text-[#12372a]">Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}</h1>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <section className="rounded-[28px] border border-[#e6d7b1] bg-[#fffdf9] p-6">
          <h2 className="text-2xl font-semibold text-[#12372a]">Profile details</h2>
          <dl className="mt-5 space-y-3 text-[#4d5b54]">
            <div><dt className="text-xs uppercase tracking-[0.18em] text-[#7c6a4d]">Name</dt><dd>{profile?.full_name ?? "Not set"}</dd></div>
            <div><dt className="text-xs uppercase tracking-[0.18em] text-[#7c6a4d]">Email</dt><dd>{profile?.email ?? auth.email ?? "Not set"}</dd></div>
            <div><dt className="text-xs uppercase tracking-[0.18em] text-[#7c6a4d]">Mobile</dt><dd>{profile?.phone ?? "Not set"}</dd></div>
            <div><dt className="text-xs uppercase tracking-[0.18em] text-[#7c6a4d]">Account type</dt><dd>{customer?.wholesale_approved ? "Approved wholesale" : "Retail"}</dd></div>
          </dl>
        </section>

        <section className="rounded-[28px] border border-[#e6d7b1] bg-[#fffdf9] p-6">
          <h2 className="text-2xl font-semibold text-[#12372a]">Your account</h2>
          <p className="mt-4 text-[#4d5b54]">View your purchases or continue shopping Royal Vanam pantry essentials.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/orders" className="rounded-full bg-[#12372a] px-5 py-3 text-sm font-medium text-[#f8f3e8]">My orders</Link>
            <Link href="/shop" className="rounded-full border border-[#12372a] px-5 py-3 text-sm font-medium text-[#12372a]">Shop all</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
