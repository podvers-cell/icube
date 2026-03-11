"use client";

import { useState, type FormEvent } from "react";
import { Mail, Phone, MapPin, Instagram, Youtube, Twitter } from "lucide-react";
import { useSiteData } from "../SiteDataContext";
import { submitContact } from "../api";
import WavySectionDivider from "./WavySectionDivider";

export default function Contact() {
  const { settings } = useSiteData();
  const [form, setForm] = useState({ name: "", email: "", subject: "Studio Booking", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const address = settings.contact_address || "Dubai Media City, Building 1\nDubai, United Arab Emirates";
  const email = settings.contact_email || "hello@icube.ae";
  const emailBookings = settings.contact_email_bookings || "bookings@icube.ae";
  const phone = settings.contact_phone || "+971 4 123 4567";
  const hours = settings.contact_hours || "Sun–Thu, 9am – 6pm GST";
  const instagram = settings.social_instagram || "#";
  const youtube = settings.social_youtube || "#";
  const twitter = settings.social_twitter || "#";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await submitContact({ name: form.name, email: form.email, subject: form.subject, message: form.message });
      setSubmitted(true);
      setForm({ name: "", email: "", subject: "Studio Booking", message: "" });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send. Try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section
      id="contact"
      className="py-28 md:py-32 bg-gradient-to-b from-icube-dark via-icube-gray/70 to-icube-dark/90 relative overflow-hidden"
    >
      <WavySectionDivider />
      <div className="absolute -bottom-40 right-0 w-80 h-80 bg-icube-gold/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-[2px] bg-icube-gold" />
              <span className="text-icube-gold font-semibold tracking-[0.18em] uppercase text-xs md:text-sm">
                Get in touch
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold tracking-tight mb-6">
              Let&apos;s connect
            </h2>
            <p className="text-gray-400 font-light text-lg mb-12 leading-relaxed">
              Ready to elevate your content? Reach out from Dubai or anywhere in the UAE to schedule a tour, discuss a project, or book your next session.
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-icube-gray rounded-sm flex items-center justify-center shrink-0 border border-white/5">
                  <MapPin size={20} className="text-icube-gold" />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-xl mb-1">Studio Location</h4>
                  <p className="text-gray-400 font-light whitespace-pre-line">{address}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-icube-gray rounded-sm flex items-center justify-center shrink-0 border border-white/5">
                  <Mail size={20} className="text-icube-gold" />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-xl mb-1">Email Us</h4>
                  <p className="text-gray-400 font-light">
                    {email}
                    <br />
                    {emailBookings}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-icube-gray rounded-sm flex items-center justify-center shrink-0 border border-white/5">
                  <Phone size={20} className="text-icube-gold" />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-xl mb-1">Call Us</h4>
                  <p className="text-gray-400 font-light">
                    {phone}
                    <br />
                    {hours}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-12 border-t border-white/10">
              <h4 className="font-display font-semibold text-lg mb-6 tracking-tight uppercase">Follow Our Work</h4>
              <div className="flex gap-4">
                <a href={instagram} target="_blank" rel="noreferrer" className="w-12 h-12 bg-icube-gray border border-white/5 rounded-sm flex items-center justify-center hover:border-icube-gold hover:text-icube-gold transition-all duration-300">
                  <Instagram size={20} />
                </a>
                <a href={youtube} target="_blank" rel="noreferrer" className="w-12 h-12 bg-icube-gray border border-white/5 rounded-sm flex items-center justify-center hover:border-icube-gold hover:text-icube-gold transition-all duration-300">
                  <Youtube size={20} />
                </a>
                <a href={twitter} target="_blank" rel="noreferrer" className="w-12 h-12 bg-icube-gray border border-white/5 rounded-sm flex items-center justify-center hover:border-icube-gold hover:text-icube-gold transition-all duration-300">
                  <Twitter size={20} />
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-8 md:p-12 rounded-2xl h-full flex flex-col justify-center shadow-[0_12px_40px_rgba(0,0,0,0.25)]">
            <h3 className="text-3xl font-display font-bold mb-8">Send a Message</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              {submitted && <p className="text-icube-gold text-sm">Message sent. We'll get back to you soon.</p>}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-icube-dark border border-white/10 p-4 rounded-sm focus:outline-none focus:border-icube-gold text-white transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full bg-icube-dark border border-white/10 p-4 rounded-sm focus:outline-none focus:border-icube-gold text-white transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Subject</label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  className="w-full bg-icube-dark border border-white/10 p-4 rounded-sm focus:outline-none focus:border-icube-gold text-white transition-colors appearance-none"
                >
                  <option>Studio Booking</option>
                  <option>Video Production</option>
                  <option>General Inquiry</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Message</label>
                <textarea
                  rows={5}
                  required
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  className="w-full bg-icube-dark border border-white/10 p-4 rounded-sm focus:outline-none focus:border-icube-gold text-white transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="w-full py-4 bg-icube-gold text-icube-dark font-semibold uppercase tracking-wider rounded-lg hover:bg-icube-gold-light transition-colors disabled:opacity-50 focus:outline-none"
              >
                {sending ? "Sending…" : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
