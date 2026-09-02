export type BookingFilterTab = "confirmed" | "awaiting" | "failed" | "all";

export type NormalizedPaymentStatus = "pending" | "paid" | "failed" | "unknown";

export type DashboardBookingLike = {
  status?: string | null;
  payment_status?: string | null;
  package_id?: string | null;
  package_name?: string | null;
  studio_total_aed?: number | null;
  addons_total_aed?: number | null;
  discount_percent?: number | null;
  total_amount_aed?: number | null;
  payment_amount_minor?: number | null;
  ziina_intent_id?: string | null;
};

export type PackageLookup = { id: string | number; name: string; price_aed?: number };

/** Map legacy Ziina / pre-refactor values to pending | paid | failed. */
export function normalizePaymentStatus(raw?: string | null): NormalizedPaymentStatus {
  if (!raw) return "pending";
  const s = raw.toLowerCase();
  if (s === "paid" || s === "completed") return "paid";
  if (s === "failed" || s === "cancelled" || s === "canceled") return "failed";
  if (
    s === "pending" ||
    s === "initiated" ||
    s === "requires_payment_instrument" ||
    s === "requires_user_action"
  ) {
    return "pending";
  }
  return "unknown";
}

/** Treat legacy `pending` booking status as awaiting_payment. */
export function normalizeBookingStatus(raw?: string | null): string {
  if (!raw || raw === "pending") return "awaiting_payment";
  return raw;
}

export function isConfirmedActiveBooking(b: DashboardBookingLike): boolean {
  return normalizePaymentStatus(b.payment_status) === "paid" && b.status === "confirmed";
}

export function getBookingFilterCategory(
  b: DashboardBookingLike
): Exclude<BookingFilterTab, "all"> {
  const payment = normalizePaymentStatus(b.payment_status);
  const status = b.status ?? "";

  if (payment === "paid" && status === "confirmed") return "confirmed";
  if (payment === "failed" || status === "cancelled") return "failed";
  return "awaiting";
}

export function bookingMatchesFilter(b: DashboardBookingLike, tab: BookingFilterTab): boolean {
  if (tab === "all") return true;
  return getBookingFilterCategory(b) === tab;
}

export function canAdminConfirm(b: DashboardBookingLike): boolean {
  if (b.status === "confirmed" || b.status === "cancelled") return false;
  return normalizePaymentStatus(b.payment_status) === "paid";
}

export function needsSidebarAttention(b: DashboardBookingLike): boolean {
  return normalizePaymentStatus(b.payment_status) === "paid" && b.status !== "confirmed";
}

export function paymentStatusLabel(raw?: string | null): string {
  const normalized = normalizePaymentStatus(raw);
  switch (normalized) {
    case "paid":
      return "Paid";
    case "failed":
      return "Failed";
    case "pending":
      return "Pending payment";
    default:
      return raw?.trim() || "Unknown";
  }
}

export function bookingStatusLabel(raw?: string | null): string {
  const normalized = normalizeBookingStatus(raw);
  switch (normalized) {
    case "awaiting_payment":
      return "Awaiting payment";
    case "confirmed":
      return "Confirmed";
    case "cancelled":
      return "Cancelled";
    default:
      return normalized.replace(/_/g, " ");
  }
}

export function paymentStatusBadgeClass(raw?: string | null): string {
  const normalized = normalizePaymentStatus(raw);
  switch (normalized) {
    case "paid":
      return "bg-green-500/20 text-green-400";
    case "failed":
      return "bg-red-500/20 text-red-400";
    case "pending":
      return "bg-amber-500/20 text-amber-300";
    default:
      return "bg-white/10 text-gray-300";
  }
}

export function bookingStatusBadgeClass(raw?: string | null): string {
  const normalized = normalizeBookingStatus(raw);
  switch (normalized) {
    case "confirmed":
      return "bg-green-500/20 text-green-400";
    case "cancelled":
      return "bg-red-500/20 text-red-400";
    case "awaiting_payment":
      return "bg-icube-gold/20 text-icube-gold";
    default:
      return "bg-white/10 text-gray-300";
  }
}

export function formatPaymentReference(intentId?: string | null): string {
  if (!intentId?.trim()) return "—";
  const id = intentId.trim();
  if (id.length <= 14) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

export function computeBookingTotalAed(b: DashboardBookingLike, packagePrice?: number | null): number | null {
  if (b.total_amount_aed != null && Number.isFinite(b.total_amount_aed)) return b.total_amount_aed;
  if (b.payment_amount_minor != null && Number.isFinite(b.payment_amount_minor)) {
    return Math.round(b.payment_amount_minor) / 100;
  }

  const addonsTotal = b.addons_total_aed ?? 0;
  const studioTotal = b.studio_total_aed ?? null;
  const base = studioTotal ?? packagePrice ?? null;
  if (base == null && addonsTotal <= 0) return null;

  const subtotal = (base ?? 0) + addonsTotal;
  const discountPercent = b.discount_percent ?? 0;
  const discountAmount = discountPercent > 0 ? Math.round(subtotal * (discountPercent / 100)) : 0;
  return subtotal - discountAmount;
}

export function formatBookingAmount(
  b: DashboardBookingLike,
  packagePrice?: number | null
): string {
  const total = computeBookingTotalAed(b, packagePrice);
  return total != null ? `${total} AED` : "—";
}

export function getPackageDisplayName(
  b: Pick<DashboardBookingLike, "package_id" | "package_name">,
  packages: PackageLookup[]
): string {
  if (b.package_name?.trim()) return b.package_name.trim();
  if (!b.package_id) return "—";

  const pkg = packages.find(
    (p) => String(p.id) === String(b.package_id) || Number(p.id) === Number(b.package_id)
  );
  return pkg ? pkg.name : b.package_id;
}

export function getPackagePrice(
  b: Pick<DashboardBookingLike, "package_id">,
  packages: PackageLookup[]
): number | null {
  if (!b.package_id) return null;
  const pkg = packages.find(
    (p) => String(p.id) === String(b.package_id) || Number(p.id) === Number(b.package_id)
  );
  return pkg?.price_aed ?? null;
}

export const BOOKING_FILTER_TABS: { id: BookingFilterTab; label: string }[] = [
  { id: "confirmed", label: "Confirmed / Paid" },
  { id: "awaiting", label: "Awaiting Payment" },
  { id: "failed", label: "Failed / Cancelled" },
  { id: "all", label: "All" },
];

export function workshopMatchesFilter(
  e: { payment_status?: string | null },
  tab: BookingFilterTab
): boolean {
  if (tab === "all") return true;
  const payment = normalizePaymentStatus(e.payment_status);
  if (tab === "confirmed") return payment === "paid";
  if (tab === "failed") return payment === "failed";
  return payment === "pending" || payment === "unknown";
}
