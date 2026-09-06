import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore, isFirebaseAdminConfigError } from "@/firebase-admin";
import { verifyAdminApiRequest } from "@/lib/adminApiAuth";
import { rentalEquipmentSchema } from "@/schemas/rentalEquipment";

export async function GET(request: Request) {
  try {
    const includeHidden = new URL(request.url).searchParams.get("include_hidden") === "1";
    if (includeHidden) {
      const auth = await verifyAdminApiRequest(request);
      if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const snapshot = await getAdminFirestore().collection("rental_equipment").orderBy("sort_order", "asc").limit(500).get();
    const items = snapshot.docs
      .filter((doc) => includeHidden || doc.data().is_published === true)
      .map((doc) => ({ id: doc.id, ...doc.data() }));
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
