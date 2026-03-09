import { motion } from "motion/react";
import { Play, ArrowRight } from "lucide-react";
import { useSiteData } from "../SiteDataContext";

export default function Hero() {
  const { settings, loading } = useSiteData();
  const tagline = settings.hero_tagline || "Premium Media Agency – Dubai";
  const t1 = settings.hero_title_1 || "CREATE.";
  const t2 = settings.hero_title_2 || "RECORD.";
  const t3 = settings.hero_title_3 || "AMPLIFY.";
  const subtitle =
    settings.hero_subtitle ||
    "Professional media production and podcast studio in Dubai. Elevate your content with cinematic quality.";
  const bgType = settings.hero_bg_type || "image";
  const bgImage =
    settings.hero_bg_image_url ||
    "https://images.unsplash.com/photo-1598550880863-4e8aa3d0edb4?q=80&w=2070&auto=format&fit=crop";
  const bgVideo = settings.hero_bg_video_url || "";

  if (loading) return null;

  return (
    <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-icube-dark/60 via-icube-dark/40 to-icube-dark z-10" />
        {bgType === "video" && bgVideo ? (
          <video
            className="w-full h-full object-cover opacity-70"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src={bgVideo} />
          </video>
        ) : (
          <img
            src={bgImage}
            alt="Hero Background"
            className="w-full h-full object-cover opacity-60 scale-105 animate-slow-zoom"
            referrerPolicy="no-referrer"
          />
        )}
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-6 md:px-12 w-full flex flex-col items-start mt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="w-12 h-[2px] bg-icube-gold" />
          <span className="text-icube-gold font-semibold tracking-[0.2em] uppercase text-sm">
            {tagline}
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-6xl md:text-8xl lg:text-9xl font-display font-bold leading-[0.9] tracking-tighter mb-6"
        >
          {t1}
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
            {t2}
          </span>
          <br />
          {t3}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 font-light"
        >
          {subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center gap-6"
        >
          <a
            href="#booking"
            className="group relative px-8 py-4 bg-icube-gold text-icube-dark font-semibold uppercase tracking-wider rounded-sm overflow-hidden flex items-center gap-2 hover:bg-icube-gold-light transition-colors"
          >
            <span className="relative z-10">Book Studio</span>
            <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href="#portfolio"
            className="group flex items-center gap-4 text-white hover:text-icube-gold transition-colors"
          >
            <div className="w-14 h-14 rounded-full border border-white/30 flex items-center justify-center group-hover:border-icube-gold transition-colors">
              <Play size={20} className="ml-1" />
            </div>
            <span className="font-semibold uppercase tracking-wider text-sm">View Portfolio</span>
          </a>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20"
      >
        <span className="text-xs text-gray-500 uppercase tracking-widest rotate-90 mb-8">Scroll</span>
        <div className="w-[1px] h-16 bg-white/20 relative overflow-hidden">
          <motion.div
            animate={{ y: [0, 64] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="absolute top-0 left-0 w-full h-1/2 bg-icube-gold"
          />
        </div>
      </motion.div>
    </section>
  );
}
