import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore, isFirebaseAdminConfigError } from "@/firebase-admin";
import { verifyAdminApiRequest } from "@/lib/adminApiAuth";
import { rentalEquipmentSchema } from "@/schemas/rentalEquipment";

/**
 * Explicit shape for the unauthenticated response. Spreading the stored document would publish
 * whatever fields it happens to carry, so any internal field added later (cost, supplier, notes)
 * would leak the day it is introduced, silently.
 */
function toPublicEquipment(id: string, data: FirebaseFirestore.DocumentData) {
  return {
    id,
    name: data.name ?? "",
    category: data.category ?? "",
    short_description: data.short_description ?? "",
    details: data.details ?? "",
    image_url: data.image_url ?? "",
    price_aed: data.price_aed ?? 0,
    price_unit: data.price_unit ?? "day",
    quantity_available: data.quantity_available ?? 0,
    availability_status: data.availability_status ?? "on_request",
    is_featured: data.is_featured === true,
    is_published: data.is_published === true,
    sort_order: data.sort_order ?? 0,
  };
}

export async function GET(request: Request) {
  try {
    const includeHidden = new URL(request.url).searchParams.get("include_hidden") === "1";
    if (includeHidden) {
      const auth = await verifyAdminApiRequest(request);
      if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Filter in the query, not after it: limit() is applied by Firestore first, so filtering
    // afterwards let unpublished rows consume the budget and silently truncate the public list.
    //
    // The public branch deliberately does not combine where() with orderBy() — that pairing needs
    // a composite index on (is_published, sort_order), and index deployment is blocked by the same
    // missing service-account permission as the rules. Both branches here are served by Firestore's
    // automatic single-field indexes, and 500 rows sort in memory for free. If the published
    // catalogue ever approaches 500 items, add the composite index and order in the query instead.
    const collection = getAdminFirestore().collection("rental_equipment");
    const snapshot = includeHidden
      ? await collection.orderBy("sort_order", "asc").limit(500).get()
      : await collection.where("is_published", "==", true).limit(500).get();

    const rows = snapshot.docs
      .map((doc) => ({ id: doc.id, data: doc.data() }))
      .sort((a, b) => Number(a.data.sort_order ?? 0) - Number(b.data.sort_order ?? 0));

    const items = rows.map(({ id, data }) => (includeHidden ? { id, ...data } : toPublicEquipment(id, data)));

    return NextResponse.json({ items });
  } catch (err) {
    if (isFirebaseAdminConfigError(err)) {
      return NextResponse.json({ error: "Rental equipment is unavailable." }, { status: 503 });
    }
    console.error("[rental-equipment/get]", err);
    return NextResponse.json({ error: "Failed to load rental equipment." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await verifyAdminApiRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const parsed = rentalEquipmentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid equipment data." }, { status: 400 });
    }
    const ref = await getAdminFirestore().collection("rental_equipment").add({
      ...parsed.data,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ item: { id: ref.id, ...parsed.data } }, { status: 201 });
  } catch (err) {
    if (isFirebaseAdminConfigError(err)) {
      return NextResponse.json({ error: "Rental equipment is unavailable." }, { status: 503 });
    }
    console.error("[rental-equipment/create]", err);
    return NextResponse.json({ error: "Failed to create rental equipment." }, { status: 500 });
  }
}
