"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BadgeCheck, ChevronLeft, ChevronRight, Clock, Play, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSiteData } from "@/SiteDataContext";
import { getVideoEmbed } from "@/lib/videoEmbed";
import { isWorkshopSoldOut } from "@/utils/workshopCapacity";
import Image from "next/image";
import { cloudinaryImage } from "@/lib/cloudinaryImage";

export default function WorkshopDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === "string" ? params.id : "";
  const { workshops } = useSiteData();
  const [paying, setPaying] = useState(false);

  const w = useMemo(() => {
    const list = Array.isArray(workshops) ? workshops : [];
    return list.find((x) => String((x as any).id) === String(id)) || null;
  }, [workshops, id]);
  const soldOut = useMemo(() => (w ? isWorkshopSoldOut(w as any) : false), [w]);

  function handleEnroll() {
    if (!w) return;
    if (soldOut) return;
    window.location.href = `/workshops/${encodeURIComponent(String((w as any).id))}/checkout`;
  }

  if (!w) {
    return (
      <div className="site-wrapper min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray to-icube-dark/80 text-white">
        <Navbar />
        <main className="mx-auto max-w-4xl px-6 md:px-12 py-24">
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

  const cover = (w as any).cover_image_url as string | undefined;
  const images = Array.isArray((w as any).images) ? ((w as any).images as any[]) : [];
  const videoUrls = Array.isArray((w as any).video_urls) ? ((w as any).video_urls as string[]) : [];
  const highlights = Array.isArray((w as any).highlights) ? ((w as any).highlights as string[]) : [];
  const includes = Array.isArray((w as any).includes) ? ((w as any).includes as string[]) : [];
  const galleryRef = useRef<HTMLDivElement | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(2);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;
    const check = () => {
      const w = el.clientWidth || 0;
      const next = w >= 640 ? 2 : 1; // sm breakpoint
      setItemsPerPage(next);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const sortedImages = useMemo(() => {
    return images.slice().sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
  }, [images]);

  const totalPages = useMemo(() => {
    const per = Math.max(1, itemsPerPage);
    return Math.max(1, Math.ceil(sortedImages.length / per));
  }, [sortedImages.length, itemsPerPage]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(0, p), totalPages - 1));
  }, [totalPages]);

  const canPrev = page > 0;
  const canNext = page < totalPages - 1;
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef<number>(0);

  function onGalleryTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches?.[0]?.clientX ?? null;
    touchDeltaX.current = 0;
  }

  function onGalleryTouchMove(e: React.TouchEvent) {
    if (touchStartX.current == null) return;
    const x = e.touches?.[0]?.clientX ?? null;
    if (x == null) return;
    touchDeltaX.current = x - touchStartX.current;
  }

  function onGalleryTouchEnd() {
    const dx = touchDeltaX.current;
    touchStartX.current = null;
    touchDeltaX.current = 0;
    const THRESHOLD = 45;
    if (dx > THRESHOLD && canPrev) setPage((p) => Math.max(0, p - 1));
    else if (dx < -THRESHOLD && canNext) setPage((p) => Math.min(totalPages - 1, p + 1));
  }

  return (
    <div className="site-wrapper min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray to-icube-dark/80 text-white">
      <Navbar />
      <main className="relative py-24 md:py-28">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <Link href="/#workshops" className="inline-flex items-center gap-2 text-gray-400 hover:text-icube-gold text-sm font-medium transition-colors">
            <ArrowLeft size={18} />
            Back to workshops
          </Link>

          <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
            {cover ? (
              <div className="relative h-[280px] md:h-[340px]">
                <Image
                  src={cloudinaryImage(cover, 1200)}
                  unoptimized
                  alt={(w as any).title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  <p className="text-xs uppercase tracking-[0.2em] text-icube-gold">Workshop</p>
                  <h1 className="mt-2 text-3xl md:text-4xl font-display font-bold">{(w as any).title}</h1>
                  {/* On mobile, keep image clean and show description below */}
                  <p className="mt-3 max-w-3xl text-gray-200/80 hidden sm:block">
                    {(w as any).description || (w as any).short_description}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6 md:p-8">
                <p className="text-xs uppercase tracking-[0.2em] text-icube-gold">Workshop</p>
                <h1 className="mt-2 text-3xl md:text-4xl font-display font-bold">{(w as any).title}</h1>
                <p className="mt-3 max-w-3xl text-gray-400">{(w as any).description || (w as any).short_description}</p>
              </div>
            )}

            <div className="p-6 md:p-8">
              {cover ? (
                <p className="mb-6 text-sm text-gray-300 sm:hidden">
                  {(w as any).description || (w as any).short_description}
                </p>
              ) : null}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-6">
                  {highlights.length ? (
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
                      <h2 className="font-display font-semibold text-white mb-3">What you’ll learn</h2>
                      <ul className="space-y-2 text-sm text-gray-300">
                        {highlights.map((h) => (
                          <li key={h} className="flex items-start gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-icube-gold/80 shrink-0" aria-hidden />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {includes.length ? (
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
                      <h2 className="font-display font-semibold text-white mb-3">Includes</h2>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-300">
                        {includes.map((h) => (
                          <li key={h} className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-icube-gold/80 shrink-0" aria-hidden />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                <aside className="rounded-2xl border border-white/10 bg-black/25 p-5 sticky top-24">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Price</p>
                    <div className="flex items-baseline gap-2">
                      {Number((w as any).price_before_aed ?? 0) > 0 ? (
                        <span className="text-sm text-gray-500 line-through">
                          AED {Number((w as any).price_before_aed)}
                        </span>
                      ) : null}
                      <p className="text-2xl font-display font-bold text-icube-gold">AED {Number((w as any).price_aed ?? 0)}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                      <span className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-gray-500">
                        <Clock size={14} className="text-icube-gold" /> Duration
                      </span>
                      <span className="text-sm text-gray-200">{(w as any).duration_label || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                      <span className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-gray-500">
                        <Users size={14} className="text-icube-gold" /> Group
                      </span>
                      <span className="text-sm text-gray-200">{(w as any).group_size_label || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                      <span className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-gray-500">
                        <BadgeCheck size={14} className="text-icube-gold" /> Level
                      </span>
                      <span className="text-sm text-gray-200">{(w as any).level_label || "—"}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleEnroll}
                    disabled={paying || soldOut}
                    className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-icube-gold px-4 py-3 text-xs font-semibold uppercase tracking-wider text-icube-dark hover:bg-icube-gold-light transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <Play size={14} />
                    {soldOut ? "Sold out" : "Enroll now"}
                  </button>

                  <p className="mt-3 text-xs text-gray-500">
                    {soldOut ? "This workshop is sold out." : "After payment, we’ll contact you to confirm the date/time."}
                  </p>
                </aside>
              </div>

              {/* Full-width media sections */}
              {videoUrls.length ? (
                <section className="mt-8">
                  <h2 className="font-display font-semibold text-white mb-3">Videos</h2>
                  <div className="grid grid-cols-1 gap-4">
                    {videoUrls.map((u) => {
                      const embed = getVideoEmbed(u);
                      if (!embed) {
                        return (
                          <a key={u} href={u} target="_blank" rel="noreferrer" className="text-icube-gold hover:underline">
                            {u}
                          </a>
                        );
                      }
                      return (
                        <div key={u} className="w-full">
                          <div className="relative w-full aspect-video overflow-hidden rounded-2xl bg-black/20">
                            {embed.provider === "file" ? (
                              <video src={embed.embedUrl} controls className="absolute inset-0 h-full w-full object-cover" />
                            ) : (
                              <iframe
                                src={embed.embedUrl}
                                className="absolute inset-0 h-full w-full"
                                allow="autoplay; encrypted-media; picture-in-picture"
                                allowFullScreen
                                title="Workshop video"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {images.length ? (
                <section className="mt-8">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h2 className="font-display font-semibold text-white">Gallery</h2>
                    <p className="text-xs text-gray-500">{itemsPerPage === 2 ? "2-up" : "1-up"}</p>
                  </div>

                  <div className="-mx-2 px-2">
                    <div ref={galleryRef} className="relative">
                      {/* Side arrows */}
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={!canPrev}
                        className="hidden sm:inline-flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white hover:bg-black/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Previous images"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={!canNext}
                        className="hidden sm:inline-flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white hover:bg-black/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Next images"
                      >
                        <ChevronRight size={18} />
                      </button>

                      {/* Track */}
                      <div
                        className="overflow-hidden touch-pan-y"
                        onTouchStart={onGalleryTouchStart}
                        onTouchMove={onGalleryTouchMove}
                        onTouchEnd={onGalleryTouchEnd}
                      >
                        <div
                          className="flex transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                          style={{ transform: `translateX(-${page * 100}%)` }}
                        >
                          {Array.from({ length: totalPages }).map((_, pageIndex) => {
                            const start = pageIndex * itemsPerPage;
                            const slice = sortedImages.slice(start, start + itemsPerPage);
                            return (
                              <div key={pageIndex} className="w-full shrink-0">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[5px] justify-items-center">
                                  {slice.map((img, idx) => (
                                    <div key={`${pageIndex}-${idx}`} className="w-full max-w-[420px]">
                                      <div className="overflow-hidden rounded-2xl bg-black/20">
                                        <Image
                                          src={cloudinaryImage(String(img.image_url), 600)}
                                          unoptimized
                                          alt={String(img.caption ?? (w as any).title)}
                                          width={480}
                                          height={192}
                                          className="h-44 sm:h-48 w-full object-cover"
                                        />
                                      </div>
                                      {img.caption ? (
                                        <p className="mt-2 text-xs text-gray-500 line-clamp-2">{String(img.caption)}</p>
                                      ) : null}
                                    </div>
                                  ))}
                                  {itemsPerPage === 2 && slice.length === 1 ? <div /> : null}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Dots */}
                      {totalPages > 1 ? (
                        <div className="mt-4 flex justify-center gap-2">
                          {Array.from({ length: totalPages }).map((_, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setPage(i)}
                              className={`h-1.5 rounded-full transition-all duration-200 ${
                                i === page ? "bg-icube-gold w-6" : "bg-white/20 w-1.5 hover:bg-white/30"
                              }`}
                              aria-label={`Go to gallery page ${i + 1}`}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </section>
              ) : null}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

