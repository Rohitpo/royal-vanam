import { Suspense } from "react";
import { PortalAccessGate } from "@/components/portal-access-gate";
import { SupplierAssignments } from "@/components/supplier-assignments";
import { getAuthContext } from "@/lib/supabase-server";

export default function SupplierPage() {
  return (
    <Suspense fallback={<div className="container-shell py-20 text-center text-[#7c6a4d]" role="status">Loading supplier portal…</div>}>
      <SupplierContent />
    </Suspense>
  );
}

async function SupplierContent() {
  const auth = await getAuthContext();
  if (auth.status !== "signed-in" || auth.role !== "supplier") {
    return <PortalAccessGate auth={auth} expectedRole="supplier" />;
  }

  return (
    <div className="container-shell py-16">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.28em] text-[#7c6a4d]">Supplier portal</p>
        <h1 className="mt-3 font-serif text-5xl text-[#12372a]">Assigned order queue</h1>
        <p className="mt-3 text-[#4d5b54]">Orders and customer delivery details assigned specifically to your supplier account.</p>
      </div>
      <SupplierAssignments />
    </div>
  );
}
