import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  addDoc,
  where,
} from "firebase/firestore";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { requireAuth, requireFirestore } from "./firebase";
import { contactFormSchema } from "./schemas/contact";
import { bookingPayloadSchema } from "./schemas/booking";

type IdDoc<T> = T & { id: string };

function assertAuth() {
  if (!requireAuth().currentUser) throw new Error("Unauthorized");
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

/** Map dashboard path kind to Firestore collection name. */
function dashboardKindToCollection(kind: string): string {
  switch (kind) {
    case "packages":
      return "booking_packages";
    case "addons":
      return "booking_addons";
    case "why-us":
      return "why_us";
    case "studio-equipment":
      return "studio_equipment";
    case "discount-codes":
      return "discount_codes";
    default:
      return kind;
  }
}

async function getSettingsDoc() {
  const ref = doc(requireFirestore(), "site_settings", "main");
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    // Create empty doc (will require permissive rules or admin)
    await setDoc(ref, { created_at: serverTimestamp() }, { merge: true });
    return {};
  }
  return (snap.data() || {}) as Record<string, string>;
}

async function listCollection<T>(name: string) {
  const q = query(collection(requireFirestore(), name), orderBy("sort_order", "asc"));
  const snaps = await getDocs(q);
  return snaps.docs.map((d) => ({ ...(d.data() as T), id: d.id })) as IdDoc<T>[];
}

async function listByCreatedAtDesc<T>(name: string, max = 500) {
  const q = query(collection(requireFirestore(), name), orderBy("created_at", "desc"), limit(max));
  const snaps = await getDocs(q);
  return snaps.docs.map((d) => ({ ...(d.data() as T), id: d.id })) as IdDoc<T>[];
}

// A compatibility layer so existing dashboard code can keep calling api.get("/dashboard/...").
export const api = {
  get: async <T>(path: string): Promise<T> => {
    if (path === "/site/settings") return (await getSettingsDoc()) as T;
    if (path === "/services") return (await listCollection("services")) as T;
    if (path === "/portfolio") return (await listCollection("portfolio")) as T;
    if (path === "/testimonials") return (await listCollection("testimonials")) as T;
    if (path === "/booking-packages") return (await listCollection("booking_packages")) as T;
    if (path === "/booking-addons") return (await listCollection("booking_addons")) as T;
    if (path === "/why-us") return (await listCollection("why_us")) as T;
    if (path === "/studio-equipment") return (await listCollection("studio_equipment")) as T;
    if (path === "/studios") return (await listCollection("studios")) as T;
    if (path === "/videos") return (await listCollection("videos")) as T;

    // Dashboard
    if (path === "/dashboard/settings") {
      assertAuth();
      return (await getSettingsDoc()) as T;
    }
    if (path === "/dashboard/services") {
      assertAuth();
      return (await listCollection("services")) as T;
    }
    if (path === "/dashboard/portfolio") {
      assertAuth();
      return (await listCollection("portfolio")) as T;
    }
    if (path === "/dashboard/testimonials") {
      assertAuth();
      return (await listCollection("testimonials")) as T;
    }
    if (path === "/dashboard/packages") {
      assertAuth();
      return (await listCollection("booking_packages")) as T;
    }
    if (path === "/dashboard/addons") {
      assertAuth();
      return (await listCollection("booking_addons")) as T;
    }
    if (path === "/dashboard/why-us") {
      assertAuth();
      return (await listCollection("why_us")) as T;
    }
    if (path === "/dashboard/studio-equipment") {
      assertAuth();
      return (await listCollection("studio_equipment")) as T;
    }
    if (path === "/dashboard/studios") {
      assertAuth();
      return (await listCollection("studios")) as T;
    }
    if (path === "/dashboard/discount-codes") {
      assertAuth();
      return (await listByCreatedAtDesc("discount_codes")) as T;
    }
    if (path === "/dashboard/videos") {
      assertAuth();
      return (await listCollection("videos")) as T;
    }
    if (path === "/dashboard/bookings") {
      assertAuth();
      return (await listByCreatedAtDesc("bookings")) as T;
    }
    if (path === "/dashboard/messages") {
      assertAuth();
      return (await listByCreatedAtDesc("contact_messages")) as T;
    }

    throw new Error(`Unknown GET path: ${path}`);
  },

  post: async <T>(path: string, body: unknown): Promise<T> => {
    if (path === "/booking") {
      const parsed = bookingPayloadSchema.safeParse(body);
      if (!parsed.success) {
        const msg = parsed.error.issues[0]?.message ?? parsed.error.flatten().formErrors?.[0] ?? "Invalid booking data";
        throw new Error(typeof msg === "string" ? msg : "Invalid booking data");
      }
      const b = parsed.data;
      const db = requireFirestore();
      await addDoc(collection(db, "bookings"), {
        ...stripUndefined(b),
        status: "pending",
        created_at: serverTimestamp(),
      });

      // If a discount code was used, increment its used_count and deactivate when max_uses reached.
      const rawDiscountCode = (body as { discount_code?: string } | undefined)?.discount_code;
      if (rawDiscountCode) {
        try {
          const code = rawDiscountCode.toUpperCase();
          const q = query(
            collection(db, "discount_codes"),
            where("code", "==", code)
          );
          const snaps = await getDocs(q);
          if (!snaps.empty) {
            const docSnap = snaps.docs[0];
            const data = docSnap.data() as {
              used_count?: number;
              max_uses?: number;
              active?: boolean;
            };
            const used = (data.used_count ?? 0) + 1;
            const maxUses = data.max_uses ?? 1;
            const shouldDeactivate = used >= maxUses;
            await updateDoc(docSnap.ref, {
              used_count: used,
              ...(shouldDeactivate ? { active: false } : {}),
            });
          }
        } catch {
          // best-effort; booking already stored
        }
      }
      return { success: true } as T;
    }
    if (path === "/contact") {
      const parsed = contactFormSchema.safeParse(body);
      if (!parsed.success) {
        const msg = parsed.error.issues[0]?.message ?? parsed.error.flatten().formErrors?.[0] ?? "Invalid contact data";
        throw new Error(typeof msg === "string" ? msg : "Invalid contact data");
      }
      const m = parsed.data;
      await addDoc(collection(requireFirestore(), "contact_messages"), {
        ...m,
        read_at: null,
        created_at: serverTimestamp(),
      });
      return { success: true } as T;
    }

    // Auth
    if (path === "/login") {
      const { email, password } = body as { email: string; password: string };
      await signInWithEmailAndPassword(requireAuth(), email, password);
      return { success: true, user: { id: requireAuth().currentUser?.uid, email } } as T;
    }
    if (path === "/logout") {
      await signOut(requireAuth());
      return { success: true } as T;
    }

    // Dashboard creates – body is a record to merge into Firestore
    const docBody = (b: unknown) => (typeof b === "object" && b !== null ? (b as Record<string, unknown>) : {});

    if (path === "/dashboard/services") {
      assertAuth();
      const s = docBody(body);
      const ref = await addDoc(collection(requireFirestore(), "services"), {
        ...s,
        created_at: serverTimestamp(),
      });
      return { id: ref.id, ...s } as T;
    }
    if (path === "/dashboard/portfolio") {
      assertAuth();
      const p = docBody(body);
      const ref = await addDoc(collection(requireFirestore(), "portfolio"), { ...p, created_at: serverTimestamp() });
      return { id: ref.id, ...p } as T;
    }
    if (path === "/dashboard/testimonials") {
      assertAuth();
      const t = docBody(body);
      const ref = await addDoc(collection(requireFirestore(), "testimonials"), { ...t, created_at: serverTimestamp() });
      return { id: ref.id, ...t } as T;
    }
    if (path === "/dashboard/packages") {
      assertAuth();
      const p = docBody(body);
      const ref = await addDoc(collection(requireFirestore(), "booking_packages"), { ...p, created_at: serverTimestamp() });
      return { id: ref.id, ...p } as T;
    }
    if (path === "/dashboard/addons") {
      assertAuth();
      const a = docBody(body);
      const ref = await addDoc(collection(requireFirestore(), "booking_addons"), { ...a, created_at: serverTimestamp() });
      return { id: ref.id, ...a } as T;
    }
    if (path === "/dashboard/why-us") {
      assertAuth();
      const w = docBody(body);
      const ref = await addDoc(collection(requireFirestore(), "why_us"), { ...w, created_at: serverTimestamp() });
      return { id: ref.id, ...w } as T;
    }
    if (path === "/dashboard/studio-equipment") {
      assertAuth();
      const e = docBody(body);
      const ref = await addDoc(collection(requireFirestore(), "studio_equipment"), { ...e, created_at: serverTimestamp() });
      return { id: ref.id, ...e } as T;
    }
    if (path === "/dashboard/studios") {
      assertAuth();
      const s = docBody(body);
      const ref = await addDoc(collection(requireFirestore(), "studios"), { ...s, created_at: serverTimestamp() });
      return { id: ref.id, ...s } as T;
    }
    if (path === "/dashboard/videos") {
      assertAuth();
      const v = docBody(body);
      const ref = await addDoc(collection(requireFirestore(), "videos"), { ...v, created_at: serverTimestamp() });
      return { id: ref.id, ...v } as T;
    }
    if (path === "/dashboard/discount-codes") {
      assertAuth();
      const d = docBody(body);
      const ref = await addDoc(collection(requireFirestore(), "discount_codes"), {
        ...d,
        used_count: d.used_count ?? 0,
        active: d.active ?? true,
        created_at: serverTimestamp(),
      });
      return { id: ref.id, ...d } as T;
    }

    throw new Error(`Unknown POST path: ${path}`);
  },

  put: async <T>(path: string, body: unknown): Promise<T> => {
    // Settings
    if (path === "/dashboard/settings") {
      assertAuth();
      const settings = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
      await setDoc(doc(requireFirestore(), "site_settings", "main"), { ...settings, updated_at: serverTimestamp() }, { merge: true });
      return { success: true } as T;
    }

    const m = path.match(/^\/dashboard\/(services|portfolio|testimonials|packages|addons|why-us|studio-equipment|studios|videos|discount-codes)\/([^/]+)$/);
    if (m) {
      assertAuth();
      const [, kind, id] = m;
      const col = dashboardKindToCollection(kind!);
      const payload = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
      await setDoc(doc(requireFirestore(), col, id!), { ...payload, updated_at: serverTimestamp() }, { merge: true });
      return { success: true } as T;
    }

    throw new Error(`Unknown PUT path: ${path}`);
  },

  patch: async <T>(path: string, body?: unknown): Promise<T> => {
    // bookings status
    const b = path.match(/^\/dashboard\/bookings\/([^/]+)$/);
    if (b) {
      assertAuth();
      const id = b[1];
      const payload = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
      await updateDoc(doc(requireFirestore(), "bookings", id), { ...payload, updated_at: serverTimestamp() });
      return { success: true } as T;
    }
    // messages read
    const r = path.match(/^\/dashboard\/messages\/([^/]+)\/read$/);
    if (r) {
      assertAuth();
      const id = r[1];
      await updateDoc(doc(requireFirestore(), "contact_messages", id), { read_at: serverTimestamp() });
      return { success: true } as T;
    }

    throw new Error(`Unknown PATCH path: ${path}`);
  },

  delete: async <T>(path: string): Promise<T> => {
    const b = path.match(/^\/dashboard\/bookings\/([^/]+)$/);
    if (b) {
      assertAuth();
      const id = b[1];
      await deleteDoc(doc(requireFirestore(), "bookings", id));
      return { success: true } as T;
    }
    const m = path.match(/^\/dashboard\/(services|portfolio|testimonials|packages|addons|why-us|studio-equipment|studios|videos|discount-codes)\/([^/]+)$/);
    if (m) {
      assertAuth();
      const [, kind, id] = m;
      const col = dashboardKindToCollection(kind!);
      await deleteDoc(doc(requireFirestore(), col, id!));
      return { success: true } as T;
    }
    throw new Error(`Unknown DELETE path: ${path}`);
  },
};

// Public site content
export async function getSiteSettings() {
  return api.get<Record<string, string>>("/site/settings");
}
export async function getServices() {
  return api.get<
    {
      id: string;
      title: string;
      description: string;
      icon: string;
      sort_order: number;
      case_study_stats?: string;
      case_study_infographics?: string;
    }[]
  >("/services");
}
export type PortfolioProject = {
  id: number | string;
  title: string;
  category: string;
  image_url: string;
  sort_order: number;
  video_url?: string;
  visible?: boolean;
  show_in_selected_work?: boolean;
};
export async function getPortfolio() {
  return api.get<PortfolioProject[]>("/portfolio");
}
export async function getTestimonials() {
  return api.get<{ id: number; quote: string; author: string; role: string; image_url: string; sort_order: number }[]>("/testimonials");
}
export async function getBookingPackages() {
  return api.get<{ id: number; name: string; price_aed: number; duration: string; features: string; is_popular: number; sort_order: number }[]>("/booking-packages");
}
export async function getWhyUs() {
  return api.get<{ id: number; icon: string; title: string; description: string; sort_order: number }[]>("/why-us");
}
export async function getStudioEquipment() {
  return api.get<{ id: number; label: string; description: string; sort_order: number }[]>("/studio-equipment");
}
export async function getStudios() {
  return api.get<
    {
      id: string;
      name: string;
      short_description: string;
      details: string;
      price_aed_per_hour: number;
      capacity: number;
      size_sqm: number;
      cover_image_url: string;
      sort_order: number;
      images?: { image_url: string; caption?: string | null; sort_order?: number }[];
    }[]
  >("/studios");
}

export type VideoItem = { id: string; title: string; url: string; sort_order: number };
export async function getVideos() {
  return api.get<VideoItem[]>("/videos");
}

export type BookingPayload = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  project_details?: string;
  package_id?: string;
  studio_id?: string;
  studio_name?: string;
  booking_duration_hours?: number;
  studio_total_aed?: number;
  booking_date?: string;
  time_slot?: string;
  addon_ids?: string[];
  addons_total_aed?: number;
  discount_code?: string;
  discount_percent?: number;
};
export function submitBooking(data: BookingPayload) {
  return api.post<{ success: boolean }>("/booking", data);
}

export async function validateDiscountCodeOnServer(code: string): Promise<{ percent: number } | null> {
  const db = requireFirestore();
  const q = query(
    collection(db, "discount_codes"),
    where("code", "==", code.toUpperCase()),
    where("active", "==", true)
  );
  const snaps = await getDocs(q);
  if (snaps.empty) return null;
  const docSnap = snaps.docs[0];
  const data = docSnap.data() as {
    percent?: number;
    max_uses?: number;
    used_count?: number;
    valid_until?: string;
  };
  const percent = data.percent ?? 0;
  if (!percent || percent <= 0) return null;
  const maxUses = data.max_uses ?? 1;
  const used = data.used_count ?? 0;
  if (used >= maxUses) return null;
  if (data.valid_until) {
    const expires = new Date(data.valid_until).getTime();
    if (!Number.isFinite(expires) || expires < Date.now()) return null;
  }
  return { percent };
}

/** Sends a confirmation email to the customer after booking. Call after submitBooking. */
export async function sendBookingConfirmationEmail(data: BookingPayload): Promise<void> {
  const base = typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";
  const res = await fetch(`${base}/api/send-booking-confirmation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 503) {
      if (typeof window !== "undefined") console.warn("[Booking] Confirmation email not configured (RESEND_API_KEY missing).");
      return;
    }
    if (typeof window !== "undefined") console.error("[Booking] Confirmation email failed:", res.status, body?.error);
    return; // don't throw; booking was already saved
  }
}

/** Payload for "booking confirmed by admin" email. Pass the booking row from the dashboard. */
export type BookingConfirmedPayload = {
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  studio_name?: string;
  package_id?: string;
  package_name?: string;
  booking_date?: string;
  time_slot?: string;
  booking_duration_hours?: number;
  studio_total_aed?: number;
  addons_total_aed?: number;
  project_details?: string;
};

/** Sends "Your booking is confirmed" email to the customer. Call after admin sets status to confirmed. */
export async function sendBookingConfirmedEmail(data: BookingConfirmedPayload): Promise<void> {
  const base = typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";
  const res = await fetch(`${base}/api/send-booking-confirmed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 503 && typeof window !== "undefined") console.warn("[Booking] Confirmed email not configured.");
    else if (typeof window !== "undefined") console.error("[Booking] Confirmed email failed:", res.status, body?.error);
  }
}

export type BookingAddon = {
  id: string;
  name: string;
  description?: string;
  /** Optional image shown on add-on cards */
  image_url?: string | null;
  /** Optional short label like "Ideal for: ..." shown in UI */
  ideal_for?: string | null;
  /** Optional included features text (JSON array string or newline-separated) */
  included_features?: string | null;
  /** Optional "was" price shown as strikethrough in UI */
  price_before_aed?: number | null;
  /** After price (current) used for totals */
  price_aed: number;
  sort_order?: number;
};
export async function getBookingAddons(): Promise<BookingAddon[]> {
  try {
    const list = await api.get<BookingAddon[]>("/booking-addons");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

const MAX_SLOT_HOUR = 22; // 10:00 PM

/**
 * Returns time_slot values (e.g. "09:00", "10:00") that are blocked for the given date.
 * A booking from 3 PM for 3 hours blocks 15:00, 16:00, 17:00 (3 PM–6 PM). Used to prevent double-booking.
 */
export async function getBookedSlots(bookingDate: string, studioId?: string): Promise<string[]> {
  try {
    const q = query(
      collection(requireFirestore(), "bookings"),
      where("booking_date", "==", bookingDate)
    );
    const snaps = await getDocs(q);
    const slotSet = new Set<string>();
    snaps.docs.forEach((d) => {
      const data = d.data();
      const status = data.status as string | undefined;
      if (status === "cancelled") return;
      if (studioId != null && String(data.studio_id ?? "") !== String(studioId)) return;
      const timeSlotRaw = data.time_slot as string | undefined;
      const rawDuration = data.booking_duration_hours as unknown;
      const parsedDuration =
        typeof rawDuration === "number" ? rawDuration : parseInt(String(rawDuration ?? ""), 10);
      const durationHours = Number.isFinite(parsedDuration) && parsedDuration > 0 ? parsedDuration : 1;
      if (!timeSlotRaw) return;

      // Accept "13:00", "13:00 - 15:00", "1:00 PM" (legacy / inconsistent data).
      const m = timeSlotRaw.match(/(\d{1,2}):(\d{2})/);
      if (!m) return;
      const startHour = parseInt(m[1] ?? "0", 10);
      if (isNaN(startHour)) return;
      for (let i = 0; i < durationHours; i++) {
        const hour = startHour + i;
        if (hour <= MAX_SLOT_HOUR) {
          slotSet.add(`${String(hour).padStart(2, "0")}:00`);
        }
      }
    });
    return Array.from(slotSet);
  } catch {
    return [];
  }
}
export function submitContact(data: { name: string; email: string; subject: string; message: string }) {
  return api.post<{ success: boolean }>("/contact", data);
}

/** Sends a copy of the contact form to info@icubeproduction.com via the API. Call after submitContact. */
export async function sendContactEmailNotification(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  const base = typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";
  const res = await fetch(`${base}/api/send-contact-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 503) {
      if (typeof window !== "undefined") console.warn("[Contact] Email not configured (RESEND_API_KEY missing). Message was still saved.");
      return;
    }
    const msg = (body && typeof body.error === "string" ? body.error : "Failed to send email notification") as string;
    if (typeof window !== "undefined") console.error("[Contact] Email send failed:", res.status, msg);
    throw new Error(msg);
  }
}

// Auth
export async function login(email: string, password: string) {
  return api.post<{ success: boolean; user: { id: number; email: string } }>("/login", { email, password });
}
export async function logout() {
  return api.post<{ success: boolean }>("/logout", {});
}
export async function getMe() {
  const auth = requireAuth();
  const u = auth.currentUser;
  if (u) return { id: u.uid, email: u.email || "", name: u.displayName || null };
  // wait a tick if auth is still initializing
  return await new Promise<{ id: string; email: string; name: string | null }>((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (!user) return reject(new Error("Not logged in"));
      resolve({ id: user.uid, email: user.email || "", name: user.displayName || null });
    });
  });
}
