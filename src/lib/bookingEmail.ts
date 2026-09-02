import { Resend } from "resend";
import { CONTACT_EMAIL } from "@/constants/contact";

const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev";
const INFO_EMAIL = process.env.CONTACT_TO_EMAIL || CONTACT_EMAIL;

export type PaidBookingEmailPayload = {
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  studio_name?: string;
  package_id?: string;
  package_name?: string;
  booking_date?: string;
  time_slot?: string;
  booking_duration_hours?: number;
  studio_total_aed?: number;
  addons_total_aed?: number;
  total_amount_aed?: number;
  project_details?: string;
};

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

export async function sendPaidBookingConfirmedEmail(
  booking: PaidBookingEmailPayload
): Promise<{ ok: true; id?: string } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY is missing" };
  }

  const resend = new Resend(apiKey);
  const customerName = [booking.first_name, booking.last_name].filter(Boolean).join(" ").trim() || "Guest";
  const toEmail = booking.email.trim();

  const detailRows: { label: string; value: string }[] = [];
  if (booking.studio_name) detailRows.push({ label: "Studio", value: booking.studio_name });
  if (booking.package_name) detailRows.push({ label: "Package", value: booking.package_name });
  if (booking.package_id && !booking.package_name) detailRows.push({ label: "Package", value: booking.package_id });
  if (booking.booking_date) detailRows.push({ label: "Date", value: booking.booking_date });
  if (booking.time_slot) detailRows.push({ label: "Time", value: formatTimeSlot(booking.time_slot) });
  if (booking.booking_duration_hours != null) {
    detailRows.push({ label: "Duration", value: `${booking.booking_duration_hours} hour(s)` });
  }
  if (booking.studio_total_aed != null) detailRows.push({ label: "Studio total", value: `${booking.studio_total_aed} AED` });
  if (booking.addons_total_aed != null && booking.addons_total_aed > 0) {
    detailRows.push({ label: "Add-ons total", value: `${booking.addons_total_aed} AED` });
  }
  if (booking.total_amount_aed != null) detailRows.push({ label: "Total paid", value: `${booking.total_amount_aed} AED` });
  if (booking.project_details) detailRows.push({ label: "Project details", value: booking.project_details });

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
                  <tr><td style="padding-bottom: 20px; font-size: 15px; line-height: 1.6; color: #374151;">Thank you — your payment was received and your booking is confirmed. See the details below.</td></tr>
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
  const text = `Your booking is confirmed\n\nDear ${customerName},\n\nThank you — your payment was received and your booking is confirmed.\n\n${summaryText}\n\nIf you need to change or cancel, contact us at ${CONTACT_EMAIL}.\n\nBest regards,\nICUBE Media Studio`;

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [toEmail],
    subject: "Your booking is confirmed – ICUBE Media Studio",
    html,
    text,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const ownerDetailRows = detailRows
    .map(
      (r) =>
        `<tr><td style="padding: 6px 0; font-size: 14px; color: #6b7280;">${escapeHtml(r.label)}</td><td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #1a1a2e;">${escapeHtml(r.value).replace(/\n/g, "<br/>")}</td></tr>`
    )
    .join("");
  const ownerHtml = `
    <h2 style="margin: 0 0 16px; font-size: 18px; color: #1a1a2e;">New paid booking</h2>
    <p style="margin: 0 0 12px; font-size: 14px; color: #374151;"><strong>From:</strong> ${escapeHtml(customerName)} &lt;${escapeHtml(toEmail)}&gt;</p>
    ${booking.phone ? `<p style="margin: 0 0 12px; font-size: 14px; color: #374151;"><strong>Phone:</strong> ${escapeHtml(booking.phone)}</p>` : ""}
    <table style="margin-top: 16px; border-collapse: collapse; width: 100%; max-width: 480px;"><tbody>${ownerDetailRows}</tbody></table>
  `;
  const ownerText = `New paid booking\nFrom: ${customerName} <${toEmail}>${booking.phone ? `\nPhone: ${booking.phone}` : ""}\n\n${detailRows.map((r) => `${r.label}: ${r.value}`).join("\n")}`;

  const { error: ownerError } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [INFO_EMAIL],
    replyTo: toEmail,
    subject: `[ICUBE Paid Booking] ${booking.studio_name || booking.package_name || booking.package_id || "Booking"} – ${customerName}`,
    html: ownerHtml,
    text: ownerText,
  });

  if (ownerError) {
    console.error("[bookingEmail] Owner notification failed:", ownerError.message);
  }

  return { ok: true, id: data?.id };
}
