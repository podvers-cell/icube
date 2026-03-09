import { motion } from "motion/react";
import { useSiteData } from "../SiteDataContext";
import { getIcon } from "../lib/icons";

const colors = ["from-red-500/20 to-transparent", "from-orange-500/20 to-transparent", "from-blue-500/20 to-transparent", "from-purple-500/20 to-transparent", "from-emerald-500/20 to-transparent"];

export default function Services() {
  const { services, loading } = useSiteData();

  if (loading) return null;

  return (
    <section id="services" className="py-32 bg-icube-dark relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-icube-gold/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-[2px] bg-icube-gold" />
              <span className="text-icube-gold font-semibold tracking-[0.2em] uppercase text-sm">
                Our Expertise
              </span>
            </div>
            <h2 className="text-5xl md:text-7xl font-display font-bold leading-none tracking-tighter">
              PREMIUM
              <br />
              <span className="text-gray-500">PRODUCTION</span>
            </h2>
          </div>
          <p className="text-gray-400 max-w-md font-light">
            End-to-end media solutions in Dubai for brands and creators across the UAE and beyond.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => {
            const Icon = getIcon(service.icon);
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group relative bg-icube-gray border border-white/5 p-8 hover:border-icube-gold/30 transition-colors duration-500 overflow-hidden rounded-sm"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${colors[index % colors.length]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-black/50 border border-white/10 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 group-hover:border-icube-gold/50 transition-all duration-500">
                    <Icon size={24} className="text-white group-hover:text-icube-gold transition-colors" />
                  </div>
                  <h3 className="text-2xl font-display font-semibold mb-4 tracking-tight group-hover:text-icube-gold transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-gray-400 font-light leading-relaxed mb-8">{service.description}</p>
                  <a href="#booking" className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white group-hover:text-icube-gold transition-colors">
                    Learn More <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
