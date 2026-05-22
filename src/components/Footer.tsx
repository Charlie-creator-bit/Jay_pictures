import { motion } from "motion/react";
import { Camera, Instagram, Twitter, Linkedin, ArrowUpRight } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="h-20 px-12 flex justify-between items-center text-[9px] uppercase tracking-[0.3em] opacity-40 border-t border-white/5">
      <div>&copy; {currentYear} Jay Pictures Archive</div>
      <div className="hidden md:flex gap-12">
        <span>Instagram</span>
        <span>Behance</span>
        <span>Vimeo</span>
      </div>
      <div className="hidden sm:block text-luxury-gold tracking-[0.5em]">Handcrafted Aesthetics</div>
    </footer>
  );
}
