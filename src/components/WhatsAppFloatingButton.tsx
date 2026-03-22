"use client";

import { usePathname } from "next/navigation";

const WHATSAPP_URL = "https://wa.me/971589965005";

/** Floating WhatsApp CTA on all public routes (hidden on dashboard). */
export default function WhatsAppFloatingButton() {
  const pathname = usePathname();
  if (pathname?.startsWith("/dashboard")) return null;

  return (
    <div className="fixed bottom-14 right-4 z-40 flex flex-col items-end">
      <div className="relative inline-block">
        <span
          className="absolute top-0 right-0 z-10 flex h-5 w-5 translate-x-1/4 -translate-y-1/4 items-center justify-center rounded-full bg-[#e53935] text-[10px] font-bold text-white shadow-md"
          aria-hidden
        >
          1
        </span>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
          className="group inline-flex h-14 w-14 shrink-0 items-center overflow-hidden rounded-full bg-[#25D366] text-white shadow-[0_4px_14px_rgba(0,0,0,0.25)] transition-[width,background-color,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[#1ebe5d] hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] md:hover:w-[280px]"
          aria-label="Any questions? Ask in WhatsApp"
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] md:group-hover:scale-110">
            <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </span>
          <span className="max-w-0 overflow-hidden whitespace-nowrap text-xs font-medium opacity-0 transition-[max-width,opacity] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] md:group-hover:max-w-[220px] md:group-hover:opacity-100 md:group-hover:pl-2 md:group-hover:pr-4">
            Any questions? Ask in WhatsApp
          </span>
        </a>
      </div>
    </div>
  );
}
