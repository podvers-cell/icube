export default function Footer() {
  return (
    <footer className="bg-black py-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <a href="#" className="flex items-center gap-2">
          <img
            src="/icube-logo.svg"
            alt="ICUBE Vision TV Production"
            className="h-16 w-auto object-contain"
          />
        </a>

        <div className="text-gray-500 text-sm font-light text-center md:text-left">
          &copy; {new Date().getFullYear()} ICUBE Vision TV Production L.L.C. Dubai, UAE. All rights reserved.
        </div>

        <div className="flex gap-6 text-sm font-semibold text-gray-400 uppercase tracking-wider">
          <a href="#" className="hover:text-icube-gold transition-colors">
            Privacy
          </a>
          <a href="#" className="hover:text-icube-gold transition-colors">
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}
