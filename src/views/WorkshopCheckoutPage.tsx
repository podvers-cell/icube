"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CreditCard } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSiteData } from "@/SiteDataContext";
import { enrollWorkshop } from "@/api";
import { isWorkshopSoldOut } from "@/utils/workshopCapacity";

export default function WorkshopCheckoutPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : "";
  const { workshops } = useSiteData();

  const w = useMemo(() => {
    const list = Array.isArray(workshops) ? workshops : [];
    return list.find((x) => String((x as any).id) === String(id)) || null;
  }, [workshops, id]);
  const soldOut = useMemo(() => (w ? isWorkshopSoldOut(w as any) : false), [w]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [paying, setPaying] = useState(false);

  async function onPayNow(e: FormEvent) {
    e.preventDefault();
    if (!w) return;
    if (soldOut) return alert("This workshop is sold out.");
    if (!fullName.trim()) return alert("Name is required");
    if (!email.trim()) return alert("Email is required");
    if (!phone.trim()) return alert("Phone is required");

    try {
      setPaying(true);
      const { enrollment_id, checkout_token } = await enrollWorkshop({
        workshop_id: String((w as any).id),
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });

      const res = await fetch("/api/payments/ziina/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingType: "workshop",
          workshopEnrollmentId: enrollment_id,
          checkoutToken: checkout_token,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { redirect_url?: string; error?: string };
      if (!res.ok || !body.redirect_url) throw new Error(body.error || "Payment initialization failed");
      window.location.href = body.redirect_url;
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setPaying(false);
    }
  }

  if (!w) {
    return (
      <div className="site-wrapper min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray to-icube-dark/80 text-white">
        <Navbar />
        <main className="mx-auto max-w-3xl px-6 md:px-12 py-24">
          <Link href="/#workshops" className="inline-flex items-center gap-2 text-gray-400 hover:text-icube-gold">
            <ArrowLeft size={18} />
            Back to workshops
          </Link>
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-8">
            <p className="text-gray-300">Workshop not found.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const price = Number((w as any).price_aed ?? 0);

  return (
    <div className="site-wrapper min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray to-icube-dark/80 text-white">
      <Navbar />
      <main className="relative py-24 md:py-28">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-icube-gold text-sm font-medium transition-colors"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            <section className="lg:col-span-3 rounded-2xl border border-white/10 bg-white/[0.04] p-6 md:p-7">
              <p className="text-xs uppercase tracking-[0.2em] text-icube-gold">Workshop checkout</p>
              <h1 className="mt-2 text-2xl md:text-3xl font-display font-bold">Enroll in {(w as any).title}</h1>
              <p className="mt-2 text-sm text-gray-400">
                Date: <span className="text-gray-200">{(w as any).workshop_date || "To be announced"}</span>
              </p>

              <form onSubmit={onPayNow} className="mt-6 space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-[0.18em] text-gray-400">Full name</label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-icube-gold/50"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.18em] text-gray-400">Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-icube-gold/50"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.18em] text-gray-400">Phone</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-icube-gold/50"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={paying || soldOut}
                  className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-icube-gold px-4 py-3 text-xs font-semibold uppercase tracking-wider text-icube-dark hover:bg-icube-gold-light transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  <CreditCard size={14} />
                  {soldOut ? "Sold out" : "Pay now (Ziina)"}
                </button>
                <p className="text-xs text-gray-500">
                  {soldOut ? "This workshop is sold out." : "You’ll be redirected to Ziina to complete payment securely."}
                </p>
              </form>
            </section>

            <aside className="lg:col-span-2 rounded-2xl border border-white/10 bg-black/25 p-6 md:p-7 sticky top-24">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Summary</p>
              <div className="mt-3 space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-400">Workshop</span>
                  <span className="text-gray-200 text-right">{(w as any).title}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-400">Date</span>
                  <span className="text-gray-200">{(w as any).workshop_date || "TBA"}</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between gap-3 font-semibold">
                  <span>Total</span>
                  <span className="text-icube-gold">AED {price}</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
