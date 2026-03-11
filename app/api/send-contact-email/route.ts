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

  // 2) Confirmation email to the customer so they know the message was received
  const customerName = name.trim() || "there";
  const customerHtml = `
    <div style="font-family: sans-serif; max-width: 560px;">
      <p>Dear ${escapeHtml(customerName)},</p>
      <p>Thank you for getting in touch. We have received your message and will get back to you as soon as possible.</p>
      <p>If your matter is urgent, you can reach us at <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>
      <p>Best regards,<br/><strong>ICUBE Media Studio</strong></p>
    </div>
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
