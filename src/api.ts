import {
  collection,
  deleteDoc,
  deleteField,
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
import type { RentalEquipment } from "./types/rentalEquipment";
import type { PaymentIncident } from "./types/paymentIncident";

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
    case "blocked-slots":
      return "blocked_slots";
    case "workshop-bookings":
      return "workshop_enrollments";
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
/**
 * Refresh the server-rendered public pages after a write.
 *
 * The public site is cached for five minutes. Individual dashboard screens used to call
 * invalidateSiteCache by hand and most of them did not, so an edit sat invisible until the window
 * expired. Doing it here covers every write through this layer.
 */
async function refreshPublicSite(path: string): Promise<void> {
  if (!path.startsWith("/dashboard/")) return;
  try {
    const user = requireAuth().currentUser;
    if (!user) return;
    await fetch("/api/revalidate", {
      method: "POST",
      headers: { Authorization: `Bearer ${await user.getIdToken()}` },
    });
  } catch {
    // The edit still appears when the cache expires on its own.
  }
}

const rawApi = {
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
    if (path === "/workshops") return (await listCollection("workshops")) as T;

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
    if (path === "/dashboard/workshops") {
      assertAuth();
      return (await listCollection("workshops")) as T;
    }
    if (path === "/dashboard/blocked-slots") {
      assertAuth();
      return (await listByCreatedAtDesc("blocked_slots")) as T;
    }
    if (path === "/dashboard/bookings") {
      assertAuth();
      const [confirmed, pending] = await Promise.all([
        listByCreatedAtDesc<Record<string, unknown>>("bookings"),
        listByCreatedAtDesc<Record<string, unknown>>("pending_bookings"),
      ]);
      return [...confirmed, ...pending] as T;
    }
    if (path === "/dashboard/workshop-bookings") {
      assertAuth();
      return (await listByCreatedAtDesc("workshop_enrollments")) as T;
    }
    if (path === "/dashboard/messages") {
      assertAuth();
      return (await listByCreatedAtDesc("contact_messages")) as T;
    }

    throw new Error(`Unknown GET path: ${path}`);
  },

  post: async <T>(path: string, body: unknown): Promise<T> => {
    if (path === "/booking") {
      throw new Error("Direct booking creation is deprecated. Use /api/bookings/create.");
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
      const p = stripUndefined(docBody(body));
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
    if (path === "/dashboard/workshops") {
      assertAuth();
      const w = docBody(body);
      const ref = await addDoc(collection(requireFirestore(), "workshops"), { ...w, created_at: serverTimestamp() });
      return { id: ref.id, ...w } as T;
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
    if (path === "/dashboard/blocked-slots") {
      assertAuth();
      const s = docBody(body);
      const ref = await addDoc(collection(requireFirestore(), "blocked_slots"), {
        ...s,
        created_at: serverTimestamp(),
      });
      return { id: ref.id, ...s } as T;
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

    const m = path.match(
      /^\/dashboard\/(services|portfolio|testimonials|packages|addons|why-us|studio-equipment|studios|videos|workshops|discount-codes|blocked-slots)\/([^/]+)$/
    );
    if (m) {
      assertAuth();
      const [, kind, id] = m;
      const col = dashboardKindToCollection(kind!);
      const payload = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
      if (kind === "services" && payload.remove_legacy_case_study_fields) {
        const { remove_legacy_case_study_fields: _remove, ...rest } = payload;
        await updateDoc(doc(requireFirestore(), col, id!), {
          ...rest,
          case_study_stats: deleteField(),
          case_study_infographics: deleteField(),
          updated_at: serverTimestamp(),
        });
      } else {
        await setDoc(
          doc(requireFirestore(), col, id!),
          { ...stripUndefined(payload), updated_at: serverTimestamp() },
          { merge: true }
        );
      }
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
    const cm = path.match(/^\/dashboard\/messages\/([^/]+)$/);
    if (cm) {
      assertAuth();
      const id = cm[1];
      await deleteDoc(doc(requireFirestore(), "contact_messages", id));
      return { success: true } as T;
    }
    const we = path.match(/^\/dashboard\/workshop-bookings\/([^/]+)$/);
    if (we) {
      assertAuth();
      const id = we[1];
      await deleteDoc(doc(requireFirestore(), "workshop_enrollments", id));
      return { success: true } as T;
    }
    const m = path.match(
      /^\/dashboard\/(services|portfolio|testimonials|packages|addons|why-us|studio-equipment|studios|videos|workshops|discount-codes|blocked-slots)\/([^/]+)$/
    );
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

/**
 * Public reads pass through untouched; every write refreshes the cached public pages once it has
 * actually succeeded. Doing it here rather than in each screen fixes the nine dashboard pages that
 * never called invalidateSiteCache, and guarantees the refresh runs after the write, not before.
 */
export const api = {
  get: rawApi.get,
  post: async <T>(path: string, body: unknown): Promise<T> => {
    const result = await rawApi.post<T>(path, body);
    void refreshPublicSite(path);
    return result;
  },
  put: async <T>(path: string, body: unknown): Promise<T> => {
    const result = await rawApi.put<T>(path, body);
    void refreshPublicSite(path);
    return result;
  },
  patch: async <T>(path: string, body?: unknown): Promise<T> => {
    const result = await rawApi.patch<T>(path, body);
    void refreshPublicSite(path);
    return result;
  },
  delete: async <T>(path: string): Promise<T> => {
    const result = await rawApi.delete<T>(path);
    void refreshPublicSite(path);
    return result;
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
      case_study_intro?: string;
      case_studies?: string;
    }[]
  >("/services");
}
export type PortfolioProject = {
  id: number | string;
  title: string;
  category: string;
  client?: string;
  image_url: string;
  sort_order: number;
  video_url?: string;
  video_urls?: string[];
  gallery_images?: string[];
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
  return api.get<{
    id: number | string;
    name: string;
    price_aed: number;
    duration: string;
    features: string;
    is_popular: number;
    is_premium?: number;
    sort_order: number;
    description?: string;
    best_for_label?: string;
    category?: string;
  }[]>("/booking-packages");
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

export type WorkshopItem = {
  id: string;
  title: string;
  price_before_aed?: number;
  short_description?: string;
  description?: string;
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

export async function getWorkshops() {
  return api.get<WorkshopItem[]>("/workshops");
}

export async function enrollWorkshop(data: {
  workshop_id: string;
  full_name: string;
  email: string;
  phone: string;
}): Promise<{ success: boolean; enrollment_id: string; checkout_token?: string }> {
  const base = typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";
  const response = await fetch(`${base}/api/workshops/enroll`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
    enrollment_id?: string;
    checkout_token?: string;
  };
  if (!response.ok || !body.enrollment_id) {
    throw new Error(body.error || "Failed to start workshop enrollment.");
  }
  return { success: true, enrollment_id: body.enrollment_id, checkout_token: body.checkout_token };
}

export type BookingPayload = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  project_details?: string;
  package_id?: string;
  schedule_preference?: "scheduled" | "unscheduled";
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
  total_amount_aed?: number;
};

export async function submitBooking(data: BookingPayload & { total_amount_aed: number }) {
  const base = typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";
  const res = await fetch(`${base}/api/bookings/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = (await res.json().catch(() => ({}))) as {
    error?: string;
    booking_id?: string;
    checkout_token?: string;
  };
  if (!res.ok) {
    throw new Error(body.error || "Failed to create booking");
  }
  return { success: true, booking_id: body.booking_id as string, checkout_token: body.checkout_token };
}

export type BookingInquiryPayload = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  project_details?: string;
};

export async function submitBookingInquiry(data: BookingInquiryPayload): Promise<{ success: boolean; inquiry_id: string }> {
  const base = typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";
  const res = await fetch(`${base}/api/bookings/inquiry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, source: "custom_package_form" }),
  });
  const body = (await res.json().catch(() => ({}))) as { error?: string; inquiry_id?: string };
  if (!res.ok) {
    throw new Error(body.error || "Failed to submit inquiry");
  }
  return { success: true, inquiry_id: body.inquiry_id as string };
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

/** @deprecated Pre-payment confirmation emails are disabled. Confirmation is sent only after successful payment. */
export async function sendBookingConfirmationEmail(_data: BookingPayload): Promise<void> {
  if (typeof window !== "undefined") {
    console.warn("[Booking] Pre-payment confirmation emails are disabled.");
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
  /** When true-ish, highlight as "Most Popular" on the site. */
  is_popular?: boolean | number;
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

async function adminAuthHeaders(): Promise<Record<string, string>> {
  const user = requireAuth().currentUser;
  if (!user) throw new Error("Please sign in as an administrator.");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${await user.getIdToken()}`,
  };
}

async function parseRentalEquipmentResponse(response: Response): Promise<{ items?: RentalEquipment[]; item?: RentalEquipment; error?: string }> {
  const body = (await response.json().catch(() => ({}))) as { items?: RentalEquipment[]; item?: RentalEquipment; error?: string };
  if (!response.ok) throw new Error(body.error || "Rental equipment request failed.");
  return body;
}

export async function getRentalEquipment(includeHidden = false): Promise<RentalEquipment[]> {
  const headers = includeHidden ? await adminAuthHeaders() : undefined;
  const response = await fetch(`/api/rental-equipment${includeHidden ? "?include_hidden=1" : ""}`, { headers });
  const body = await parseRentalEquipmentResponse(response);
  return Array.isArray(body.items) ? body.items : [];
}

export async function createRentalEquipment(data: Omit<RentalEquipment, "id">): Promise<RentalEquipment> {
  const response = await fetch("/api/rental-equipment", {
    method: "POST",
    headers: await adminAuthHeaders(),
    body: JSON.stringify(data),
  });
  const body = await parseRentalEquipmentResponse(response);
  if (!body.item) throw new Error("No equipment item returned.");
  void refreshPublicSite("/dashboard/rental-equipment");
  return body.item;
}

export async function updateRentalEquipment(id: string, data: Omit<RentalEquipment, "id">): Promise<void> {
  const response = await fetch(`/api/rental-equipment/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: await adminAuthHeaders(),
    body: JSON.stringify(data),
  });
  await parseRentalEquipmentResponse(response);
  void refreshPublicSite("/dashboard/rental-equipment");
}

export async function deleteRentalEquipment(id: string): Promise<void> {
  const response = await fetch(`/api/rental-equipment/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: await adminAuthHeaders(),
  });
  await parseRentalEquipmentResponse(response);
  void refreshPublicSite("/dashboard/rental-equipment");
}

export async function getPaymentIncidents(): Promise<PaymentIncident[]> {
  const response = await fetch("/api/payment-incidents", { headers: await adminAuthHeaders() });
  const body = (await response.json().catch(() => ({}))) as { items?: PaymentIncident[]; error?: string };
  if (!response.ok) throw new Error(body.error || "Failed to load payment incidents.");
  return Array.isArray(body.items) ? body.items : [];
}

export async function resolvePaymentIncident(
  id: string,
  status: "open" | "resolved",
  resolutionNote = ""
): Promise<void> {
  const response = await fetch(`/api/payment-incidents/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: await adminAuthHeaders(),
    body: JSON.stringify({ status, resolution_note: resolutionNote }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || "Failed to update the incident.");
  }
}

const MAX_SLOT_HOUR = 22; // 10:00 PM — kept for blocked_slots client merge

/**
 * Returns occupied time_slot values for a date via server (paid/confirmed bookings only).
 */
export async function getBookedSlots(bookingDate: string, studioId?: string): Promise<string[]> {
  try {
    const params = new URLSearchParams({ date: bookingDate });
    if (studioId) params.set("studio_id", studioId);
    const base = typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";
    const res = await fetch(`${base}/api/bookings/booked-slots?${params.toString()}`);
    const body = (await res.json().catch(() => ({}))) as { slots?: string[] };
    const slots = Array.isArray(body.slots) ? body.slots : [];
    const slotSet = new Set(slots);
    // Add admin-blocked slots
    try {
      const blockedQ = query(
        collection(requireFirestore(), "blocked_slots"),
        where("booking_date", "==", bookingDate)
      );
      const blockedSnaps = await getDocs(blockedQ);
      blockedSnaps.docs.forEach((d) => {
        const data = d.data() as { time_slot?: string; studio_id?: string | null };
        if (!data?.time_slot) return;
        const blockedStudio = data.studio_id ?? null;
        // If block has no studio_id -> applies to all studios. Otherwise match selected studio.
        if (blockedStudio == null || (studioId != null && String(blockedStudio) === String(studioId))) {
          slotSet.add(String(data.time_slot));
        }
      });
    } catch {
      // ignore; bookings still returned
    }
    return Array.from(slotSet);
  } catch {
    return [];
  }
}
export async function submitContact(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<{ success: boolean }> {
  const parsed = contactFormSchema.safeParse(data);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid contact data";
    throw new Error(msg);
  }
  const base = typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";
  const res = await fetch(`${base}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (body && typeof body.error === "string" ? body.error : "Failed to submit contact message") as string;
    throw new Error(msg);
  }
  return { success: true };
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
