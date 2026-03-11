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

  const detailRows: { label: string; value: string }[] = [];
  if (b.studio_name) detailRows.push({ label: "Studio", value: b.studio_name });
  if (b.booking_date) detailRows.push({ label: "Date", value: b.booking_date });
  if (b.time_slot) detailRows.push({ label: "Time", value: formatTimeSlot(b.time_slot) });
  if (b.booking_duration_hours != null) detailRows.push({ label: "Duration", value: `${b.booking_duration_hours} hour(s)` });
  if (b.studio_total_aed != null) detailRows.push({ label: "Studio total", value: `${b.studio_total_aed} AED` });
  if (b.package_id) detailRows.push({ label: "Package", value: b.package_id });
  if (b.booking_date && !b.studio_name) detailRows.push({ label: "Date", value: b.booking_date });
  if (b.time_slot && !b.studio_name) detailRows.push({ label: "Time", value: formatTimeSlot(b.time_slot) });
  if (b.addons_total_aed != null && b.addons_total_aed > 0) detailRows.push({ label: "Add-ons total", value: `${b.addons_total_aed} AED` });
  if (b.project_details) detailRows.push({ label: "Project details", value: b.project_details });

  const detailsTableRows = detailRows
    .map((row) => {
      const valueHtml = escapeHtml(row.value).replace(/\n/g, "<br/>");
      const isLong = row.label === "Project details";
      return `
    <tr><td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; vertical-align: top;">${escapeHtml(row.label)}</td><td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; font-weight: ${isLong ? "400" : "600"}; color: #1a1a2e; text-align: right; ${isLong ? "white-space: pre-wrap; text-align: left;" : ""}">${valueHtml}</td></tr>`;
    })
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0; padding:0; background-color:#f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
        <tr><td style="padding: 32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto; background-color:#ffffff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden;">
            <tr>
              <td style="height: 4px; background: linear-gradient(90deg, #c9a227 0%, #d4af37 100%);"></td>
            </tr>
            <tr>
              <td style="padding: 32px 40px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="padding-bottom: 8px;"><span style="font-size: 12px; font-weight: 600; letter-spacing: 0.12em; color: #c9a227; text-transform: uppercase;">ICUBE Media Studio</span></td></tr>
                  <tr><td style="padding-bottom: 24px;"><h1 style="margin:0; font-size: 22px; font-weight: 700; color: #1a1a2e; letter-spacing: -0.02em;">Thank you for your booking</h1></td></tr>
                  <tr><td style="padding-bottom: 20px; font-size: 15px; line-height: 1.6; color: #374151;">Dear ${escapeHtml(customerName)},</td></tr>
                  <tr><td style="padding-bottom: 20px; font-size: 15px; line-height: 1.6; color: #374151;">We have received your booking request at ICUBE Media Studio.</td></tr>
                  ${detailsTableRows ? `<tr><td style="padding-bottom: 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;"><tbody>${detailsTableRows}</tbody></table></td></tr>` : ""}
                  <tr><td style="padding-bottom: 20px; font-size: 15px; line-height: 1.6; color: #374151;">We will confirm availability and get back to you shortly.</td></tr>
                  <tr><td style="padding-bottom: 28px; font-size: 15px; line-height: 1.6; color: #374151;">If you have any questions, reply to this email or contact us:</td></tr>
                  <tr><td style="padding-bottom: 28px;">
                    <a href="mailto:info@icubeproduction.com" style="display: inline-block; padding: 12px 24px; background-color: #1a1a2e; color: #ffffff !important; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px;">info@icubeproduction.com</a>
                  </td></tr>
                  <tr><td style="padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">Best regards,<br/><strong style="color: #1a1a2e;">ICUBE Media Studio</strong></td></tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 16px 40px; background-color: #f9fafb; font-size: 12px; color: #9ca3af;">Dubai, UAE · info@icubeproduction.com</td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
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
