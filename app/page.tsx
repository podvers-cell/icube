/**
 * Next.js root page (/) – placeholder until PublicSite is migrated in Phase 2.
 * Current app home is still served by Vite via react-router catch-all.
 */
export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-icube-dark text-white font-display">
      <h1 className="text-2xl font-semibold text-icube-gold">ICUBE Media Studio</h1>
      <p className="mt-2 text-white/80">Next.js foundation ready. Home page migration in Phase 2.</p>
    </div>
  );
}
