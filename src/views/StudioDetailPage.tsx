"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowLeft, Calendar, Play } from "lucide-react";
import { useSiteData } from "../SiteDataContext";
import { useBooking } from "../BookingContext";
import { getVideoEmbed } from "../lib/videoEmbed";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { VideoPlayerModal } from "../components/VideoPlayerModal";

const OPTIMIZED_IMAGE_HOSTS = ["images.unsplash.com", "res.cloudinary.com"];
function isOptimizedImageUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return OPTIMIZED_IMAGE_HOSTS.some((h) => host === h);
  } catch {
    return false;
  }
}

export default function StudioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : null;
  const { studios, portfolio } = useSiteData();
  const { setSelectedStudio, setSelectedPackage } = useBooking();
  const [activeImage, setActiveImage] = useState(0);
  const [playingProject, setPlayingProject] = useState<{ id: number | string; title: string; video_url?: string } | null>(null);

  const studio = id ? (studios.find((s) => s.id === id) ?? null) : null;
  const images = studio
    ? [{ image_url: studio.cover_image_url, caption: null, sort_order: 0 }, ...(studio.images || [])]
    : [];

  useEffect(() => {
    if (studio) setActiveImage(0);
  }, [studio?.id]);

  const works = portfolio.filter((p) => p.visible !== false).slice(0, 8);

  if (id && !studio) {
    return (
      <div className="site-wrapper min-h-screen bg-icube-dark text-white">
        <Navbar />
        <main className="pt-20 md:pt-24 flex items-center justify-center flex-1 px-6 py-24">
          <div className="text-center">
            <p className="text-gray-400 mb-4">Studio not found.</p>
            <Link href="/#studio" className="text-icube-gold hover:underline">
              Back to studios
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!studio) {
    return (
      <div className="site-wrapper min-h-screen bg-icube-dark text-white">
        <Navbar />
        <main className="pt-20 md:pt-24 flex items-center justify-center flex-1">
          <div className="h-12 w-12 animate-pulse rounded-full border-2 border-icube-gold/30 border-t-icube-gold" aria-hidden />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="site-wrapper min-h-screen bg-gradient-to-b from-icube-dark via-icube-gray/40 to-icube-dark text-white selection:bg-icube-gold selection:text-icube-dark">
      <Navbar />
      <main id="main-content" className="pt-20 md:pt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">
        <Link
          href="/#studio"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-icube-gold transition-colors text-sm mb-8"
        >
          <ArrowLeft size={18} />
          Back to studios
        </Link>

        <header className="mb-10 md:mb-14">
          <p className="text-icube-gold text-xs uppercase tracking-[0.2em] mb-2">Studio</p>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight">{studio.name}</h1>
          <p className="text-gray-400 font-light mt-3 max-w-2xl">{studio.short_description}</p>
        </header>

        {/* Gallery */}
        <section className="mb-12 md:mb-16">
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/30">
            <div className="relative aspect-[4/3] md:aspect-[2/1] bg-icube-gray/30">
              {images[activeImage]?.image_url &&
                (isOptimizedImageUrl(images[activeImage].image_url) ? (
                  <Image
                    src={images[activeImage].image_url}
                    alt={studio.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 1024px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <img
                    src={images[activeImage].image_url}
                    alt={studio.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ))}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveImage((i) => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveImage((i) => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="p-3 bg-black/40 border-t border-white/5">
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((img, i) => (
                    <button
                      key={`${img.image_url}-${i}`}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      className={`relative shrink-0 w-16 h-12 md:w-20 md:h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                        i === activeImage ? "border-icube-gold" : "border-white/10 hover:border-white/20"
                      }`}
                      aria-label={`Thumbnail ${i + 1}`}
                    >
                      {isOptimizedImageUrl(img.image_url) ? (
                        <Image src={img.image_url} alt="" fill sizes="80px" className="object-cover" loading="lazy" />
                      ) : (
                        <img src={img.image_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Details + Book CTA */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 mb-16 md:mb-24">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-xs uppercase tracking-[0.2em] text-gray-400 font-medium mb-3">About this studio</h2>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5 md:p-6">
                <p className="text-gray-200 font-light text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                  {studio.details}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider font-medium mb-1">Price</p>
                {studio.price_aed_per_hour_before != null && studio.price_aed_per_hour_before > 0 && (
                  <span className="text-gray-500 text-sm line-through block">{studio.price_aed_per_hour_before} AED/hr</span>
                )}
                <p className="text-white font-semibold text-lg">{studio.price_aed_per_hour} AED/hr</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider font-medium mb-1">Capacity</p>
                <p className="text-white font-semibold text-lg">{studio.capacity} people</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 col-span-2">
                <p className="text-gray-400 text-xs uppercase tracking-wider font-medium mb-1">Size</p>
                <p className="text-white font-semibold text-lg">{studio.size_sqm} m²</p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="sticky top-6 rounded-2xl border border-icube-gold/30 bg-icube-gold/5 p-6">
              <h3 className="font-display font-semibold text-white text-lg mb-2">Book this studio</h3>
              <p className="text-gray-400 text-sm mb-6">Reserve your slot and create something great.</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedStudio({
                    id: studio.id,
                    name: studio.name,
                    price_aed_per_hour: studio.price_aed_per_hour,
                  });
                  setSelectedPackage(null);
                  router.push("/studio/booking/date-time");
                }}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 bg-icube-gold text-icube-dark font-semibold rounded-xl hover:bg-icube-gold-light transition-colors shadow-lg"
              >
                <Calendar size={20} />
                Book now
              </button>
            </div>
          </div>
        </section>

        {/* Works shot in this studio */}
        <section className="border-t border-white/10 pt-12 md:pt-16">
          <h2 className="text-xs uppercase tracking-[0.2em] text-gray-400 font-medium mb-2">Featured work</h2>
          <p className="text-xl md:text-2xl font-display font-semibold text-white mb-8">
            Projects from our studios
          </p>
          {works.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
              {works.map((project) => {
                const embed = project.video_url && getVideoEmbed(project.video_url);
                return (
                  <div key={project.id} className="group">
                    <div className="aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-white/5 relative">
                      <Image
                        src={project.image_url}
                        alt={project.title}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        {embed ? (
                          <button
                            type="button"
                            onClick={() => setPlayingProject(project)}
                            className="w-12 h-12 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white hover:bg-icube-gold/30 hover:border-icube-gold/50 transition-colors"
                            aria-label={`Play ${project.title}`}
                          >
                            <Play size={22} className="text-white ml-0.5" fill="currentColor" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <p className="text-white font-medium text-sm mt-2 truncate">{project.title}</p>
                    {project.category ? <p className="text-gray-500 text-xs truncate">{project.category}</p> : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No featured projects yet.</p>
          )}
        </section>
      </div>
      </main>
      <Footer />

      {playingProject?.video_url && (() => {
        const embed = getVideoEmbed(playingProject.video_url);
        if (!embed) return null;
        return (
          <VideoPlayerModal
            key={playingProject.id}
            embed={embed}
            title={playingProject.title}
            onClose={() => setPlayingProject(null)}
          />
        );
      })()}
    </div>
  );
}
