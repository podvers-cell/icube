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
} from "firebase/firestore";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { firebaseAuth, firestore } from "./firebase";

type IdDoc<T> = T & { id: string };

function assertAuth() {
  if (!firebaseAuth.currentUser) throw new Error("Unauthorized");
}

async function getSettingsDoc() {
  const ref = doc(firestore, "site_settings", "main");
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    // Create empty doc (will require permissive rules or admin)
    await setDoc(ref, { created_at: serverTimestamp() }, { merge: true });
    return {};
  }
  return (snap.data() || {}) as Record<string, string>;
}

async function listCollection<T>(name: string) {
  const q = query(collection(firestore, name), orderBy("sort_order", "asc"));
  const snaps = await getDocs(q);
  return snaps.docs.map((d) => ({ id: d.id, ...(d.data() as T) })) as IdDoc<T>[];
}

async function listByCreatedAtDesc<T>(name: string, max = 500) {
  const q = query(collection(firestore, name), orderBy("created_at", "desc"), limit(max));
  const snaps = await getDocs(q);
  return snaps.docs.map((d) => ({ id: d.id, ...(d.data() as T) })) as IdDoc<T>[];
}

// A compatibility layer so existing dashboard code can keep calling api.get("/dashboard/...").
export const api = {
  get: async <T>(path: string): Promise<T> => {
    if (path === "/site/settings") return (await getSettingsDoc()) as T;
    if (path === "/services") return (await listCollection("services")) as T;
    if (path === "/portfolio") return (await listCollection("portfolio")) as T;
    if (path === "/testimonials") return (await listCollection("testimonials")) as T;
    if (path === "/booking-packages") return (await listCollection("booking_packages")) as T;
    if (path === "/why-us") return (await listCollection("why_us")) as T;
    if (path === "/studio-equipment") return (await listCollection("studio_equipment")) as T;
    if (path === "/studios") return (await listCollection("studios")) as T;

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
      const b = body as {
        first_name: string;
        last_name: string;
        email: string;
        project_details?: string;
        package_id?: string;
      };
      await addDoc(collection(firestore, "bookings"), {
        ...b,
        status: "pending",
        created_at: serverTimestamp(),
      });
      return { success: true } as T;
    }
    if (path === "/contact") {
      const m = body as { name: string; email: string; subject: string; message: string };
      await addDoc(collection(firestore, "contact_messages"), {
        ...m,
        read_at: null,
        created_at: serverTimestamp(),
      });
      return { success: true } as T;
    }

    // Auth
    if (path === "/login") {
      const { email, password } = body as { email: string; password: string };
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      return { success: true, user: { id: firebaseAuth.currentUser?.uid, email } } as T;
    }
    if (path === "/logout") {
      await signOut(firebaseAuth);
      return { success: true } as T;
    }

    // Dashboard creates
    if (path === "/dashboard/services") {
      assertAuth();
      const s = body as any;
      const ref = await addDoc(collection(firestore, "services"), {
        ...s,
        created_at: serverTimestamp(),
      });
      return { id: ref.id, ...s } as T;
    }
    if (path === "/dashboard/portfolio") {
      assertAuth();
      const p = body as any;
      const ref = await addDoc(collection(firestore, "portfolio"), { ...p, created_at: serverTimestamp() });
      return { id: ref.id, ...p } as T;
    }
    if (path === "/dashboard/testimonials") {
      assertAuth();
      const t = body as any;
      const ref = await addDoc(collection(firestore, "testimonials"), { ...t, created_at: serverTimestamp() });
      return { id: ref.id, ...t } as T;
    }
    if (path === "/dashboard/packages") {
      assertAuth();
      const p = body as any;
      const ref = await addDoc(collection(firestore, "booking_packages"), { ...p, created_at: serverTimestamp() });
      return { id: ref.id, ...p } as T;
    }
    if (path === "/dashboard/studios") {
      assertAuth();
      const s = body as any;
      const ref = await addDoc(collection(firestore, "studios"), { ...s, created_at: serverTimestamp() });
      return { id: ref.id, ...s } as T;
    }

    throw new Error(`Unknown POST path: ${path}`);
  },

  put: async <T>(path: string, body: unknown): Promise<T> => {
    // Settings
    if (path === "/dashboard/settings") {
      assertAuth();
      await setDoc(doc(firestore, "site_settings", "main"), { ...(body as any), updated_at: serverTimestamp() }, { merge: true });
      return { success: true } as T;
    }

    const m = path.match(/^\/dashboard\/(services|portfolio|testimonials|packages|why-us|studio-equipment|studios)\/([^/]+)$/);
    if (m) {
      assertAuth();
      const [, kind, id] = m;
      const col =
        kind === "packages"
          ? "booking_packages"
          : kind === "why-us"
            ? "why_us"
            : kind === "studio-equipment"
              ? "studio_equipment"
              : kind;
      await setDoc(doc(firestore, col, id), { ...(body as any), updated_at: serverTimestamp() }, { merge: true });
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
      await updateDoc(doc(firestore, "bookings", id), { ...(body as any), updated_at: serverTimestamp() });
      return { success: true } as T;
    }
    // messages read
    const r = path.match(/^\/dashboard\/messages\/([^/]+)\/read$/);
    if (r) {
      assertAuth();
      const id = r[1];
      await updateDoc(doc(firestore, "contact_messages", id), { read_at: serverTimestamp() });
      return { success: true } as T;
    }

    throw new Error(`Unknown PATCH path: ${path}`);
  },

  delete: async <T>(path: string): Promise<T> => {
    const m = path.match(/^\/dashboard\/(services|portfolio|testimonials|packages|studios)\/([^/]+)$/);
    if (m) {
      assertAuth();
      const [, kind, id] = m;
      const col =
        kind === "packages"
          ? "booking_packages"
          : kind;
      await deleteDoc(doc(firestore, col, id));
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
  return api.get<{ id: number; title: string; description: string; icon: string; sort_order: number }[]>("/services");
}
export async function getPortfolio() {
  return api.get<{ id: number; title: string; category: string; image_url: string; sort_order: number }[]>("/portfolio");
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

export function submitBooking(data: { first_name: string; last_name: string; email: string; project_details?: string; package_id?: number }) {
  return api.post<{ success: boolean }>("/booking", data);
}
export function submitContact(data: { name: string; email: string; subject: string; message: string }) {
  return api.post<{ success: boolean }>("/contact", data);
}

// Auth
export async function login(email: string, password: string) {
  return api.post<{ success: boolean; user: { id: number; email: string } }>("/login", { email, password });
}
export async function logout() {
  return api.post<{ success: boolean }>("/logout", {});
}
export async function getMe() {
  const u = firebaseAuth.currentUser;
  if (u) return { id: u.uid, email: u.email || "", name: u.displayName || null };
  // wait a tick if auth is still initializing
  return await new Promise<{ id: string; email: string; name: string | null }>((resolve, reject) => {
    const unsub = onAuthStateChanged(firebaseAuth, (user) => {
      unsub();
      if (!user) return reject(new Error("Not logged in"));
      resolve({ id: user.uid, email: user.email || "", name: user.displayName || null });
    });
  });
}
