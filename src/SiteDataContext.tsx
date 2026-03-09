import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import * as api from "./api";

type Settings = Record<string, string>;
type Service = { id: number; title: string; description: string; icon: string; sort_order: number };
type Project = { id: number; title: string; category: string; image_url: string; sort_order: number };
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

type SiteData = {
  settings: Settings;
  services: Service[];
  portfolio: Project[];
  testimonials: Testimonial[];
  packages: Package[];
  whyUs: Why[];
  studioEquipment: Equipment[];
  studios: Studio[];
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
  contact_address: "Dubai Media City, Building 1\nDubai, United Arab Emirates",
  contact_email: "hello@icube.ae",
  contact_email_bookings: "bookings@icube.ae",
  contact_phone: "+971 4 123 4567",
  contact_hours: "Sun–Thu, 9am – 6pm GST",
};

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SiteData>({ ...defaultData, loading: false, settings: FALLBACK_SETTINGS });

  const refresh = useCallback(async () => {
    setData((d) => ({ ...d, loading: true }));
    try {
      const [settings, services, portfolio, testimonials, packages, whyUs, studioEquipment, studios] = await Promise.all([
        api.getSiteSettings(),
        api.getServices(),
        api.getPortfolio(),
        api.getTestimonials(),
        api.getBookingPackages(),
        api.getWhyUs(),
        api.getStudioEquipment(),
        api.getStudios(),
      ]);
      setData({
        settings,
        services,
        portfolio,
        testimonials,
        packages,
        whyUs,
        studioEquipment,
        studios,
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
