import { describe, expect, it } from "vitest";
import type { Firestore } from "firebase-admin/firestore";
import {
  aedToMinorUnits,
  checkExpectedPayment,
  resolveCanonicalBookingPricing,
  resolveCanonicalWorkshopPricing,
} from "./bookingPricing";
import type { CreatePendingBookingSchema } from "@/schemas/booking";

type FakeCollections = Record<string, Record<string, Record<string, unknown>>>;

function fakeSnapshot(id: string, value: Record<string, unknown> | undefined) {
  return {
    id,
    exists: Boolean(value),
    data: () => value,
  };
}

function fakeFirestore(collections: FakeCollections): Firestore {
  return {
    collection(collectionName: string) {
      const entries = collections[collectionName] ?? {};
      return {
        doc(id: string) {
          return { get: async () => fakeSnapshot(id, entries[id]) };
        },
        where(field: string, _operator: string, expected: unknown) {
          return {
            limit() {
              return {
                get: async () => {
                  const match = Object.entries(entries).find(([, value]) => value[field] === expected);
                  const docs = match ? [fakeSnapshot(match[0], match[1])] : [];
                  return { empty: docs.length === 0, docs };
                },
              };
            },
          };
        },
      };
    },
  } as unknown as Firestore;
}

function bookingInput(overrides: Partial<CreatePendingBookingSchema> = {}): CreatePendingBookingSchema {
  return {
    first_name: "Test",
    last_name: "Customer",
    email: "test@example.com",
    phone: "+971500000000",
    total_amount_aed: 1,
    ...overrides,
  };
}

describe("booking pricing security", () => {
  it("calculates package, add-ons, and discount from server catalog values", async () => {
    const db = fakeFirestore({
      booking_packages: {
        package1: { name: "Starter Creator", price_aed: 0, price_after: "2,999" },
      },
      booking_addons: {
        addon1: { name: "Teleprompter", price_aed: 250 },
      },
      discount_codes: {
        discount1: { code: "SAVE10", active: true, percent: 10, max_uses: 100, used_count: 1 },
      },
    });

    const result = await resolveCanonicalBookingPricing(
      db,
      bookingInput({
        package_id: "package1",
        addon_ids: ["addon1"],
        discount_code: "save10",
        addons_total_aed: 1,
        discount_percent: 99,
        total_amount_aed: 1,
      })
    );

    expect(result).toMatchObject({
      booking_type: "package",
      package_name: "Starter Creator",
      addons_total_aed: 250,
      discount_code: "SAVE10",
      discount_percent: 10,
      total_amount_aed: 2924.1,
      expected_payment_amount_minor: 292410,
      expected_payment_currency: "AED",
    });
  });

  it("calculates studio duration and add-ons from server values", async () => {
    const db = fakeFirestore({
      studios: {
        studio1: { name: "Modern Studio", price_aed_per_hour: 399 },
      },
      booking_addons: {
        addon1: { name: "Teleprompter", price_aed: 250 },
      },
    });

    const result = await resolveCanonicalBookingPricing(
      db,
      bookingInput({ studio_id: "studio1", booking_duration_hours: 2, addon_ids: ["addon1"] })
    );

    expect(result).toMatchObject({
      booking_type: "studio",
      studio_name: "Modern Studio",
      studio_total_aed: 798,
      addons_total_aed: 250,
      total_amount_aed: 1048,
      expected_payment_amount_minor: 104800,
    });
  });

  it("rejects an add-on that is not in the server catalog", async () => {
    const db = fakeFirestore({
      booking_packages: { package1: { name: "Package", price_aed: 1000 } },
      booking_addons: {},
    });

    await expect(
      resolveCanonicalBookingPricing(db, bookingInput({ package_id: "package1", addon_ids: ["fake-addon"] }))
    ).rejects.toThrow("add-ons are unavailable");
  });

  it("uses the server workshop price", async () => {
    const db = fakeFirestore({
      workshops: {
        workshop1: { title: "Podcast Masterclass", price_aed: 499, workshop_date: "2026-10-01" },
      },
    });

    await expect(resolveCanonicalWorkshopPricing(db, "workshop1")).resolves.toEqual({
      workshop_title: "Podcast Masterclass",
      workshop_date: "2026-10-01",
      amount_aed: 499,
      expected_payment_amount_minor: 49900,
      expected_payment_currency: "AED",
    });
  });

  it("accepts only an exact provider amount and currency match", () => {
    const record = { expected_payment_amount_minor: 49900, expected_payment_currency: "AED" };
    expect(checkExpectedPayment(record, 49900, "aed")).toEqual({ ok: true });
    expect(checkExpectedPayment(record, 100, "AED")).toEqual({ ok: false, reason: "amount_mismatch" });
    expect(checkExpectedPayment(record, 49900, "USD")).toEqual({ ok: false, reason: "currency_mismatch" });
    expect(checkExpectedPayment({}, 49900, "AED")).toEqual({ ok: false, reason: "missing_expectation" });
  });

  it("rounds AED values to provider minor units", () => {
    expect(aedToMinorUnits(2924.1)).toBe(292410);
    expect(() => aedToMinorUnits(0)).toThrow("Invalid checkout amount");
  });
});
