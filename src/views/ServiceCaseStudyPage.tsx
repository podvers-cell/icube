"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BriefcaseBusiness } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSiteData } from "@/SiteDataContext";
import { getIcon } from "@/lib/icons";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { requireFirestore } from "@/firebase";
import Image from "next/image";
import { cloudinaryImage } from "@/lib/cloudinaryImage";

type CaseStudyItem = {
  title: string;
  client?: string;
  challenge?: string;
  solution?: string;
  outcome?: string;
  image_url?: string;
  video_url?: string;
  metrics?: string[];
};

function safeParseArray<T>(raw: unknown, fallback: T[]): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (typeof raw === "string") {
    if (!raw.trim()) return fallback;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as T[]) : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function getEmbedUrl(rawUrl: string): string | null {
  const url = rawUrl.trim();
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname === "/watch") {
        const v = u.searchParams.get("v");
        if (v) return `https://www.youtube.com/embed/${v}`;
      }
      if (u.pathname.startsWith("/embed/")) return url;
      return null;
    }
    if (host === "youtu.be") {
      const id = u.pathname.replace("/", "").trim();
      if (id) return `https://www.youtube.com/embed/${id}`;
      return null;
    }
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
      return null;
    }
    if (host === "player.vimeo.com" && u.pathname.startsWith("/video/")) return url;
    return null;
  } catch {
    return null;
  }
}

export default function ServiceCaseStudyPage({ serviceId }: { serviceId: string }) {
  const { services, loading } = useSiteData();
  const [directStatus, setDirectStatus] = useState<"idle" | "loading" | "done">("idle");
  const [directService, setDirectService] = useState<any | null>(null);

  const service = useMemo(() => {
    return services.find((s) => String(s.id) === String(serviceId)) ?? directService;
  }, [services, serviceId, directService]);

  useEffect(() => {
    let cancelled = false;
    if (!serviceId) return;
    const existsInList = services.some((s) => String(s.id) === String(serviceId));
    if (existsInList || directStatus !== "idle") return;

    (async () => {
      if (!cancelled) setDirectStatus("loading");
      try {
        const db = requireFirestore();
        const snap = await getDoc(doc(db, "services", serviceId));
        if (!cancelled) {
          if (snap.exists()) {
            setDirectService({ ...(snap.data() as any), id: snap.id });
            return;
          }
        }

        // Backward compatibility: some old links use legacy fields instead of Firestore doc id.
        const numeric = Number(serviceId);
        if (!Number.isNaN(numeric)) {
          const byNumericId = await getDocs(query(collection(db, "services"), where("id", "==", numeric)));
          const docByNumeric = byNumericId.docs[0];
          if (!cancelled && docByNumeric) {
            setDirectService({ ...(docByNumeric.data() as any), id: docByNumeric.id });
            return;
          }
        }

        const byLegacyId = await getDocs(query(collection(db, "services"), where("legacy_id", "==", serviceId)));
        const docByLegacy = byLegacyId.docs[0];
        if (!cancelled) {
          setDirectService(docByLegacy ? { ...(docByLegacy.data() as any), id: docByLegacy.id } : null);
        }
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

  const caseStudies = useMemo(() => {
    const raw = safeParseArray<CaseStudyItem>(service?.case_studies, []);
    return raw
      .map((c) => ({
        title: String(c?.title ?? "").trim(),
        client: c?.client ? String(c.client).trim() : "",
        challenge: c?.challenge ? String(c.challenge).trim() : "",
        solution: c?.solution ? String(c.solution).trim() : "",
        outcome: c?.outcome ? String(c.outcome).trim() : "",
        image_url: c?.image_url ? String(c.image_url).trim() : "",
        video_url: c?.video_url ? String(c.video_url).trim() : "",
        metrics: Array.isArray(c?.metrics)
          ? c.metrics.map((m) => String(m ?? "").trim()).filter(Boolean)
          : [],
      }))
      .filter((c) => c.title || c.client || c.challenge || c.solution || c.outcome || c.image_url || c.video_url || c.metrics.length > 0);
  }, [service?.case_studies]);

  const intro =
    service?.case_study_intro?.trim() ||
    "From strategy to shoot and post-production, we build clear production workflows that turn ideas into measurable content outcomes.";

  const Icon = service ? getIcon(service.icon) : null;
  const isWaiting = (!service && loading) || (!service && directStatus === "loading");

  if (isWaiting) {
    return (
      <div className="site-wrapper min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray to-icube-dark/80 text-white">
        <Navbar />
        <main className="py-28">
          <div className="max-w-6xl mx-auto px-6 md:px-12">
            <p className="text-gray-400">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="site-wrapper min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray to-icube-dark/80 text-white">
        <Navbar />
        <main className="py-28">
          <div className="max-w-6xl mx-auto px-6 md:px-12">
            <Link href="/#services" className="inline-flex items-center gap-2 text-gray-400 hover:text-icube-gold transition-colors">
              <ArrowLeft size={18} /> Back to services
            </Link>
            <h1 className="mt-6 text-3xl md:text-4xl font-display font-bold">Service not found</h1>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="site-wrapper min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray to-icube-dark/80 text-white selection:bg-icube-gold selection:text-icube-dark">
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

          <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.09),rgba(255,255,255,0.03))] p-6 md:p-8">
            <div
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                background:
                  "radial-gradient(700px 280px at -12% 100%, rgba(212,175,55,0.24), transparent 55%), radial-gradient(460px 260px at 112% -12%, rgba(212,175,55,0.16), transparent 58%)",
              }}
              aria-hidden
            />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-icube-gold/70 to-transparent" aria-hidden />

            <div className="relative z-10 grid grid-cols-1 gap-5 md:grid-cols-[auto_1fr] md:gap-6">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-icube-gold/35 bg-black/40 shadow-[0_0_24px_rgba(212,175,55,0.18)]">
                {Icon ? <Icon size={28} className="text-icube-gold" /> : <BriefcaseBusiness size={28} className="text-icube-gold" />}
              </div>

              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-300">
                    Service overview
                  </span>
                  <span className="rounded-full border border-icube-gold/30 bg-icube-gold/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-icube-gold-light">
                    Case Study Ready
                  </span>
                </div>

                <h1 className="text-3xl font-display font-bold tracking-tight text-white md:text-4xl">{service.title}</h1>
                <p className="mt-3 max-w-3xl text-gray-200/95 leading-relaxed">{intro}</p>
              </div>
            </div>
          </header>

          <section className="mt-10 md:mt-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold">Case studies</h2>
            <p className="text-gray-400 font-light mt-2">
              Selected projects delivered under this service with challenge, solution, and measurable outcomes.
            </p>

            {caseStudies.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-gray-400">
                No case studies added yet for this service.
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                {caseStudies.map((cs, idx) => (
                  <article key={`${cs.title || "case"}-${idx}`} className="glass-card rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
                      <div className="relative md:col-span-4 bg-black/25 min-h-56">
                        {cs.image_url ? (
                          <Image
                            src={cloudinaryImage(cs.image_url, 800)}
                            unoptimized
                            alt={cs.title || `Case study ${idx + 1}`}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-500 text-sm">Case image</div>
                        )}
                      </div>

                      <div className="md:col-span-8 p-6 md:p-8">
                        <h3 className="text-xl md:text-2xl font-display font-bold text-white">{cs.title || `Case Study ${idx + 1}`}</h3>
                        {cs.client ? <p className="mt-2 text-sm uppercase tracking-[0.16em] text-icube-gold/90">Client: {cs.client}</p> : null}

                        {cs.challenge ? (
                          <p className="mt-4 text-gray-300 leading-relaxed"><span className="text-white font-semibold">Challenge:</span> {cs.challenge}</p>
                        ) : null}
                        {cs.solution ? (
                          <p className="mt-3 text-gray-300 leading-relaxed"><span className="text-white font-semibold">Solution:</span> {cs.solution}</p>
                        ) : null}
                        {cs.outcome ? (
                          <p className="mt-3 text-gray-300 leading-relaxed"><span className="text-white font-semibold">Outcome:</span> {cs.outcome}</p>
                        ) : null}

                        {cs.metrics.length > 0 ? (
                          <ul className="mt-5 flex flex-wrap gap-2">
                            {cs.metrics.map((m, mi) => (
                              <li key={mi} className="px-3 py-1.5 rounded-full border border-icube-gold/30 bg-icube-gold/10 text-xs text-icube-gold-light">
                                {m}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        {cs.video_url ? (
                          <div className="mt-5">
                            {(() => {
                              const embedUrl = getEmbedUrl(cs.video_url || "");
                              if (!embedUrl) {
                                return (
                                  <a
                                    href={cs.video_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center rounded-lg border border-icube-gold/35 bg-icube-gold/10 px-4 py-2 text-sm font-semibold text-icube-gold-light hover:bg-icube-gold/20 transition-colors"
                                  >
                                    Watch case video
                                  </a>
                                );
                              }
                              return (
                                <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
                                  <div className="aspect-video">
                                    <iframe
                                      src={embedUrl}
                                      title={`${cs.title || "Case study"} video`}
                                      className="h-full w-full"
                                      loading="lazy"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                      referrerPolicy="strict-origin-when-cross-origin"
                                      allowFullScreen
                                    />
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
