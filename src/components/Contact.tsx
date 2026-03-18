"use client";

import { useState, type FormEvent } from "react";
import { Mail, Phone, MapPin, Instagram, Youtube, Linkedin, Facebook } from "lucide-react";
import { motion } from "motion/react";
import { useSiteData } from "../SiteDataContext";
import { useToast } from "../ToastContext";
import { submitContact, sendContactEmailNotification } from "../api";
import { CONTACT_EMAIL, CONTACT_SUBJECT_OPTIONS } from "../constants/contact";
import AnimatedStaggerItem from "./AnimatedStaggerItem";
import { AnimatedSectionHeader } from "./ScrollReveal";

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function Contact() {
  const { settings } = useSiteData();
  const { showToast } = useToast();
  const [form, setForm] = useState<{ name: string; email: string; subject: string; message: string }>({
    name: "",
    email: "",
    subject: CONTACT_SUBJECT_OPTIONS[0],
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; message?: string }>({});

  const address = settings.contact_address || "Dubai Media City, Building 1\nDubai, United Arab Emirates";
  const email = settings.contact_email || CONTACT_EMAIL;
  const emailBookings = settings.contact_email_bookings || "bookings@icube.ae";
  const phone = settings.contact_phone || "+971 4 123 4567";
  const phone2 = settings.contact_phone_2 || "";
  const hours = settings.contact_hours || "Sun–Thu, 9am – 6pm GST";
  const instagram = settings.social_instagram || "#";
  const youtube = settings.social_youtube || "#";
  const twitter = settings.social_twitter || "#";
  const tiktok = settings.social_tiktok || "#";
  const linkedin = settings.social_linkedin || "#";
  const facebook = settings.social_facebook || "#";

  function validate(): boolean {
    const err: { name?: string; email?: string; message?: string } = {};
    if (!form.name.trim()) err.name = "Name is required";
    if (!form.email.trim()) err.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) err.email = "Enter a valid email address";
    if (!form.message.trim()) err.message = "Message is required";
    setFieldErrors(err);
    return Object.keys(err).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSending(true);
    setFieldErrors({});
    const data = { name: form.name, email: form.email, subject: form.subject, message: form.message };
    try {
      await submitContact(data);
      try {
        await sendContactEmailNotification(data);
      } catch {
        // Message already saved to Firestore; email is best-effort
      }
      setSubmitted(true);
      setForm({ name: "", email: "", subject: CONTACT_SUBJECT_OPTIONS[0], message: "" });
      showToast("Message sent. We'll get back to you soon.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to send. Try again.", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <section
      id="contact"
      className="py-28 md:py-32 bg-gradient-to-b from-icube-dark via-icube-gray/70 to-icube-dark/90 relative overflow-hidden"
    >
      <div className="absolute -bottom-40 right-0 w-80 h-80 bg-icube-gold/5 rounded-full blur-[100px] pointer-events-none hidden md:block" aria-hidden />
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Intro block above form: GET IN TOUCH + Let's connect + paragraph */}
        <AnimatedSectionHeader className="mb-12 md:mb-16" amount={0.25}>
          <div className="section-label-row section-label-row--left">
            <div className="section-label-line" aria-hidden />
            <span className="section-label">Get in touch</span>
            <div className="section-label-line" aria-hidden />
          </div>
          <h2 className="section-title mb-6">Let&apos;s connect</h2>
          <p className="text-gray-400 font-light text-lg max-w-2xl leading-relaxed">
            Ready to elevate your content? Reach out from Dubai or anywhere in the UAE to schedule a tour, discuss a project, or book your next session.
          </p>
        </AnimatedSectionHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left on desktop, down a little bit (pt); form first on mobile */}
          <AnimatedStaggerItem index={1} className="order-2 lg:order-1 lg:pt-16">
            <div>
              <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center shrink-0">
                  <MapPin size={20} className="text-icube-gold" />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-xl mb-1">Studio Location</h4>
                  <p className="text-gray-400 font-light whitespace-pre-line">{address}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center shrink-0">
                  <Mail size={20} className="text-icube-gold" />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-xl mb-1">Email Us</h4>
                  <p className="text-gray-400 font-light">
                    <a href={`mailto:${email}`} className="hover:text-icube-gold transition-colors">
                      {email}
                    </a>
                    {emailBookings ? (
                      <span className="block mt-1 text-gray-500 text-sm">
                        Bookings:{" "}
                        <a href={`mailto:${emailBookings}`} className="text-icube-gold/90 hover:text-icube-gold transition-colors">
                          {emailBookings}
                        </a>
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center shrink-0">
                  <Phone size={20} className="text-icube-gold" />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-xl mb-1">Call Us</h4>
                  <p className="text-gray-400 font-light">
                    <a href={`tel:${phone}`} className="hover:text-icube-gold transition-colors">
                      {phone}
                    </a>
                    {phone2 ? (
                      <>
                        <br />
                        <a href={`tel:${phone2}`} className="hover:text-icube-gold transition-colors">
                          {phone2}
                        </a>
                      </>
                    ) : null}
                    <br />
                    {hours}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-12 border-t border-white/10">
              <h4 className="font-display font-semibold text-lg mb-6 tracking-tight uppercase">Follow Our Work</h4>
              <div className="flex gap-4">
                <a href={instagram} target="_blank" rel="noreferrer" className="flex items-center justify-center text-gray-400 hover:text-[#E4405F] transition-all duration-300" aria-label="Instagram">
                  <Instagram size={20} />
                </a>
                <a href={youtube} target="_blank" rel="noreferrer" className="flex items-center justify-center text-gray-400 hover:text-[#FF0000] transition-all duration-300" aria-label="YouTube">
                  <Youtube size={20} />
                </a>
                <a href={twitter} target="_blank" rel="noreferrer" className="flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300 [&_svg]:size-5" aria-label="X (Twitter)">
                  <XIcon />
                </a>
                <a href={tiktok} target="_blank" rel="noreferrer" className="flex items-center justify-center text-gray-400 hover:text-[#00f2ea] transition-all duration-300 [&_svg]:size-5" aria-label="TikTok">
                  <TikTokIcon />
                </a>
                <a href={linkedin} target="_blank" rel="noreferrer" className="flex items-center justify-center text-gray-400 hover:text-[#0A66C2] transition-all duration-300" aria-label="LinkedIn">
                  <Linkedin size={20} />
                </a>
                <a href={facebook} target="_blank" rel="noreferrer" className="flex items-center justify-center text-gray-400 hover:text-[#1877F2] transition-all duration-300" aria-label="Facebook">
                  <Facebook size={20} />
                </a>
              </div>
            </div>
          </div>
          </AnimatedStaggerItem>

          {/* Form: right on desktop, first on mobile */}
          <AnimatedStaggerItem index={2} className="order-1 lg:order-2">
            <div className="glass-card p-8 md:p-12 rounded-2xl">
              <h3 className="text-3xl font-display font-bold mb-8">Send a Message</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                {submitted && <p className="text-icube-gold text-sm">Message sent. We'll get back to you soon.</p>}
                <div className="space-y-2">
                  <label htmlFor="contact-name" className="text-sm font-semibold text-gray-400 uppercase tracking-wider block">
                    Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setFieldErrors((e2) => ({ ...e2, name: undefined })); }}
                    className={`w-full bg-icube-dark border p-4 rounded-sm focus:outline-none focus:border-icube-gold text-white transition-colors ${fieldErrors.name ? "border-red-400/80" : "border-white/10"}`}
                    aria-invalid={!!fieldErrors.name}
                    aria-describedby={fieldErrors.name ? "contact-name-error" : undefined}
                  />
                  {fieldErrors.name && <p id="contact-name-error" className="text-red-400 text-sm" role="alert">{fieldErrors.name}</p>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="contact-email" className="text-sm font-semibold text-gray-400 uppercase tracking-wider block">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); setFieldErrors((e2) => ({ ...e2, email: undefined })); }}
                    className={`w-full bg-icube-dark border p-4 rounded-sm focus:outline-none focus:border-icube-gold text-white transition-colors ${fieldErrors.email ? "border-red-400/80" : "border-white/10"}`}
                    aria-invalid={!!fieldErrors.email}
                    aria-describedby={fieldErrors.email ? "contact-email-error" : undefined}
                  />
                  {fieldErrors.email && <p id="contact-email-error" className="text-red-400 text-sm" role="alert">{fieldErrors.email}</p>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="contact-subject" className="text-sm font-semibold text-gray-400 uppercase tracking-wider block">
                    Subject
                  </label>
                  <select
                    id="contact-subject"
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    className="w-full bg-icube-dark border border-white/10 p-4 rounded-sm focus:outline-none focus:border-icube-gold text-white transition-colors appearance-none"
                  >
                    {CONTACT_SUBJECT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="contact-message" className="text-sm font-semibold text-gray-400 uppercase tracking-wider block">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    required
                    value={form.message}
                    onChange={(e) => { setForm((f) => ({ ...f, message: e.target.value })); setFieldErrors((e2) => ({ ...e2, message: undefined })); }}
                    className={`w-full bg-icube-dark border p-4 rounded-sm focus:outline-none focus:border-icube-gold text-white transition-colors resize-none ${fieldErrors.message ? "border-red-400/80" : "border-white/10"}`}
                    aria-invalid={!!fieldErrors.message}
                    aria-describedby={fieldErrors.message ? "contact-message-error" : undefined}
                  />
                  {fieldErrors.message && <p id="contact-message-error" className="text-red-400 text-sm" role="alert">{fieldErrors.message}</p>}
                </div>
                <motion.button
                  type="submit"
                  disabled={sending}
                  className="w-full min-h-[44px] py-4 bg-icube-gold text-icube-dark font-semibold uppercase tracking-wider rounded-lg hover:bg-icube-gold-light transition-colors disabled:opacity-50 focus:outline-none"
                  whileHover={sending ? undefined : { scale: 1.02 }}
                  whileTap={sending ? undefined : { scale: 0.98 }}
                  transition={{ type: "tween", duration: 0.2 }}
                >
                  {sending ? "Sending…" : "Send Message"}
                </motion.button>
              </form>
            </div>
          </AnimatedStaggerItem>
        </div>
      </div>
    </section>
  );
}
