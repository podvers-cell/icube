import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore, isFirebaseAdminConfigError } from "@/firebase-admin";
import { verifyAdminApiRequest } from "@/lib/adminApiAuth";
import { rentalEquipmentSchema } from "@/schemas/rentalEquipment";

type RouteContext = { params: Promise<{ id: string }> };

function validId(id: string): boolean {
  return /^[A-Za-z0-9_-]{1,150}$/.test(id);
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await verifyAdminApiRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { id } = await context.params;
    if (!validId(id)) return NextResponse.json({ error: "Invalid equipment ID." }, { status: 400 });
    const parsed = rentalEquipmentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid equipment data." }, { status: 400 });
    }
    await getAdminFirestore().collection("rental_equipment").doc(id).set(
      { ...parsed.data, updated_at: FieldValue.serverTimestamp() },
      { merge: true }
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    if (isFirebaseAdminConfigError(err)) {
      return NextResponse.json({ error: "Rental equipment is unavailable." }, { status: 503 });
    }
    console.error("[rental-equipment/update]", err);
    return NextResponse.json({ error: "Failed to update rental equipment." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await verifyAdminApiRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { id } = await context.params;
    if (!validId(id)) return NextResponse.json({ error: "Invalid equipment ID." }, { status: 400 });
    await getAdminFirestore().collection("rental_equipment").doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (err) {
    if (isFirebaseAdminConfigError(err)) {
      return NextResponse.json({ error: "Rental equipment is unavailable." }, { status: 503 });
    }
    console.error("[rental-equipment/delete]", err);
    return NextResponse.json({ error: "Failed to delete rental equipment." }, { status: 500 });
  }
}
