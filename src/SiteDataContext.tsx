"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import * as api from "./api";
import { CONTACT_EMAIL } from "./constants/contact";
import { toUserFriendlyError, isNetworkError } from "./lib/errorMessages";
import { requireAuth } from "./firebase";
import type { PublicSiteData } from "./lib/publicSiteData";

type Settings = Record<string, string>;
type Service = {
  id: string;
  title: string;
  description: string;
  icon: string;
  sort_order: number;
  /** Short intro paragraph at the top of service details page. */
  case_study_intro?: string;
  /** JSON array string of case studies for this service. */
  case_studies?: string;
};
type Project = {
  id: number | string;
  title: string;
  category: string;
  /** Client or brand name shown under title on portfolio page */
  client?: string;
  image_url: string;
  sort_order: number;
  video_url?: string;
  video_urls?: string[];
  gallery_images?: string[];
  visible?: boolean;
  show_in_selected_work?: boolean;
};
type Testimonial = { id: number; quote: string; author: string; role: string; image_url: string; sort_order: number };
type Package = {
  id: number | string;
  name: string;
  price_before_aed?: number;
  price_aed: number;
  price_after?: string;
  duration: string;
  features: string;
  is_popular: number;
  /** When 1, package uses the dark “Premium” card style on the site. */
  is_premium?: number;
  sort_order: number;
  description?: string;
  best_for_label?: string;
  /** Category slug used for filtering in the Packages page (e.g. "podcast-packages"). */
  category?: string;
  requires_schedule?: boolean;
};
type Why = { id: number; icon: string; title: string; description: string; sort_order: number };
type Equipment = { id: number; label: string; description: string; sort_order: number };
type Studio = {
  id: string;
  name: string;
  short_description: string;
  details: string;
  price_aed_per_hour: number;
  price_aed_per_hour_before?: number;
  capacity: number;
  size_sqm: number;
  cover_image_url: string;
  sort_order: number;
  images?: { image_url: string; caption?: string | null; sort_order?: number }[];
};
type Video = { id: string; title: string; url: string; sort_order: number };
type Workshop = {
  id: string;
  title: string;
  short_description?: string;
  description?: string;
  price_before_aed?: number;
  price_aed: number;
  workshop_date?: string;
  sort_order?: number;
  duration_label?: string;
  group_size_label?: string;
  group_size_max?: number;
  paid_enrollments_count?: number;
  sold_out?: boolean;
  sold_out_override?: boolean;
  level_label?: string;
  cover_image_url?: string;
  highlights?: string[];
  includes?: string[];
  images?: { image_url: string; caption?: string | null; sort_order?: number }[];
  video_urls?: string[];
};

type SiteData = {
  settings: Settings;
  services: Service[];
  portfolio: Project[];
  testimonials: Testimonial[];
  packages: Package[];
  whyUs: Why[];
  studioEquipment: Equipment[];
  studios: Studio[];
  videos: Video[];
  workshops: Workshop[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

const defaultData: SiteData = {
  settings: {},
  services: [],
  portfolio: [],
  testimonials: [],
  packages: [],
  whyUs: [],
  studioEquipment: [],
  studios: [],
  videos: [],
  workshops: [],
  loading: true,
  error: null,
  refresh: () => {},
};

const SiteDataContext = createContext<SiteData>(defaultData);

const FALLBACK_SETTINGS: Record<string, string> = {
  hero_tagline: "",
  hero_title_1: "",
  hero_title_2: "",
  hero_title_3: "",
  hero_subtitle: "",
  hero_bg_type: "image",
  hero_bg_image_url: "",
  hero_bg_video_url: "",
  hero_bg_gif_url: "",
  hero_video_dark_opacity: "72",
  contact_address: "Dubai Media City, Building 1\nDubai, United Arab Emirates",
  contact_email: CONTACT_EMAIL,
  contact_email_bookings: CONTACT_EMAIL,
  contact_phone: "+971 4 123 4567",
  contact_phone_2: "",
  contact_hours: "Sun–Thu, 9am – 6pm GST",
};

const FALLBACK_SERVICES: Service[] = [
  {
    id: "1",
    title: "Podcast & talk shows",
    description: "End‑to‑end podcast and talk show production with multi‑camera setup, studio lighting, and live monitoring.",
    icon: "mic",
    sort_order: 1,
  },
  {
    id: "2",
    title: "Brand & social content",
    description: "Short‑form reels, interviews, and branded content tailored for Instagram, TikTok, and YouTube.",
    icon: "clapperboard",
    sort_order: 2,
  },
  {
    id: "3",
    title: "Commercial video",
    description: "Full production for campaigns, TVCs, and corporate films across Dubai and the wider GCC.",
    icon: "camera",
    sort_order: 3,
  },
];

const FALLBACK_PORTFOLIO: Project[] = [
  {
    id: 1,
    title: "Dubai founders podcast",
    category: "Podcast production",
    image_url:
      "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=1600&auto=format&fit=crop",
    sort_order: 1,
  },
  {
    id: 2,
    title: "Luxury hospitality campaign",
    category: "Brand film",
    image_url:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600&auto=format&fit=crop",
    sort_order: 2,
  },
];

const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    quote:
      "ICUBE made our podcast feel like a TV show. The team handled everything from set design to distribution.",
    author: "Sara Al Nahyan",
    role: "Host, Women in Business Podcast",
    image_url:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=400&auto=format&fit=crop",
    sort_order: 1,
  },
  {
    id: 2,
    quote:
      "Professional crew, reliable delivery, and a studio that impresses every client we bring in.",
    author: "Ahmed Khalid",
    role: "Marketing Director, Dubai Tech Brand",
    image_url:
      "https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?q=80&w=400&auto=format&fit=crop",
    sort_order: 2,
  },
];

const FALLBACK_PACKAGES: Package[] = [
  {
    id: 1,
    name: "Starter podcast",
    price_aed: 1800,
    duration: "2 hours in studio",
    features: JSON.stringify(["Up to 2 guests", "2 camera angles", "Basic colour grade", "Audio mix & export"]),
    is_popular: 0,
    sort_order: 1,
    category: "podcast-packages",
  },
  {
    id: 2,
    name: "Content day",
    price_aed: 3500,
    duration: "Half‑day studio booking",
    features: JSON.stringify([
      "Multi‑set access",
      "Dedicated producer",
      "Reels & short‑form deliverables",
      "On‑site editor support",
    ]),
    is_popular: 1,
    sort_order: 2,
    category: "studio-rental-packages",
  },
];

const FALLBACK_WHY_US: Why[] = [
  {
    id: 1,
    icon: "sparkles",
    title: "Studio built for creators",
    description: "Spaces designed specifically for podcasts, talk shows, and modern content formats.",
    sort_order: 1,
  },
  {
    id: 2,
    icon: "gauge",
    title: "Efficient Dubai location",
    description: "Easy access for guests with parking and a smooth, hosted experience on site.",
    sort_order: 2,
  },
  {
    id: 3,
    icon: "wand2",
    title: "Production from A to Z",
    description: "From idea and script to filming, edit, and delivery – handled by one team.",
    sort_order: 3,
  },
];

const FALLBACK_VIDEOS: Video[] = [];

const FALLBACK_STUDIOS: Studio[] = [
  {
    id: "demo-main",
    name: "Flagship podcast studio",
    short_description: "Warm, cinematic set built for talk shows, interviews, and long‑form podcasts.",
    details:
      "Our flagship room with multiple camera angles, controllable lighting, and flexible seating layouts. Ideal for weekly shows and branded podcasts.",
    price_aed_per_hour: 650,
    capacity: 6,
    size_sqm: 38,
    cover_image_url:
      "https://images.unsplash.com/photo-1513097847644-f00cfe868607?q=80&w=1600&auto=format&fit=crop",
    sort_order: 1,
    images: [],
  },
  {
    id: "demo-content",
    name: "Content & reel studio",
    short_description: "Bright set for social media content, product shots, and talking‑head videos.",
    details:
      "Designed for fast content days – shoot reels, promos, and short‑form pieces with flexible backdrops and lighting presets.",
    price_aed_per_hour: 550,
    capacity: 4,
    size_sqm: 28,
    cover_image_url:
      "https://images.unsplash.com/photo-1526498460520-4c246339dccb?q=80&w=1600&auto=format&fit=crop",
    sort_order: 2,
    images: [],
  },
];

const FALLBACK_WORKSHOPS: Workshop[] = [
  {
    id: "podcast-masterclass",
    title: "Podcast Masterclass",
    short_description: "Plan, record, and publish a professional podcast — fast.",
    description:
      "A practical, studio-based session covering setup, audio basics, framing, and an editing workflow you can repeat weekly.",
    price_before_aed: 599,
    price_aed: 499,
    workshop_date: "2026-04-20",
    sort_order: 1,
    duration_label: "2–3 hours",
    group_size_label: "1–10 people",
    level_label: "Beginner → Intermediate",
    cover_image_url:
      "https://images.unsplash.com/photo-1526498460520-4c246339dccb?q=80&w=1600&auto=format&fit=crop",
    highlights: ["Mic technique & vocal clarity", "Lighting + framing basics", "Editing workflow (fast & clean)"],
    includes: ["Studio time", "Checklist + templates", "Q&A"],
    images: [],
    video_urls: [],
  },
  {
    id: "reels-shortform",
    title: "Reels & Short‑Form Content",
    short_description: "Shoot and edit scroll‑stopping short videos with a repeatable formula.",
    description:
      "Learn hooks, filming patterns, and a clean editing pipeline. Ideal for founders and creators who want consistent output.",
    price_before_aed: 499,
    price_aed: 399,
    workshop_date: "2026-04-27",
    sort_order: 2,
    duration_label: "2 hours",
    group_size_label: "1–10 people",
    level_label: "All levels",
    cover_image_url:
      "https://images.unsplash.com/photo-1492724441997-5dc865305da7?q=80&w=1600&auto=format&fit=crop",
    highlights: ["Hook frameworks", "Camera settings (phone + camera)", "CapCut / Premiere basics"],
    includes: ["Templates", "Shot list examples", "Export settings"],
    images: [],
    video_urls: [],
  },
  {
    id: "brand-video",
    title: "Brand Video (Brief → Cut)",
    short_description: "Understand pre‑production, directing, and how to get a premium look on set.",
    description:
      "We cover planning, shot lists, coverage, and the finishing touches (sound + color) that make content feel premium.",
    price_before_aed: 699,
    price_aed: 599,
    workshop_date: "2026-05-04",
    sort_order: 3,
    duration_label: "3 hours",
    group_size_label: "1–8 people",
    sold_out_override: true,
    level_label: "Intermediate",
    cover_image_url:
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1600&auto=format&fit=crop",
    highlights: ["Storyboard & shot planning", "Directing + B‑roll coverage", "Color + sound basics"],
    includes: ["Demo shoot", "Checklist", "Q&A"],
    images: [],
    video_urls: [],
  },
];

function withFallbackArray<T>(items: T[], fallback: T[]): T[] {
  return items && items.length > 0 ? items : fallback;
}

function applyWorkshopOverrides(list: Workshop[]): Workshop[] {
  return (list || []).map((w) => {
    if (w?.id === "brand-video") return { ...w, sold_out_override: true };
    return w;
  });
}


const CACHE_STALE_MS = 60 * 1000; // 1 minute
let cachedData: SiteData | null = null;
let cacheTime = 0;

/** Call after dashboard saves content so the public site sees fresh data (e.g. after saving settings or portfolio). */
export function invalidateSiteCache(): void {
  cacheTime = 0;
  cachedData = null;
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("icube_site_cache_bust", String(Date.now()));
    }
  } catch {
    // ignore
  }

  // The public pages are server-rendered and cached, so clearing the client store is no longer
  // enough — without this an edit waited out the five-minute window before it appeared.
  void revalidatePublicSite();
}

async function revalidatePublicSite(): Promise<void> {
  try {
    const auth = requireAuth();
    const user = auth.currentUser;
    if (!user) return;
    await fetch("/api/revalidate", {
      method: "POST",
      headers: { Authorization: `Bearer ${await user.getIdToken()}` },
    });
  } catch (err) {
    // A failed refresh only means the edit appears when the cache expires on its own.
    console.warn("[site] Could not refresh the public site immediately:", err);
  }
}

export function SiteDataProvider({
  children,
  initialData,
}: {
  children: ReactNode;
  /**
   * Rendered on the server and passed in, so the first paint already has content and the twenty
   * Firestore round-trips below are skipped entirely. Null when the server read failed — the
   * client fetch then runs as it always did.
   */
  initialData?: PublicSiteData | null;
}) {
  const [data, setData] = useState<SiteData>(
    initialData
      ? {
          ...defaultData,
          ...(initialData as unknown as Partial<SiteData>),
          workshops: applyWorkshopOverrides(
            (initialData.workshops ?? []) as unknown as SiteData["workshops"]
          ),
          loading: false,
          error: null,
        }
      : {
    ...defaultData,
    loading: true,
    error: null,
    settings: {},
    services: [],
    portfolio: [],
    testimonials: [],
    packages: [],
    whyUs: [],
    studioEquipment: [],
    studios: [],
          videos: [],
          workshops: [],
        }
  );

  const refreshRef = useRef<() => void>(() => {});

  const fetchAll = useCallback(async (): Promise<void> => {
    // Phase 1: settings first (Hero, MaintenanceGate can use them immediately)
    const settings = await api.getSiteSettings();
    const settingsMap = Object.keys(settings || {}).length ? settings! : FALLBACK_SETTINGS;
    setData((d) => ({ ...d, settings: settingsMap }));

    // Phase 2: rest in parallel
    const [services, portfolio, testimonials, packages, whyUs, studioEquipment, studios, videos, workshops] = await Promise.all([
      api.getServices(),
      api.getPortfolio(),
      api.getTestimonials(),
      api.getBookingPackages(),
      api.getWhyUs(),
      api.getStudioEquipment(),
      api.getStudios(),
      api.getVideos(),
      api.getWorkshops(),
    ]);
    const next = {
      ...defaultData,
      settings: Object.keys(settingsMap).length ? settingsMap : FALLBACK_SETTINGS,
      services: withFallbackArray(services, FALLBACK_SERVICES),
      portfolio: withFallbackArray(portfolio, FALLBACK_PORTFOLIO),
      testimonials: withFallbackArray(testimonials, FALLBACK_TESTIMONIALS),
      packages: withFallbackArray(packages, FALLBACK_PACKAGES),
      whyUs: withFallbackArray(whyUs, FALLBACK_WHY_US),
      studioEquipment,
      studios: withFallbackArray(studios, FALLBACK_STUDIOS),
      videos: withFallbackArray(videos, FALLBACK_VIDEOS),
      workshops: applyWorkshopOverrides(withFallbackArray(workshops, FALLBACK_WORKSHOPS)),
      loading: false,
      error: null,
      refresh: refreshRef.current,
    };
    cachedData = next;
    cacheTime = Date.now();
    setData(next);
  }, []);

  const refresh = useCallback(async () => {
    setData((d) => ({ ...d, loading: true, error: null }));
    try {
      await fetchAll();
    } catch (err) {
      const message = toUserFriendlyError(err);
      setData((d) => ({
        ...d,
        loading: false,
        error: message,
        refresh,
        settings: Object.keys(d.settings).length ? d.settings : FALLBACK_SETTINGS,
        services: d.services.length ? d.services : FALLBACK_SERVICES,
        portfolio: d.portfolio.length ? d.portfolio : FALLBACK_PORTFOLIO,
        testimonials: d.testimonials.length ? d.testimonials : FALLBACK_TESTIMONIALS,
        packages: d.packages.length ? d.packages : FALLBACK_PACKAGES,
        whyUs: d.whyUs.length ? d.whyUs : FALLBACK_WHY_US,
        studios: d.studios.length ? d.studios : FALLBACK_STUDIOS,
        videos: d.videos.length ? d.videos : FALLBACK_VIDEOS,
        workshops: applyWorkshopOverrides(d.workshops.length ? d.workshops : FALLBACK_WORKSHOPS),
      }));
    }
  }, [fetchAll]);

  refreshRef.current = refresh;

  // Cross-tab + immediate refresh after dashboard saves (cache bust event).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== "icube_site_cache_bust") return;
      cacheTime = 0;
      cachedData = null;
      refreshRef.current?.();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const hasServerData = Boolean(initialData);

  useEffect(() => {
    // Server-rendered content is already on screen; refetching it on mount would spend the very
    // round-trips this change removes. refresh() stays available for dashboard saves.
    if (hasServerData) return;

    const now = Date.now();
    if (cachedData && now - cacheTime < CACHE_STALE_MS) {
      setData((d) => ({ ...cachedData!, refresh: refreshRef.current }));
      return;
    }

    let cancelled = false;
    const maxRetries = 2;
    let attempt = 0;

    const run = async () => {
      setData((d) => ({ ...d, loading: true, error: null }));
      while (attempt <= maxRetries) {
        try {
          await fetchAll();
          return;
        } catch (err) {
          if (cancelled) return;
          attempt++;
          if (attempt <= maxRetries) {
            await new Promise((r) => setTimeout(r, 1000 * attempt));
            continue;
          }
          const message = toUserFriendlyError(err);
          const useCached = isNetworkError(err) && cachedData;
          if (useCached) {
            setData({
              ...cachedData,
              loading: false,
              error: "You're seeing saved content. Connection problem—retry for the latest.",
              refresh: refreshRef.current,
            } as SiteData);
          } else {
            setData((d) => ({
              ...d,
              loading: false,
              error: message,
              refresh,
              settings: Object.keys(d.settings).length ? d.settings : FALLBACK_SETTINGS,
              services: d.services.length ? d.services : FALLBACK_SERVICES,
              portfolio: d.portfolio.length ? d.portfolio : FALLBACK_PORTFOLIO,
              testimonials: d.testimonials.length ? d.testimonials : FALLBACK_TESTIMONIALS,
              packages: d.packages.length ? d.packages : FALLBACK_PACKAGES,
              whyUs: d.whyUs.length ? d.whyUs : FALLBACK_WHY_US,
              studios: d.studios.length ? d.studios : FALLBACK_STUDIOS,
              videos: d.videos.length ? d.videos : FALLBACK_VIDEOS,
              workshops: d.workshops.length ? d.workshops : FALLBACK_WORKSHOPS,
            }));
          }
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [fetchAll, refresh, hasServerData]);

  return <SiteDataContext.Provider value={data}>{children}</SiteDataContext.Provider>;
}

export function useSiteData() {
  return useContext(SiteDataContext);
}
