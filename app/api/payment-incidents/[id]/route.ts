import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getAdminFirestore, isFirebaseAdminConfigError } from "@/firebase-admin";
import { verifyAdminApiRequest } from "@/lib/adminApiAuth";

type RouteContext = { params: Promise<{ id: string }> };

const resolveSchema = z.object({
  status: z.enum(["open", "resolved"]),
  resolution_note: z.string().trim().max(1000).optional().default(""),
});

function validId(id: string): boolean {
  return /^[A-Za-z0-9_-]{1,200}$/.test(id);
}

/** Mark an incident handled (refunded, rebooked, waived) so it leaves the open queue. */
export async function PATCH(request: Request, context: RouteContext) {
  const auth = await verifyAdminApiRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { id } = await context.params;
    if (!validId(id)) return NextResponse.json({ error: "Invalid incident ID." }, { status: 400 });

    const parsed = resolveSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data." }, { status: 400 });
    }

    const ref = getAdminFirestore().collection("payment_incidents").doc(id);
    if (!(await ref.get()).exists) {
      return NextResponse.json({ error: "Incident was not found." }, { status: 404 });
    }

    const resolving = parsed.data.status === "resolved";
    await ref.update({
      status: parsed.data.status,
      resolution_note: parsed.data.resolution_note || null,
      resolved_at: resolving ? FieldValue.serverTimestamp() : FieldValue.delete(),
      resolved_by: resolving ? auth.uid : FieldValue.delete(),
      updated_at: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (isFirebaseAdminConfigError(err)) {
      return NextResponse.json({ error: "Payment incidents are unavailable." }, { status: 503 });
    }
    console.error("[payment-incidents/update]", err);
    return NextResponse.json({ error: "Failed to update the incident." }, { status: 500 });
  }
}
