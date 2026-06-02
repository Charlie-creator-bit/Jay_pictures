import React, { useEffect } from "react";
import { motion } from "motion/react";
import { 
  Award, Camera, Sparkles, MapPin, Users, Heart, Film, ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";

export default function AboutPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const coreSpecialties = [
    { title: "Portrait Photography", desc: "Capturing the authentic essence, emotion, and character of individuals through fine-art portraiture." },
    { title: "Wedding & Romance", desc: "Weaving together cinematic romantic narratives that chronicle love stories in their most honest moments." },
    { title: "Fashion & Lifestyle", desc: "Producing striking, editorial-grade visual campaigns with clean composition, posture, and style." },
    { title: "Studio & Commercial", desc: "Crafting perfectly controlled, commercial-high layouts designed to elevate brand identity." },
    { title: "Cinematic Videography", desc: "Providing premium, emotionally resonant moving pictures and high-fidelity video production." },
    { title: "Drone & Aerial Coverage", desc: "Stunning, high-altitude perspective sweeps that register scale, architecture, and mood." }
  ];

  return (
    <div className="min-h-screen bg-luxury-black text-white pt-28 pb-20 relative overflow-hidden">
      {/* Decorative ambient backgrounds */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-luxury-gold/5 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-luxury-gold/3 blur-[100px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 sm:px-12 relative z-10">
        
        {/* Page Title Header */}
        <div className="max-w-4xl mx-auto text-center mb-20 space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-full text-[9px] uppercase tracking-[0.2em] text-[#d4af37] font-mono"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Brand Heritage & Storytelling</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl font-display text-white"
          >
            About <span className="italic font-serif text-[#d4af37]">JAY Pictures</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-sm text-white/50 max-w-xl mx-auto font-sans leading-relaxed"
          >
            Crafting intentional, high-contrast visual narratives that bridge pure digital precision with timeless art direction.
          </motion.p>
        </div>

        {/* Narrative Section - Split Grid */}
        <div id="narrative-grid" className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-28">
          
          {/* Accent Brand Metadata Column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-4 space-y-8 lg:sticky lg:top-28"
          >
            <div className="border border-white/5 bg-white/[0.01] rounded-3xl p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#d4af37]/10 rounded-2xl border border-[#d4af37]/20">
                  <MapPin className="w-5 h-5 text-[#d4af37]" />
                </div>
                <div>
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-white/40">Base Location</h4>
                  <p className="text-sm font-bold font-serif text-white">Adenta, Accra, Ghana</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#d4af37]/10 rounded-2xl border border-[#d4af37]/20">
                  <Award className="w-5 h-5 text-[#d4af37]" />
                </div>
                <div>
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-white/40">Experience</h4>
                  <p className="text-sm font-bold font-serif text-white">4+ Years of Professional Craft</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#d4af37]/10 rounded-2xl border border-[#d4af37]/20">
                  <LogoAccent className="w-5 h-5 text-[#d4af37]" />
                </div>
                <div>
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-[#d4af37]">Brand Philosophy</h4>
                  <p className="text-xs text-white/60">Storytelling driven by cinematic passion & intention.</p>
                </div>
              </div>
            </div>
            
            <div className="p-1 text-center lg:text-left">
              <span className="text-[10px] font-mono uppercase text-white/20 tracking-[0.3em]">
                EST. COLLECTION © 2022
              </span>
            </div>
          </motion.div>

          {/* Core Text Copy Column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="lg:col-span-8 space-y-8 font-serif leading-relaxed text-base text-white/80"
          >
            <p className="text-lg sm:text-xl text-white/95 font-light border-l-2 border-[#d4af37]/40 pl-6 italic">
              "JAY Pictures is a creative photography and videography brand based in Adenta, Accra, dedicated to transforming visions into timeless visuals and unforgettable experiences."
            </p>

            <div className="space-y-6 text-sm sm:text-base font-sans text-white/70 antialiased leading-relaxed">
              <p>
                With over four years of experience, we understand the importance of storytelling, creativity, and attention to detail when it comes to creating powerful visual content. Our goal is not just to capture moments, but to bring our clients’ visions to life in a way that feels authentic, cinematic, and memorable.
              </p>

              <p>
                Through a combination of creativity, professionalism, and modern visual techniques, we create content that connects with people and leaves lasting impressions. Our commitment is rooted in visual integrity, utilizing top-tier lighting, bespoke set curation, and fine design direction for all commissions.
              </p>

              <p>
                Over the years, we have worked with clients across different countries and collaborated with major brands and organizations, building a reputation for quality, creativity, and excellence. We hold ourselves to uncompromising standards, ensuring every project is treated as a landmark custom achievement.
              </p>
            </div>

            <div className="pt-6 border-t border-white/5">
              <div className="bg-[#d4af37]/5 rounded-2xl border border-[#d4af37]/10 p-6 flex flex-col justify-center text-center relative overflow-hidden">
                <QuoteIcon className="absolute -top-4 -right-4 w-28 h-28 text-[#d4af37]/5" />
                <p className="text-sm sm:text-base text-white font-medium italic relative z-10">
                  "At JAY Pictures, every frame is crafted with intention, passion, and purpose because every story deserves to be told beautifully."
                </p>
              </div>
            </div>
          </motion.div>

        </div>

        {/* Core Capabilities - Bento Style */}
        <div className="max-w-5xl mx-auto mb-28">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-serif mb-2">Our <span className="italic font-serif text-[#d4af37]">Specialties</span></h2>
            <p className="text-xs text-white/40 max-w-sm mx-auto leading-relaxed">
              Comprehensive lens coverage and digital art production tailored to match luxury and high-fashion aesthetics.
            </p>
          </div>

          <div id="specialties-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreSpecialties.map((spec, index) => (
              <motion.div
                key={spec.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 hover:border-[#d4af37]/20 hover:bg-[#d4af37]/5 transition-all duration-500 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                      {spec.title}
                    </h3>
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed font-sans">
                    {spec.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Brand Legacy Milestone Stats */}
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-white/[0.01] to-white/[0.02] border border-white/5 rounded-3xl p-10 flex flex-col md:flex-row justify-around items-center gap-8 mb-28">
          <div className="text-center space-y-1">
            <div className="text-3xl sm:text-4xl font-serif text-[#d4af37] font-bold">4+</div>
            <div className="text-[9px] font-mono uppercase tracking-widest text-white/50">Years of Experience</div>
          </div>
          <div className="w-px h-10 bg-white/10 hidden md:block" />
          <div className="text-center space-y-1">
            <div className="text-3xl sm:text-4xl font-serif text-[#d4af37] font-bold">100%</div>
            <div className="text-[9px] font-mono uppercase tracking-widest text-white/50">Intentional Frames</div>
          </div>
          <div className="w-px h-10 bg-white/10 hidden md:block" />
          <div className="text-center space-y-1">
            <div className="text-3xl sm:text-4xl font-serif text-[#d4af37] font-bold">Global</div>
            <div className="text-[9px] font-mono uppercase tracking-widest text-white/50">Collaborations</div>
          </div>
        </div>

        {/* Immersive CTA Block */}
        <div className="max-w-3xl mx-auto bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden text-center">
          <div className="absolute top-0 left-0 w-32 h-32 bg-[#d4af37]/3 blur-xl rounded-full" />
          
          <div className="space-y-6 relative z-10">
            <span className="text-[9px] uppercase font-mono tracking-[0.25em] text-[#d4af37]">Ready to Collaborate?</span>
            <h2 className="text-2xl sm:text-3xl font-serif">Bring Your <span className="italic font-serif text-[#d4af37]">Vision to Life</span></h2>
            <p className="text-xs text-white/50 max-w-sm mx-auto leading-relaxed">
              Every story, event, and portrait session is designed meticulously. Reach out today to secure your custom booking.
            </p>
            <div className="pt-2">
              <Link to="/book" className="inline-flex items-center gap-2 px-8 py-3 bg-[#d4af37] text-black font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-opacity-95 active:scale-95 transition-all shadow-lg cursor-pointer">
                <span>Book a Session</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Simple custom inline SVG support to keep external icon dependencies extremely clean and consistent
function LogoAccent(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m10 15 5-3-5-3v6Z" />
    </svg>
  );
}

function QuoteIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      {...props}
    >
      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
    </svg>
  );
}
