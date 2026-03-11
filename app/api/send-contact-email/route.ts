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

  const html = `
    <h2>New contact form message</h2>
    <p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
    <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
    <hr />
    <pre style="white-space: pre-wrap; font-family: sans-serif;">${escapeHtml(message)}</pre>
  `;

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [TO_EMAIL],
    replyTo: email,
    subject: `[ICUBE Contact] ${subject} – ${name}`,
    html,
  });

  if (error) {
    console.error("[send-contact-email] Resend error:", error.message, { to: TO_EMAIL });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.info("[send-contact-email] Sent to", TO_EMAIL, "id:", data?.id);
  return NextResponse.json({ success: true, id: data?.id });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
