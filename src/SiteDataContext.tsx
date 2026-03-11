import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import * as api from "./api";

type Settings = Record<string, string>;
type Service = { id: number; title: string; description: string; icon: string; sort_order: number };
type Project = { id: number; title: string; category: string; image_url: string; sort_order: number; video_url?: string };
type Testimonial = { id: number; quote: string; author: string; role: string; image_url: string; sort_order: number };
type Package = { id: number; name: string; price_aed: number; duration: string; features: string; is_popular: number; sort_order: number };
type Why = { id: number; icon: string; title: string; description: string; sort_order: number };
type Equipment = { id: number; label: string; description: string; sort_order: number };
type Studio = {
  id: string;
  name: string;
  short_description: string;
  details: string;
  price_aed_per_hour: number;
  capacity: number;
  size_sqm: number;
  cover_image_url: string;
  sort_order: number;
  images: { image_url: string; caption: string | null; sort_order: number }[];
};
type Video = { id: string; title: string; url: string; sort_order: number };

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
  loading: boolean;
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
  loading: true,
  refresh: () => {},
};

const SiteDataContext = createContext<SiteData>(defaultData);

const FALLBACK_SETTINGS: Record<string, string> = {
  hero_tagline: "Premium Media Agency – Dubai",
  hero_title_1: "CREATE.",
  hero_title_2: "RECORD.",
  hero_title_3: "AMPLIFY.",
  hero_subtitle: "Professional media production and podcast studio in Dubai. Elevate your content with cinematic quality.",
  hero_bg_type: "image",
  hero_bg_image_url:
    "https://images.unsplash.com/photo-1598550880863-4e8aa3d0edb4?q=80&w=2070&auto=format&fit=crop",
  hero_bg_video_url: "",
  contact_address: "Dubai Media City, Building 1\nDubai, United Arab Emirates",
  contact_email: "hello@icube.ae",
  contact_email_bookings: "bookings@icube.ae",
  contact_phone: "+971 4 123 4567",
  contact_hours: "Sun–Thu, 9am – 6pm GST",
};

const FALLBACK_SERVICES: Service[] = [
  {
    id: 1,
    title: "Podcast & talk shows",
    description: "End‑to‑end podcast and talk show production with multi‑camera setup, studio lighting, and live monitoring.",
    icon: "mic",
    sort_order: 1,
  },
  {
    id: 2,
    title: "Brand & social content",
    description: "Short‑form reels, interviews, and branded content tailored for Instagram, TikTok, and YouTube.",
    icon: "clapperboard",
    sort_order: 2,
  },
  {
    id: 3,
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

function withFallbackArray<T>(items: T[], fallback: T[]): T[] {
  return items && items.length > 0 ? items : fallback;
}

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SiteData>({
    ...defaultData,
    loading: false,
    settings: FALLBACK_SETTINGS,
    services: FALLBACK_SERVICES,
    portfolio: FALLBACK_PORTFOLIO,
    testimonials: FALLBACK_TESTIMONIALS,
    packages: FALLBACK_PACKAGES,
    whyUs: FALLBACK_WHY_US,
    studios: FALLBACK_STUDIOS,
    videos: FALLBACK_VIDEOS,
  });

  const refresh = useCallback(async () => {
    setData((d) => ({ ...d, loading: true }));
    try {
      const [settings, services, portfolio, testimonials, packages, whyUs, studioEquipment, studios, videos] = await Promise.all([
        api.getSiteSettings(),
        api.getServices(),
        api.getPortfolio(),
        api.getTestimonials(),
        api.getBookingPackages(),
        api.getWhyUs(),
        api.getStudioEquipment(),
        api.getStudios(),
        api.getVideos(),
      ]);
      setData({
        settings: Object.keys(settings || {}).length ? settings : FALLBACK_SETTINGS,
        services: withFallbackArray(services, FALLBACK_SERVICES),
        portfolio: withFallbackArray(portfolio, FALLBACK_PORTFOLIO),
        testimonials: withFallbackArray(testimonials, FALLBACK_TESTIMONIALS),
        packages: withFallbackArray(packages, FALLBACK_PACKAGES),
        whyUs: withFallbackArray(whyUs, FALLBACK_WHY_US),
        studioEquipment,
        studios: withFallbackArray(studios, FALLBACK_STUDIOS),
        videos: withFallbackArray(videos, FALLBACK_VIDEOS),
        loading: false,
        refresh,
      });
    } catch {
      setData((d) => ({
        ...d,
        loading: false,
        refresh,
        settings: { ...FALLBACK_SETTINGS, ...d.settings },
      }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <SiteDataContext.Provider value={data}>{children}</SiteDataContext.Provider>;
}

export function useSiteData() {
  return useContext(SiteDataContext);
}
