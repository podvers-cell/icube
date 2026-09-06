export type PaymentIncidentType =
  | "amount_mismatch"
  | "slot_conflict"
  | "workshop_capacity_conflict"
  | "workshop_unavailable";

export type PaymentIncidentStatus = "open" | "resolved";

export type PaymentIncident = {
  id: string;
  type: PaymentIncidentType | string;
  status: PaymentIncidentStatus | string;
  refund_status?: string | null;
  source_collection?: string | null;
  source_id?: string | null;
  workshop_id?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  expected_amount_minor?: number | null;
  expected_currency?: string | null;
  paid_amount_minor?: number | null;
  paid_currency?: string | null;
  validation_error?: string | null;
  payment_event?: string | null;
  provider_status?: string | null;
  resolution_note?: string | null;
  created_at?: string | null;
  resolved_at?: string | null;
};

/** What actually went wrong, in words the studio owner can act on. */
export function incidentSummary(type: string): { title: string; action: string } {
  switch (type) {
    case "amount_mismatch":
      return {
        title: "Paid amount does not match the price",
        action: "Check the payment in Ziina, then refund the difference or complete the booking manually.",
      };
    case "slot_conflict":
      return {
        title: "Slot was taken before payment cleared",
        action: "The customer paid for a slot someone else got. Offer another slot or refund.",
      };
    case "workshop_capacity_conflict":
      return {
        title: "Workshop was full when payment cleared",
        action: "The customer paid for a full workshop. Refund, or add a place if you can.",
      };
    case "workshop_unavailable":
      return {
        title: "Workshop no longer exists",
        action: "The customer paid for a workshop that has been deleted. Refund is required.",
      };
    default:
      return { title: "Payment needs review", action: "Check this payment in Ziina." };
  }
}

export function formatMinorAmount(minor?: number | null, currency?: string | null): string {
  if (minor == null || !Number.isFinite(minor)) return "—";
  return `${(currency || "AED").toUpperCase()} ${(minor / 100).toLocaleString("en-AE", {
    minimumFractionDigits: 2,
  })}`;
}
