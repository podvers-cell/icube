"use client";

import AnimatedStaggerItem from "./AnimatedStaggerItem";

export default function BenefitsSection() {
  return (
    <section
      id="benefits"
      className="relative py-24 md:py-32 overflow-hidden bg-gradient-to-b from-icube-dark via-icube-gray/70 to-icube-dark/90"
    >
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-icube-gold/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Content block – title, intro, separator, columns */}
          <AnimatedStaggerItem index={0} className="lg:col-span-7 xl:col-span-8 space-y-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-[2px] bg-icube-gold" />
              <span className="text-icube-gold font-semibold tracking-[0.18em] uppercase text-xs md:text-sm">
                Why work with us
              </span>
              <div className="w-8 h-[2px] bg-icube-gold" />
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-display font-bold text-white leading-tight tracking-tight">
              The benefits of working with a media & podcast studio
            </h2>

            <p className="text-gray-300 font-light leading-relaxed max-w-2xl text-base md:text-lg">
              At <span className="text-icube-gold font-medium">ICUBE</span>, we bring years of experience in premium production and podcasting in Dubai. From concept to final cut, we help brands and creators tell stories that resonate—with the right gear, the right space, and a team that cares about quality.
            </p>

            <div
              className="h-px w-full max-w-2xl bg-gradient-to-r from-transparent via-icube-gold/50 to-transparent"
              aria-hidden
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              <div className="space-y-4">
                <p className="text-gray-400 font-light leading-relaxed text-sm md:text-base">
                  Our team combines industry expertise with deep knowledge of digital media, current trends, and how to navigate the content landscape. We don’t just record—we shape narratives that fit your brand and audience.
                </p>
                <p className="text-gray-400 font-light leading-relaxed text-sm md:text-base">
                  ICUBE’s production approach drives real engagement: strategic content creation, community management, and campaign execution. We focus on measurable results so you can see the impact of your investment.
                </p>
              </div>
              <div className="space-y-4">
                <p className="text-gray-400 font-light leading-relaxed text-sm md:text-base">
                  We manage the full production pipeline: podcast recording, video shoots, and multi-format content. From our Dubai studios we support creators and businesses across the UAE and beyond with a skilled team of producers, sound engineers, and creatives.
                </p>
                <p className="text-gray-400 font-light leading-relaxed text-sm md:text-base">
                  Our clients get access to professional-grade technology and workflows designed for scalability. Whether you’re launching a new show or levelling up your brand content, we’re here to help you grow your audience and reach.
                </p>
              </div>
            </div>
          </AnimatedStaggerItem>

          {/* Visual – podcast still */}
          <AnimatedStaggerItem index={1} className="lg:col-span-5 xl:col-span-4 flex items-center justify-center lg:justify-end">
            <img
              src="/podcast-still.png"
              alt="Podcast production at ICUBE Media Studio – professional recording setup"
              className="w-full h-auto max-h-[480px] object-contain max-w-md lg:max-w-lg"
            />
          </AnimatedStaggerItem>
        </div>
      </div>
    </section>
  );
}
