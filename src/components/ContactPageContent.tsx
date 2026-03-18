"use client";

import { useState, type FormEvent } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Instagram,
  Youtube,
  Linkedin,
  Facebook,
  Send,
  MessageSquare,
} from "lucide-react";
import { useSiteData } from "../SiteDataContext";
import { submitContact, sendContactEmailNotification } from "../api";
import { CONTACT_EMAIL } from "../constants/contact";

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

export default function ContactPageContent() {
  const { settings } = useSiteData();
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "Studio Booking",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const address =
    settings.contact_address ||
    "Dubai Media City, Building 1\nDubai, United Arab Emirates";
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    const data = {
      name: form.name,
      email: form.email,
      subject: form.subject,
      message: form.message,
    };
    try {
      await submitContact(data);
      try {
        await sendContactEmailNotification(data);
      } catch {
        // Message already saved; email is best-effort
      }
      setSubmitted(true);
      setForm({ name: "", email: "", subject: "Studio Booking", message: "" });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send. Try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      {/* Ambient orbs – desktop only; large blur is expensive on mobile */}
      <div className="pointer-events-none absolute top-0 right-0 w-[500px] h-[500px] bg-icube-gold/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 hidden md:block" aria-hidden />
      <div className="pointer-events-none absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-icube-gold/5 rounded-full blur-[100px] -translate-x-1/2 hidden md:block" aria-hidden />

      <div className="relative max-w-6xl mx-auto px-5 sm:px-6 md:px-12 py-16 md:py-24 lg:py-28">
        {/* Hero header – same style as expert section (label + lines, title, accent, description) */}
        <header className="section-header mb-20 md:mb-28">
          <div className="section-label-row">
            <div className="section-label-line" aria-hidden />
            <span className="section-label">Contact</span>
            <div className="section-label-line" aria-hidden />
          </div>
          <h1 className="section-title">
            We&apos;d love to hear from you
          </h1>
          <div className="section-header-accent" aria-hidden />
          <p className="text-gray-400 font-light text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mt-4">
            Studio location, contact details, and a form to send your message. We’re here to help.
          </p>
        </header>

        {/* Contact info cards + form: two columns on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Left: Contact & visit cards */}
          <div className="lg:col-span-5 space-y-8">
            <h2 className="text-lg font-display font-bold text-white tracking-tight">
              Contact & visit
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5">
              {[
                {
                  icon: MapPin,
                  title: "Address",
                  content: address,
                  lines: true,
                },
                {
                  icon: Phone,
                  title: "Phone",
                  content: (
                    <>
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
                    </>
                  ),
                  sub: hours,
                },
                {
                  icon: Mail,
                  title: "Email",
                  content: (
                    <>
                      <a href={`mailto:${email}`} className="hover:text-icube-gold transition-colors">
                        {email}
                      </a>
                    </>
                  ),
                },
                {
                  icon: Clock,
                  title: "Hours",
                  content: hours,
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="glass-card group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-6 transition-all duration-300 hover:border-icube-gold/30 hover:bg-white/[0.08] hover:shadow-[0_12px_40px_rgba(0,0,0,0.2),0_0_0_1px_rgba(212,175,55,0.08)]"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center shrink-0">
                      <item.icon size={22} className="text-icube-gold" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display font-semibold text-white mb-1.5">{item.title}</h3>
                      {typeof item.content === "string" ? (
                        <p
                          className={`text-gray-400 font-light text-sm leading-relaxed ${item.lines ? "whitespace-pre-line" : ""}`}
                        >
                          {item.content}
                        </p>
                      ) : (
                        <div className="text-gray-400 font-light text-sm leading-relaxed">
                          {item.content}
                        </div>
                      )}
                      {item.sub && (
                        <p className="text-gray-500 text-xs mt-2">{item.sub}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Social */}
            <div className="pt-4">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-4">
                Follow us
              </p>
              <div className="flex gap-3">
                {[
                  { href: instagram, icon: Instagram, label: "Instagram", hoverClass: "hover:text-[#E4405F]" },
                  { href: youtube, icon: Youtube, label: "YouTube", hoverClass: "hover:text-[#FF0000]" },
                  { href: twitter, icon: XIcon, label: "X (Twitter)", hoverClass: "hover:text-white" },
                  { href: tiktok, icon: TikTokIcon, label: "TikTok", hoverClass: "hover:text-[#00f2ea]" },
                  { href: linkedin, icon: Linkedin, label: "LinkedIn", hoverClass: "hover:text-[#0A66C2]" },
                  { href: facebook, icon: Facebook, label: "Facebook", hoverClass: "hover:text-[#1877F2]" },
                ].map(({ href, icon: Icon, label, hoverClass }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center justify-center text-gray-400 ${hoverClass} transition-all duration-300 hover:scale-105 [&_svg]:size-5`}
                    aria-label={label}
                  >
                    <Icon size={20} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Send message form */}
          <div className="lg:col-span-7">
            <div className="glass-card rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-8 md:p-10 lg:p-12 shadow-[0_24px_64px_rgba(0,0,0,0.2)]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-icube-gold/10 border border-icube-gold/30 flex items-center justify-center">
                  <MessageSquare size={20} className="text-icube-gold" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-white tracking-tight">
                    Send a message
                  </h2>
                  <p className="text-gray-500 text-sm font-light">
                    We’ll get back to you as soon as we can.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {submitted && (
                  <div className="rounded-xl bg-icube-gold/10 border border-icube-gold/30 px-4 py-3 text-icube-gold text-sm font-medium">
                    Message sent. We’ll get back to you soon.
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full bg-icube-dark/80 border border-white/10 p-4 rounded-xl focus:outline-none focus:border-icube-gold focus:ring-1 focus:ring-icube-gold/30 text-white transition-all duration-200 placeholder:text-gray-500"
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full bg-icube-dark/80 border border-white/10 p-4 rounded-xl focus:outline-none focus:border-icube-gold focus:ring-1 focus:ring-icube-gold/30 text-white transition-all duration-200 placeholder:text-gray-500"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Subject
                  </label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    className="w-full bg-icube-dark/80 border border-white/10 p-4 rounded-xl focus:outline-none focus:border-icube-gold focus:ring-1 focus:ring-icube-gold/30 text-white transition-all duration-200 appearance-none cursor-pointer"
                  >
                    <option value="Studio Booking">Studio Booking</option>
                    <option value="Video Production">Video Production</option>
                    <option value="General Inquiry">General Inquiry</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Message
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    className="w-full bg-icube-dark/80 border border-white/10 p-4 rounded-xl focus:outline-none focus:border-icube-gold focus:ring-1 focus:ring-icube-gold/30 text-white transition-all duration-200 resize-none placeholder:text-gray-500"
                    placeholder="Tell us about your project or inquiry..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto min-w-[200px] px-8 py-4 bg-icube-gold text-icube-dark font-semibold uppercase tracking-wider rounded-xl hover:bg-icube-gold-light transition-all duration-300 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-icube-gold focus:ring-offset-2 focus:ring-offset-icube-dark shadow-[0_4px_20px_rgba(212,175,55,0.25)]"
                >
                  <Send size={18} className="shrink-0" />
                  {sending ? "Sending…" : "Send message"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
