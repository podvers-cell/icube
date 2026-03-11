import { motion } from "motion/react";
import { viewportTransition } from "../lib/motion";
import WavySectionDivider from "./WavySectionDivider";

export default function BenefitsSection() {
  return (
    <section
      id="benefits"
      className="relative py-24 md:py-32 overflow-hidden bg-gradient-to-b from-icube-dark via-icube-gray/70 to-icube-dark/90"
    >
      <WavySectionDivider />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-icube-gold/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Content block – title, intro, separator, columns */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-[2px] bg-icube-gold" />
              <span className="text-icube-gold font-semibold tracking-[0.18em] uppercase text-xs md:text-sm">
                Why work with us
              </span>
              <div className="w-8 h-[2px] bg-icube-gold" />
            </div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={viewportTransition}
              className="text-3xl md:text-4xl lg:text-[2.75rem] font-display font-bold text-white leading-tight tracking-tight"
            >
              The benefits of working with a media & podcast studio
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ ...viewportTransition, delay: 0.05 }}
              className="text-gray-300 font-light leading-relaxed max-w-2xl text-base md:text-lg"
            >
              At <span className="text-icube-gold font-medium">ICUBE</span>, we bring years of experience in premium production and podcasting in Dubai. From concept to final cut, we help brands and creators tell stories that resonate—with the right gear, the right space, and a team that cares about quality.
            </motion.p>

            <div
              className="h-px w-full max-w-2xl bg-gradient-to-r from-transparent via-icube-gold/50 to-transparent"
              aria-hidden
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ ...viewportTransition, delay: 0.08 }}
                className="space-y-4"
              >
                <p className="text-gray-400 font-light leading-relaxed text-sm md:text-base">
                  Our team combines industry expertise with deep knowledge of digital media, current trends, and how to navigate the content landscape. We don’t just record—we shape narratives that fit your brand and audience.
                </p>
                <p className="text-gray-400 font-light leading-relaxed text-sm md:text-base">
                  ICUBE’s production approach drives real engagement: strategic content creation, community management, and campaign execution. We focus on measurable results so you can see the impact of your investment.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ ...viewportTransition, delay: 0.12 }}
                className="space-y-4"
              >
                <p className="text-gray-400 font-light leading-relaxed text-sm md:text-base">
                  We manage the full production pipeline: podcast recording, video shoots, and multi-format content. From our Dubai studios we support creators and businesses across the UAE and beyond with a skilled team of producers, sound engineers, and creatives.
                </p>
                <p className="text-gray-400 font-light leading-relaxed text-sm md:text-base">
                  Our clients get access to professional-grade technology and workflows designed for scalability. Whether you’re launching a new show or levelling up your brand content, we’re here to help you grow your audience and reach.
                </p>
              </motion.div>
            </div>
          </div>

          {/* Visual – podcast still */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ ...viewportTransition, delay: 0.1 }}
            className="lg:col-span-5 xl:col-span-4 flex items-center justify-center lg:justify-end"
          >
            <img
              src="/podcast-still.png"
              alt="Podcast production at ICUBE Media Studio – professional recording setup"
              className="w-full h-auto max-h-[480px] object-contain max-w-md lg:max-w-lg"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
