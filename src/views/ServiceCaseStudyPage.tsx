"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart3, ImageIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSiteData } from "@/SiteDataContext";
import { getIcon } from "@/lib/icons";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { requireFirestore } from "@/firebase";

type StatCard = {
  label: string;
  value: string | number;
  sub?: string;
};

type InfographicCard = {
  title: string;
  description?: string;
  image_url?: string;
};

function safeParseArray<T>(raw: string | undefined, fallback: T[]): T[] {
  if (!raw?.trim()) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

export default function ServiceCaseStudyPage({ serviceId }: { serviceId: string }) {
  const { services, loading } = useSiteData();
  const [directStatus, setDirectStatus] = useState<"idle" | "loading" | "done">("idle");
  const [directService, setDirectService] = useState<any | null>(null);

  const service = useMemo(() => {
    return (
      services.find((s) => String(s.id) === String(serviceId)) ??
      directService
    );
  }, [services, serviceId, directService]);

  useEffect(() => {
    let cancelled = false;
    // If the service isn't in SiteData (e.g. query failed / fallback), try loading it by doc id.
    if (!serviceId) return;
    const existsInList = services.some((s) => String(s.id) === String(serviceId));
    if (existsInList) return;
    if (directStatus !== "idle") return; // already tried
    (async () => {
      if (!cancelled) setDirectStatus("loading");
      try {
        const db = requireFirestore();
        const snap = await getDoc(doc(db, "services", serviceId));
        if (snap.exists()) {
          if (!cancelled) setDirectService({ ...(snap.data() as any), id: snap.id });
          return;
        }

        // Fallback for legacy data: try finding by numeric field id or legacy_id string.
        const numeric = Number(serviceId);
        if (!isNaN(numeric)) {
          const q1 = query(collection(db, "services"), where("id", "==", numeric));
          const snaps1 = await getDocs(q1);
          const first = snaps1.docs[0];
          if (first?.exists()) {
            if (!cancelled) setDirectService({ ...(first.data() as any), id: first.id });
            return;
          }
        }
        const q2 = query(collection(db, "services"), where("legacy_id", "==", serviceId));
        const snaps2 = await getDocs(q2);
        const first2 = snaps2.docs[0];
        if (first2?.exists()) {
          if (!cancelled) setDirectService({ ...(first2.data() as any), id: first2.id });
          return;
        }

        if (!cancelled) setDirectService(null);
      } catch {
        if (!cancelled) setDirectService(null);
      } finally {
        if (!cancelled) setDirectStatus("done");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [serviceId, services, directStatus]);

  const stats = useMemo(() => {
    return safeParseArray<StatCard>(service?.case_study_stats, [
      { label: "Deliverables", value: "—", sub: "Reels, cuts, assets" },
      { label: "Shoot time", value: "—", sub: "On-set production" },
      { label: "Turnaround", value: "—", sub: "Edit & delivery" },
      { label: "Platforms", value: "—", sub: "IG, TikTok, YouTube" },
    ]);
  }, [service?.case_study_stats]);

  const infographics = useMemo(() => {
    const raw = safeParseArray<InfographicCard>(service?.case_study_infographics, []);
    const cleaned = raw
      .map((x) => ({
        title: String(x?.title ?? "").trim(),
        description: x?.description ? String(x.description).trim() : "",
        image_url: x?.image_url ? String(x.image_url).trim() : "",
      }))
      .filter((x) => x.title || x.description || x.image_url);

    if (cleaned.length > 0) return cleaned;

    // Auto-generate a simple infographic list from stats if none provided.
    return (stats || [])
      .filter((s) => String(s.label ?? "").trim())
      .slice(0, 6)
      .map((s) => ({
        title: String(s.label ?? "").trim(),
        description: [String(s.value ?? "").trim(), (s.sub ?? "").trim()].filter(Boolean).join(" · "),
        image_url: "",
      }));
  }, [service?.case_study_infographics, stats]);

  const Icon = service ? getIcon(service.icon) : null;

  const isWaiting = (!service && loading) || (!service && directStatus === "loading");
  if (isWaiting) {
    return (
      <div className="site-wrapper min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray to-[#111521] text-white">
        <Navbar />
        <main className="py-28">
          <div className="max-w-6xl mx-auto px-6 md:px-12">
            <p className="text-gray-400">Loading…</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="site-wrapper min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray to-[#111521] text-white">
        <Navbar />
        <main className="py-28">
          <div className="max-w-6xl mx-auto px-6 md:px-12">
            <Link href="/#services" className="inline-flex items-center gap-2 text-gray-400 hover:text-icube-gold transition-colors">
              <ArrowLeft size={18} /> Back to services
            </Link>
            <h1 className="mt-6 text-3xl md:text-4xl font-display font-bold">Service not found</h1>
            <p className="text-gray-400 mt-2">This case study page doesn’t exist yet.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="site-wrapper min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray to-[#111521] text-white selection:bg-icube-gold selection:text-icube-dark">
      <Navbar />

      <main className="relative pt-24 md:pt-28 pb-20">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <Link
            href="/#services"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-icube-gold text-sm font-medium mb-10 transition-colors"
          >
            <ArrowLeft size={18} />
            Back to services
          </Link>

          <header className="glass-card rounded-2xl border border-white/10 bg-white/[0.04] p-8 md:p-10 overflow-hidden relative">
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-icube-gold/5 rounded-full blur-[110px] pointer-events-none" aria-hidden />
            <div className="relative z-10 flex items-start gap-6">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-black/40 border border-white/10">
                {Icon ? <Icon size={24} className="text-icube-gold" /> : <BarChart3 size={24} className="text-icube-gold" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Dedicated case study</p>
                <h1 className="mt-2 text-3xl md:text-4xl font-display font-bold tracking-tight text-white">
                  {service.title}
                </h1>
                <p className="mt-3 text-gray-400 font-light leading-relaxed max-w-3xl">
                  {service.description}
                </p>
              </div>
            </div>
          </header>

          {/* Stats & Infographics */}
          <section className="mt-10 md:mt-12">
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-display font-bold">Project stats & infographics</h2>
                <p className="text-gray-400 font-light mt-1">
                  Add your KPIs, deliverables, and visuals for this service.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                  <BarChart3 size={18} className="text-icube-gold" />
                  Stats
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {stats.slice(0, 6).map((s, idx) => (
                    <div
                      key={idx}
                      className="glass-card rounded-2xl border border-white/10 bg-white/[0.04] p-5 hover:border-icube-gold/25 transition-colors"
                    >
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{s.label}</p>
                      <p className="mt-2 text-2xl font-display font-bold text-white">{s.value}</p>
                      {s.sub ? <p className="mt-1 text-gray-400 text-sm font-light">{s.sub}</p> : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                  <ImageIcon size={18} className="text-icube-gold" />
                  Infographics
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {infographics.slice(0, 6).map((ig, idx) => (
                    <div
                      key={idx}
                      className="glass-card rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden hover:border-icube-gold/25 transition-colors"
                    >
                      <div className="aspect-[16/10] bg-black/30 border-b border-white/10 flex items-center justify-center">
                        {ig.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={ig.image_url} alt={ig.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-gray-500 text-sm flex items-center gap-2">
                            <ImageIcon size={18} />
                            Add infographic image
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <p className="text-white font-display font-semibold">{ig.title}</p>
                        {ig.description ? (
                          <p className="text-gray-400 text-sm font-light mt-1 leading-relaxed">{ig.description}</p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

