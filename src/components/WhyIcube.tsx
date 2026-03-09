import { motion } from "motion/react";
import { useSiteData } from "../SiteDataContext";
import { getIcon } from "../lib/icons";

export default function WhyIcube() {
  const { whyUs, loading } = useSiteData();

  if (loading) return null;

  return (
    <section id="why-us" className="py-32 bg-icube-gray relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent mix-blend-overlay pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="text-center mb-20">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-[2px] bg-icube-gold" />
            <span className="text-icube-gold font-semibold tracking-[0.2em] uppercase text-sm">The Difference</span>
            <div className="w-8 h-[2px] bg-icube-gold" />
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="text-5xl md:text-7xl font-display font-bold leading-none tracking-tighter">
            WHY CHOOSE <span className="text-icube-gold">ICUBE</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {whyUs.map((feature, i) => {
            const Icon = getIcon(feature.icon);
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                className="text-center group"
              >
                <div className="w-20 h-20 mx-auto bg-icube-dark border border-white/10 rounded-full flex items-center justify-center mb-8 group-hover:border-icube-gold group-hover:bg-icube-gold/10 transition-all duration-500">
                  <Icon size={32} className="text-white group-hover:text-icube-gold transition-colors" />
                </div>
                <h3 className="text-2xl font-display font-semibold mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-gray-400 font-light leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
