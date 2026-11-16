import Link from "next/link";
import type { AuthContext } from "@/lib/supabase-server";

export function PortalAccessGate({ auth, expectedRole }: { auth: AuthContext; expectedRole: "admin" | "supplier" }) {
  let title = "Access required";
  let detail = "Sign in with an authorized account to continue.";

  if (auth.status === "not-configured") {
    title = "Portal authentication is not configured";
    detail = "Add Supabase credentials to .env.local, apply the database migrations, and restart the server.";
  } else if (auth.status === "role-unavailable") {
    title = "Account role could not be verified";
    detail = "The profile database is unavailable. Contact the administrator; access is denied until the role can be checked.";
  } else if (auth.status === "signed-in" && auth.role !== expectedRole) {
    title = "You do not have access to this portal";
    detail = `This area is restricted to ${expectedRole} accounts.`;
  }

  return (
    <div className="container-shell py-20">
      <section className="mx-auto max-w-2xl rounded-[28px] border border-[#e6d7b1] bg-[#fffdf9] p-8 text-center">
        <p className="text-xs uppercase tracking-[0.28em] text-[#7c6a4d]">Protected portal</p>
        <h1 className="mt-3 font-serif text-4xl text-[#12372a]">{title}</h1>
        <p className="mt-4 text-[#4d5b54]">{detail}</p>
        {auth.status === "signed-out" && (
          <Link href="/login" className="mt-7 inline-flex rounded-full bg-[#12372a] px-6 py-3 text-sm font-medium text-[#f8f3e8]">Sign in</Link>
        )}
      </section>
    </div>
  );
}
