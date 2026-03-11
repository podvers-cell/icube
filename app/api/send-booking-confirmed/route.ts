import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { CONTACT_EMAIL } from "@/constants/contact";

const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev";

const bookingConfirmedSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().min(1, "Email required").email(),
  phone: z.string().optional(),
  studio_name: z.string().optional(),
  package_id: z.string().optional(),
  package_name: z.string().optional(),
  booking_date: z.string().optional(),
  time_slot: z.string().optional(),
  booking_duration_hours: z.number().optional(),
  studio_total_aed: z.number().optional(),
  addons_total_aed: z.number().optional(),
  project_details: z.string().optional(),
});

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
    return NextResponse.json({ error: "Email not configured" }, { status: 503 });
  }
  const resend = new Resend(apiKey);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bookingConfirmedSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid data";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const b = parsed.data;
  const customerName = [b.first_name, b.last_name].filter(Boolean).join(" ").trim() || "Guest";
  const toEmail = b.email.trim();

  const detailRows: { label: string; value: string }[] = [];
  if (b.studio_name) detailRows.push({ label: "Studio", value: b.studio_name });
  if (b.package_name) detailRows.push({ label: "Package", value: b.package_name });
  if (b.package_id && !b.package_name) detailRows.push({ label: "Package", value: b.package_id });
  if (b.booking_date) detailRows.push({ label: "Date", value: b.booking_date });
  if (b.time_slot) detailRows.push({ label: "Time", value: formatTimeSlot(b.time_slot) });
  if (b.booking_duration_hours != null) detailRows.push({ label: "Duration", value: `${b.booking_duration_hours} hour(s)` });
  if (b.studio_total_aed != null) detailRows.push({ label: "Studio total", value: `${b.studio_total_aed} AED` });
  if (b.addons_total_aed != null && b.addons_total_aed > 0) detailRows.push({ label: "Add-ons total", value: `${b.addons_total_aed} AED` });
  if (b.project_details) detailRows.push({ label: "Project details", value: b.project_details });

  const detailsTableRows = detailRows
    .map((row) => {
      const valueHtml = escapeHtml(row.value).replace(/\n/g, "<br/>");
      const isLong = row.label === "Project details";
      return `<tr><td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; vertical-align: top;">${escapeHtml(row.label)}</td><td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; font-weight: ${isLong ? "400" : "600"}; color: #1a1a2e; text-align: right; ${isLong ? "white-space: pre-wrap; text-align: left;" : ""}">${valueHtml}</td></tr>`;
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
              <td style="height: 4px; background: linear-gradient(90deg, #059669 0%, #10b981 100%);"></td>
            </tr>
            <tr>
              <td style="padding: 32px 40px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="padding-bottom: 8px;"><span style="font-size: 12px; font-weight: 600; letter-spacing: 0.12em; color: #059669; text-transform: uppercase;">ICUBE Media Studio</span></td></tr>
                  <tr><td style="padding-bottom: 24px;"><h1 style="margin:0; font-size: 22px; font-weight: 700; color: #1a1a2e; letter-spacing: -0.02em;">Your booking is confirmed</h1></td></tr>
                  <tr><td style="padding-bottom: 20px; font-size: 15px; line-height: 1.6; color: #374151;">Dear ${escapeHtml(customerName)},</td></tr>
                  <tr><td style="padding-bottom: 20px; font-size: 15px; line-height: 1.6; color: #374151;">Great news — we have confirmed your booking. See the details below.</td></tr>
                  ${detailsTableRows ? `<tr><td style="padding-bottom: 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;"><tbody>${detailsTableRows}</tbody></table></td></tr>` : ""}
                  <tr><td style="padding-bottom: 28px; font-size: 15px; line-height: 1.6; color: #374151;">If you need to change or cancel, reply to this email or contact us:</td></tr>
                  <tr><td style="padding-bottom: 28px;">
                    <a href="mailto:${CONTACT_EMAIL}" style="display: inline-block; padding: 12px 24px; background-color: #1a1a2e; color: #ffffff !important; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px;">${CONTACT_EMAIL}</a>
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

  const summaryText = detailRows.map((r) => `${r.label}: ${r.value}`).join("\n");
  const text = `Your booking is confirmed\n\nDear ${customerName},\n\nGreat news — we have confirmed your booking.\n\n${summaryText}\n\nIf you need to change or cancel, contact us at ${CONTACT_EMAIL}.\n\nBest regards,\nICUBE Media Studio`;

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [toEmail],
    subject: "Your booking is confirmed – ICUBE Media Studio",
    html,
    text,
  });

  if (error) {
    console.error("[send-booking-confirmed] Resend error:", error.message, { to: toEmail });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.info("[send-booking-confirmed] Sent to", toEmail, "id:", data?.id);
  return NextResponse.json({ success: true, id: data?.id });
}
