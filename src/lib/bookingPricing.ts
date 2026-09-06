import type { Firestore } from "firebase-admin/firestore";
import type { CreatePendingBookingSchema } from "@/schemas/booking";
import { ClientFacingError } from "@/lib/apiErrors";

const PAYMENT_CURRENCY = "AED";

type CatalogDocument = {
  id: string;
  data: Record<string, unknown>;
};

export type CanonicalBookingPricing = {
  booking_type: "package" | "studio";
  package_name?: string;
  studio_name?: string;
  studio_total_aed?: number;
  addons_total_aed: number;
  discount_code?: string;
  discount_percent?: number;
  total_amount_aed: number;
  expected_payment_amount_minor: number;
  expected_payment_currency: typeof PAYMENT_CURRENCY;
};

export type CanonicalWorkshopPricing = {
  workshop_title: string;
  workshop_date?: string;
  amount_aed: number;
  expected_payment_amount_minor: number;
  expected_payment_currency: typeof PAYMENT_CURRENCY;
};

export type PaymentExpectationRecord = {
  expected_payment_amount_minor?: unknown;
  expected_payment_currency?: unknown;
};

export type PaymentAmountCheck =
  | { ok: true }
  | { ok: false; reason: "missing_expectation" | "invalid_provider_amount" | "amount_mismatch" | "currency_mismatch" };

function roundAed(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function aedToMinorUnits(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new ClientFacingError("Invalid checkout amount.");
  }
  return Math.round(roundAed(value) * 100);
}

export function checkExpectedPayment(
  record: PaymentExpectationRecord,
  amountMinor: unknown,
  currency: unknown
): PaymentAmountCheck {
  const expectedAmount = Number(record.expected_payment_amount_minor);
  const expectedCurrency =
    typeof record.expected_payment_currency === "string"
      ? record.expected_payment_currency.trim().toUpperCase()
      : "";
  const providerAmount = Number(amountMinor);
  const providerCurrency = typeof currency === "string" ? currency.trim().toUpperCase() : "";

  if (!Number.isInteger(expectedAmount) || expectedAmount <= 0 || !expectedCurrency) {
    return { ok: false, reason: "missing_expectation" };
  }
  if (!Number.isInteger(providerAmount) || providerAmount <= 0) {
    return { ok: false, reason: "invalid_provider_amount" };
  }
  if (providerCurrency !== expectedCurrency) {
    return { ok: false, reason: "currency_mismatch" };
  }
  if (providerAmount !== expectedAmount) {
    return { ok: false, reason: "amount_mismatch" };
  }
  return { ok: true };
}

async function findCatalogDocument(db: Firestore, collectionName: string, rawId: string): Promise<CatalogDocument | null> {
  const id = rawId.trim();
  if (!id) return null;

  const direct = await db.collection(collectionName).doc(id).get();
  if (direct.exists) {
    return { id: direct.id, data: direct.data() ?? {} };
  }

  const numericId = Number(id);
  if (Number.isFinite(numericId)) {
    const numericMatch = await db.collection(collectionName).where("id", "==", numericId).limit(1).get();
    if (!numericMatch.empty) {
      const match = numericMatch.docs[0];
      return { id: match.id, data: match.data() };
    }
  }

  const stringMatch = await db.collection(collectionName).where("id", "==", id).limit(1).get();
  if (!stringMatch.empty) {
    const match = stringMatch.docs[0];
    return { id: match.id, data: match.data() };
  }

  return null;
}

function requireName(data: Record<string, unknown>, label: string): string {
  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (!name) throw new ClientFacingError(`${label} is unavailable.`);
  return name;
}

function requirePositivePrice(value: unknown, label: string): number {
  const price = Number(value);
  if (!Number.isFinite(price) || price <= 0) {
    throw new ClientFacingError(`${label} price is unavailable.`);
  }
  return roundAed(price);
}

function packagePrice(data: Record<string, unknown>): number {
  const direct = Number(data.price_aed);
  if (Number.isFinite(direct) && direct > 0) return roundAed(direct);

  const fallback = typeof data.price_after === "string" ? data.price_after.replace(/,/g, "").match(/\d+(?:\.\d+)?/)?.[0] : null;
  return requirePositivePrice(fallback, "Package");
}

function discountExpiryMs(value: unknown): number | null {
  if (typeof value === "string" || typeof value === "number" || value instanceof Date) {
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const parsed = value.toDate().getTime();
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

async function resolveDiscount(
  db: Firestore,
  rawCode: string | undefined
): Promise<{ code?: string; percent: number }> {
  const code = rawCode?.trim().toUpperCase();
  if (!code) return { percent: 0 };

  const snaps = await db.collection("discount_codes").where("code", "==", code).limit(1).get();
  if (snaps.empty) throw new ClientFacingError("Discount code is invalid or expired.");

  const data = snaps.docs[0].data() as Record<string, unknown>;
  const percent = Number(data.percent);
  const maxUses = Number(data.max_uses ?? 1);
  const usedCount = Number(data.used_count ?? 0);
  const expiryMs = discountExpiryMs(data.valid_until);
  const active = data.active === true;

  if (
    !active ||
    !Number.isFinite(percent) ||
    percent <= 0 ||
    percent > 100 ||
    !Number.isFinite(maxUses) ||
    !Number.isFinite(usedCount) ||
    usedCount >= maxUses ||
    (data.valid_until != null && (expiryMs == null || expiryMs < Date.now()))
  ) {
    throw new ClientFacingError("Discount code is invalid or expired.");
  }

  return { code, percent };
}

export async function resolveCanonicalBookingPricing(
  db: Firestore,
  input: CreatePendingBookingSchema
): Promise<CanonicalBookingPricing> {
  const packageId = input.package_id?.trim();
  const studioId = input.studio_id?.trim();
  if (!packageId && !studioId) throw new ClientFacingError("A package or studio is required.");

  let bookingType: CanonicalBookingPricing["booking_type"];
  let baseAmount = 0;
  let packageName: string | undefined;
  let studioName: string | undefined;
  let studioTotal: number | undefined;

  if (packageId) {
    const pkg = await findCatalogDocument(db, "booking_packages", packageId);
    if (!pkg) throw new ClientFacingError("Package is unavailable.");
    bookingType = "package";
    packageName = requireName(pkg.data, "Package");
    baseAmount = packagePrice(pkg.data);
  } else {
    bookingType = "studio";
    const duration = input.booking_duration_hours;
    if (!duration || !Number.isInteger(duration) || duration < 1 || duration > 24) {
      throw new ClientFacingError("Invalid studio booking duration.");
    }
    const studio = await findCatalogDocument(db, "studios", studioId!);
    if (!studio) throw new ClientFacingError("Studio is unavailable.");
    studioName = requireName(studio.data, "Studio");
    studioTotal = roundAed(requirePositivePrice(studio.data.price_aed_per_hour, "Studio") * duration);
    baseAmount = studioTotal;
  }

  if (studioId && bookingType === "package") {
    const studio = await findCatalogDocument(db, "studios", studioId);
    if (!studio) throw new ClientFacingError("Studio is unavailable.");
    studioName = requireName(studio.data, "Studio");
  }

  const addonIds = input.addon_ids ?? [];
  if (new Set(addonIds).size !== addonIds.length) {
    throw new ClientFacingError("Duplicate add-ons are not allowed.");
  }

  let addonsTotal = 0;
  for (const addonId of addonIds) {
    const addon = await findCatalogDocument(db, "booking_addons", addonId);
    if (!addon) throw new ClientFacingError("One or more add-ons are unavailable.");
    addonsTotal += requirePositivePrice(addon.data.price_aed, "Add-on");
  }
  addonsTotal = roundAed(addonsTotal);

  const discount = await resolveDiscount(db, input.discount_code);
  const subtotal = roundAed(baseAmount + addonsTotal);
  const discountAmount = roundAed(subtotal * (discount.percent / 100));
  const total = roundAed(subtotal - discountAmount);
  const expectedMinor = aedToMinorUnits(total);

  return {
    booking_type: bookingType,
    ...(packageName ? { package_name: packageName } : {}),
    ...(studioName ? { studio_name: studioName } : {}),
    ...(studioTotal != null ? { studio_total_aed: studioTotal } : {}),
    addons_total_aed: addonsTotal,
    ...(discount.code ? { discount_code: discount.code, discount_percent: discount.percent } : {}),
    total_amount_aed: total,
    expected_payment_amount_minor: expectedMinor,
    expected_payment_currency: PAYMENT_CURRENCY,
  };
}

export async function resolveCanonicalWorkshopPricing(
  db: Firestore,
  workshopId: string
): Promise<CanonicalWorkshopPricing> {
  const workshop = await findCatalogDocument(db, "workshops", workshopId);
  if (!workshop) throw new ClientFacingError("Workshop is unavailable.");

  const title = typeof workshop.data.title === "string" ? workshop.data.title.trim() : "";
  if (!title) throw new ClientFacingError("Workshop is unavailable.");
  const amount = requirePositivePrice(workshop.data.price_aed, "Workshop");
  const workshopDate =
    typeof workshop.data.workshop_date === "string" && workshop.data.workshop_date.trim()
      ? workshop.data.workshop_date.trim()
      : undefined;

  return {
    workshop_title: title,
    ...(workshopDate ? { workshop_date: workshopDate } : {}),
    amount_aed: amount,
    expected_payment_amount_minor: aedToMinorUnits(amount),
    expected_payment_currency: PAYMENT_CURRENCY,
  };
}
