"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useContactModal } from "../ContactModalContext";

const quickLinks: { label: string; href?: string; openContact?: boolean }[] = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/#services" },
  { label: "Studio", href: "/#studio" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Why Us", href: "/#why-us" },
  { label: "Benefits", href: "/#benefits" },
  { label: "Packages", href: "/packages" },
  { label: "Testimonials", href: "/#testimonials" },
  { label: "Videos", href: "/#videos" },
  { label: "Contact", openContact: true },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { openContact } = useContactModal();

  function handleNewsletter(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    setEmail("");
  }

  return (
    <footer className="bg-black border-t border-white/10">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          {/* Brand + Newsletter */}
          <div className="lg:col-span-5 space-y-8">
            <Link href="/" className="inline-block">
              <img
                src="/icube-logo.svg"
                alt="ICUBE Media Studio"
                className="h-20 w-auto object-contain"
              />
            </Link>
            <div>
              <h3 className="text-lg font-display font-semibold text-white uppercase tracking-[0.2em] mb-3">
                Newsletter
              </h3>
              <p className="text-gray-400 text-sm mb-4 max-w-sm">
                Subscribe for updates on our studio, new services, and offers.
              </p>
              <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-2 max-w-md">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="flex-1 min-w-0 px-4 py-3 rounded-lg bg-white/5 border border-white/15 text-white placeholder-gray-500 focus:outline-none focus:border-icube-gold transition-colors"
                  disabled={submitted}
                />
                <button
                  type="submit"
                  className="px-5 py-3 rounded-lg bg-icube-gold text-icube-dark font-semibold uppercase tracking-wider text-sm hover:bg-icube-gold-light transition-colors shrink-0 focus:outline-none"
                >
                  {submitted ? "Subscribed" : "Subscribe"}
                </button>
              </form>
              {submitted && (
                <p className="text-gray-500 text-xs mt-1">Newsletter coming soon. Thanks for your interest.</p>
              )}
            </div>
          </div>

          {/* Website sections */}
          <div className="lg:col-span-7">
            <h3 className="text-lg font-display font-semibold text-white uppercase tracking-[0.2em] mb-6">
              Website
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-8 gap-y-4">
              {quickLinks.map((link) =>
                link.openContact ? (
                  <button
                    key={link.label}
                    type="button"
                    onClick={openContact}
                    className="text-gray-400 text-sm hover:text-icube-gold transition-colors text-left bg-transparent border-0 cursor-pointer"
                  >
                    {link.label}
                  </button>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href!}
                    className="text-gray-400 text-sm hover:text-icube-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                )
              )}
            </div>
            <div className="mt-8 pt-8 border-t border-white/10 flex flex-wrap gap-6 text-sm">
              <Link href="/privacy" className="text-gray-500 hover:text-icube-gold transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-500 hover:text-icube-gold transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar: copyright + made with love */}
      <div className="border-t border-white/10 py-6">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col items-center gap-3 text-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} ICUBE Vision TV Production L.L.C. Dubai, UAE. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm inline-flex items-center gap-1.5">
            Made with <Heart size={14} className="text-icube-gold fill-icube-gold inline" /> by{" "}
            <a
              href="https://www.m2filmsdxb.com"
              target="_blank"
              rel="noreferrer"
              className="text-white font-medium hover:text-icube-gold transition-colors"
            >
              M2FILMS DUBAI
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
