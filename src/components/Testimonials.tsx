import { motion } from "motion/react";
import { Quote } from "lucide-react";
import { useSiteData } from "../SiteDataContext";

export default function Testimonials() {
  const { testimonials } = useSiteData();

  return (
    <section
      id="testimonials"
      className="py-32 bg-gradient-to-b from-icube-gray via-icube-dark/80 to-icube-gray relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-8 h-[2px] bg-icube-gold" />
            <span className="text-icube-gold font-semibold tracking-[0.18em] uppercase text-xs md:text-sm">
              Client stories
            </span>
            <div className="w-8 h-[2px] bg-icube-gold" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold tracking-tight">
            What our clients say
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.2 }}
              className="bg-white/5 p-8 border border-white/10 rounded-xl relative group hover:border-icube-gold/30 shadow-[0_18px_45px_rgba(0,0,0,0.35)] transition-colors duration-500"
            >
              <Quote size={48} className="text-white/5 absolute top-6 right-6 group-hover:text-icube-gold/10 transition-colors duration-500" />
              <p className="text-gray-300 font-light leading-relaxed mb-8 relative z-10">"{t.quote}"</p>
              <div className="flex items-center gap-4">
                <img src={t.image_url} alt={t.author} className="w-12 h-12 rounded-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                <div>
                  <h4 className="font-display font-semibold text-white">{t.author}</h4>
                  <p className="text-icube-gold text-xs uppercase tracking-wider">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
