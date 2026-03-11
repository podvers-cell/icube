import { NextResponse } from "next/server";
import { Resend } from "resend";
import { bookingPayloadSchema } from "@/schemas/booking";

const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatTimeSlot(value: string): string {
  const [hStr] = value.split(":");
  const h = parseInt(hStr, 10);
  if (h < 12) return `${h}:00 AM`;
  if (h === 12) return "12:00 PM";
  return `${h - 12}:00 PM`;
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[send-booking-confirmation] RESEND_API_KEY is not set");
    return NextResponse.json(
      { error: "Email not configured (RESEND_API_KEY missing)" },
      { status: 503 }
    );
  }
  const resend = new Resend(apiKey);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bookingPayloadSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid booking data";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const b = parsed.data;
  const firstName = b.first_name.trim();
  const customerName = [firstName, b.last_name?.trim()].filter(Boolean).join(" ") || "Guest";
  const toEmail = b.email.trim();

  const lines: string[] = [];
  if (b.studio_name) {
    lines.push(`<strong>Studio:</strong> ${escapeHtml(b.studio_name)}`);
    if (b.booking_date) lines.push(`<strong>Date:</strong> ${escapeHtml(b.booking_date)}`);
    if (b.time_slot) lines.push(`<strong>Time:</strong> ${formatTimeSlot(b.time_slot)}`);
    if (b.booking_duration_hours != null) lines.push(`<strong>Duration:</strong> ${b.booking_duration_hours} hour(s)`);
    if (b.studio_total_aed != null) lines.push(`<strong>Studio total:</strong> ${b.studio_total_aed} AED`);
  }
  if (b.package_id) lines.push(`<strong>Package ID:</strong> ${escapeHtml(b.package_id)}`);
  if (b.booking_date && !b.studio_name) lines.push(`<strong>Date:</strong> ${escapeHtml(b.booking_date)}`);
  if (b.time_slot && !b.studio_name) lines.push(`<strong>Time:</strong> ${formatTimeSlot(b.time_slot)}`);
  if (b.addons_total_aed != null && b.addons_total_aed > 0) lines.push(`<strong>Add-ons total:</strong> ${b.addons_total_aed} AED`);
  if (b.project_details) lines.push(`<strong>Project details:</strong><br/><pre style="white-space: pre-wrap; font-family: sans-serif;">${escapeHtml(b.project_details)}</pre>`);

  const summaryHtml = lines.length > 0 ? `<p>${lines.join("<br/>")}</p>` : "";

  const html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #1a1a2e;">Thank you for your booking</h2>
      <p>Dear ${escapeHtml(customerName)},</p>
      <p>We have received your booking request at ICUBE Media Studio.</p>
      ${summaryHtml}
      <p>We will confirm availability and get back to you shortly. If you have any questions, reply to this email or contact us at <a href="mailto:info@icubeproduction.com">info@icubeproduction.com</a>.</p>
      <p>Best regards,<br/><strong>ICUBE Media Studio</strong></p>
    </div>
  `;

  const summaryTextLines: string[] = [];
  if (b.studio_name) {
    summaryTextLines.push(`Studio: ${b.studio_name}`);
    if (b.booking_date) summaryTextLines.push(`Date: ${b.booking_date}`);
    if (b.time_slot) summaryTextLines.push(`Time: ${formatTimeSlot(b.time_slot)}`);
    if (b.booking_duration_hours != null) summaryTextLines.push(`Duration: ${b.booking_duration_hours} hour(s)`);
    if (b.studio_total_aed != null) summaryTextLines.push(`Studio total: ${b.studio_total_aed} AED`);
  }
  if (b.package_id) summaryTextLines.push(`Package ID: ${b.package_id}`);
  if (b.booking_date && !b.studio_name) summaryTextLines.push(`Date: ${b.booking_date}`);
  if (b.time_slot && !b.studio_name) summaryTextLines.push(`Time: ${formatTimeSlot(b.time_slot)}`);
  if (b.addons_total_aed != null && b.addons_total_aed > 0) summaryTextLines.push(`Add-ons total: ${b.addons_total_aed} AED`);
  if (b.project_details) summaryTextLines.push(`Project details: ${b.project_details}`);
  const summaryText = summaryTextLines.length > 0 ? summaryTextLines.join("\n") + "\n\n" : "";

  const text = `Thank you for your booking\n\nDear ${customerName},\n\nWe have received your booking request at ICUBE Media Studio.\n\n${summaryText}We will confirm availability and get back to you shortly. If you have any questions, contact us at info@icubeproduction.com.\n\nBest regards,\nICUBE Media Studio`;

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [toEmail],
    subject: `Booking confirmation – ICUBE Media Studio`,
    html,
    text,
  });

  if (error) {
    console.error("[send-booking-confirmation] Resend error:", error.message, { to: toEmail });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.info("[send-booking-confirmation] Sent to", toEmail, "id:", data?.id);
  return NextResponse.json({ success: true, id: data?.id });
}
