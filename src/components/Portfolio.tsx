import { motion } from "motion/react";
import { Play } from "lucide-react";
import { useSiteData } from "../SiteDataContext";

export default function Portfolio() {
  const { portfolio, loading } = useSiteData();

  if (loading) return null;

  return (
    <section id="portfolio" className="py-32 bg-icube-dark relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-[2px] bg-icube-gold" />
              <span className="text-icube-gold font-semibold tracking-[0.2em] uppercase text-sm">
                Selected Works
              </span>
            </div>
            <h2 className="text-5xl md:text-7xl font-display font-bold leading-none tracking-tighter">
              OUR
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600">
                PORTFOLIO
              </span>
            </h2>
          </div>
          <a href="#contact" className="text-sm font-semibold uppercase tracking-wider text-white hover:text-icube-gold transition-colors border-b border-white/20 pb-1 hover:border-icube-gold">
            Get in touch
          </a>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {portfolio.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className="group relative aspect-[4/3] overflow-hidden rounded-sm cursor-pointer"
            >
              <img
                src={project.image_url}
                alt={project.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 scale-90 group-hover:scale-100">
                <div className="w-20 h-20 rounded-full bg-icube-gold/90 flex items-center justify-center backdrop-blur-sm shadow-2xl">
                  <Play size={32} className="text-white ml-2" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 p-8 w-full translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <span className="text-icube-gold font-mono text-sm tracking-wider uppercase mb-2 block">
                  {project.category}
                </span>
                <h3 className="text-3xl font-display font-bold text-white tracking-tight">{project.title}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
