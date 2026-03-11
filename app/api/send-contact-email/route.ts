import { NextResponse } from "next/server";
import { Resend } from "resend";
import { contactFormSchema } from "@/schemas/contact";
import { CONTACT_EMAIL } from "@/constants/contact";

const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev";
const TO_EMAIL = process.env.CONTACT_TO_EMAIL || CONTACT_EMAIL;

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[send-contact-email] RESEND_API_KEY is not set");
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

  const parsed = contactFormSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid contact data";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { name, email, subject, message } = parsed.data;

  // 1) Email to you (info@icubeproduction.com)
  const ownerHtml = `
    <h2>New contact form message</h2>
    <p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
    <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
    <hr />
    <pre style="white-space: pre-wrap; font-family: sans-serif;">${escapeHtml(message)}</pre>
  `;
  const ownerText = `New contact form message\nFrom: ${name} <${email}>\nSubject: ${subject}\n\n${message}`;

  const { data: ownerData, error: ownerError } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [TO_EMAIL],
    replyTo: email,
    subject: `[ICUBE Contact] ${subject} – ${name}`,
    html: ownerHtml,
    text: ownerText,
  });

  if (ownerError) {
    console.error("[send-contact-email] Resend error (owner):", ownerError.message, { to: TO_EMAIL });
    return NextResponse.json({ error: ownerError.message }, { status: 500 });
  }

  // 2) Confirmation email to the customer – professional layout
  const customerName = name.trim() || "there";
  const customerHtml = `
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
                  <tr><td style="padding-bottom: 24px;"><h1 style="margin:0; font-size: 22px; font-weight: 700; color: #1a1a2e; letter-spacing: -0.02em;">We received your message</h1></td></tr>
                  <tr><td style="padding-bottom: 20px; font-size: 15px; line-height: 1.6; color: #374151;">Dear ${escapeHtml(customerName)},</td></tr>
                  <tr><td style="padding-bottom: 20px; font-size: 15px; line-height: 1.6; color: #374151;">Thank you for getting in touch. We have received your message and will get back to you as soon as possible.</td></tr>
                  <tr><td style="padding-bottom: 24px; font-size: 15px; line-height: 1.6; color: #374151;">If your matter is urgent, you can reach us directly:</td></tr>
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
  const customerText = `Dear ${customerName},\n\nThank you for getting in touch. We have received your message and will get back to you as soon as possible.\n\nIf your matter is urgent, you can reach us at ${CONTACT_EMAIL}.\n\nBest regards,\nICUBE Media Studio`;

  const { error: customerError } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [email],
    subject: "We received your message – ICUBE Media Studio",
    html: customerHtml,
    text: customerText,
  });

  if (customerError) {
    console.error("[send-contact-email] Resend error (customer confirmation):", customerError.message, { to: email });
    // Still return success; owner email was sent
  }

  console.info("[send-contact-email] Sent to", TO_EMAIL, "id:", ownerData?.id);
  return NextResponse.json({ success: true, id: ownerData?.id });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
