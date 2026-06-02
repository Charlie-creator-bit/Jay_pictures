import { motion } from "motion/react";
import { ArrowUpRight, Sparkles, MapPin, Award } from "lucide-react";
import { Link } from "react-router-dom";

export default function AboutSection() {
  return (
    <section id="about-section" className="py-24 border-b border-white/5 relative overflow-hidden">
      <div className="container mx-auto px-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Accent Side Label */}
          <div className="lg:col-span-1 space-y-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#d4af37] font-mono flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>THE BRAND</span>
            </div>
            <h2 className="text-3xl font-serif font-light text-white tracking-tight">
              Crafting <br />
              <span className="italic text-[#d4af37]">Intention</span>
            </h2>
          </div>

          {/* Main Story Narrative */}
          <div className="lg:col-span-3 space-y-8">
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-lg sm:text-xl font-serif font-light leading-relaxed text-white/90"
            >
              JAY Pictures is a creative photography and videography brand based in Adenta, Accra, dedicated to transforming visions into timeless visuals and unforgettable experiences.
            </motion.p>

            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-sm font-sans leading-relaxed text-white/60"
            >
              With over four years of experience, we understand the importance of storytelling, creativity, and attention to detail when it comes to creating powerful visual content. Our goal is not just to capture moments, but to bring our clients’ visions to life in a way that feels authentic, cinematic, and memorable.
            </motion.p>

            {/* Micro-Meta Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                  <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
                </div>
                <span className="text-[10px] font-mono text-white/70 uppercase tracking-wider">Adenta, Accra, Ghana</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                  <Award className="w-3.5 h-3.5 text-[#d4af37]" />
                </div>
                <span className="text-[10px] font-mono text-white/70 uppercase tracking-wider">4+ Years Active</span>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="pt-4">
              <Link
                to="/about"
                className="inline-flex items-center gap-2 text-[10px] uppercase font-mono tracking-widest text-[#d4af37] hover:text-white transition-colors group"
              >
                <span>Read Full Brand Heritage</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
