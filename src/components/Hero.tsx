import { motion } from "motion/react";
import Button from "./ui/Button.tsx";
import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section id="hero" className="relative h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
          src="/src/assets/images/jay_pictures_hero_1779202037948.png"
          alt="Luxury Studio"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-luxury-black via-luxury-black/40 to-transparent" />
      </div>

      <div className="container mx-auto px-12 relative z-10 pt-20">
        <div className="max-w-4xl text-center flex flex-col items-center mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="text-[10px] uppercase tracking-[0.5em] mb-4 text-luxury-gold opacity-80 font-bold block">
              Est. MMXIV — London & NYC
            </span>
            <h1 className="text-[72px] md:text-[100px] font-display leading-[0.9] mb-12 text-[#f5f5f5]">
              Capturing <span className="italic font-light">Timeless</span> <br />
              Moments
            </h1>
            <div className="flex flex-col sm:flex-row gap-8 justify-center">
              <Link to="/book">
                <Button id="book-session-cta" className="px-10 py-4 bg-luxury-gold text-black text-xs font-bold uppercase tracking-[0.2em] shadow-2xl hover:scale-105 transition-transform">
                  Book a Session
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Decorative vertical rail text */}
      <div className="absolute right-12 bottom-12 hidden lg:block">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 1 }}
          className="flex flex-col items-center gap-8"
        >
          <span className="[writing-mode:vertical-rl] rotate-180 uppercase tracking-[1em] text-xs font-bold text-white whitespace-nowrap">
            Est. MMXXIV — London / Dubai / NYC
          </span>
          <div className="w-px h-24 bg-white/30" />
        </motion.div>
      </div>
    </section>
  );
}
