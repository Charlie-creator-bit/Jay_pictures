import React, { useEffect } from "react";
import { motion } from "motion/react";
import { 
  Camera, Palette, Video, Image as ImageIcon, Check, ArrowRight, Sparkles, Clock, 
  Layers, Circle, Award, Eye, FileText
} from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button.tsx";

const serviceCategories = [
  {
    id: "portraits",
    icon: <Camera className="w-10 h-10 text-[#d4af37]" />,
    title: "Cinematic Portraits",
    subtitle: "Character & Narrative Depth",
    price: "GH₵1,500+",
    duration: "4 - 6 Hours",
    description: "High-end portraiture focused on character and narrative depth using advanced studio lighting, classical chiaroscuro, and custom color grading templates. Ideal for artists, actors, executives, and visionaries.",
    features: [
      "Custom concept consultation",
      "Rembrandt & cinematic-style light setups",
      "Up to 3 outfit/look changes",
      "10 ultra-high-end retouched masterpieces",
      "Private password-secured online gallery",
      "Commercial usage rights included"
    ],
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "fine-art",
    icon: <Palette className="w-10 h-10 text-[#d4af37]" />,
    title: "Fine Art Direction",
    subtitle: "Tailored Conceptual Set Design",
    price: "GH₵5,000+",
    duration: "Full Production Setup",
    description: "Tailored fine art sets and creative direction matching your custom storytelling. We design sets, style wardrobes, and craft an overall aesthetic language to produce print-quality visual paintings.",
    features: [
      "Dedicated creative director & stylist",
      "Full moodboard & set blueprint design",
      "Access to premium bespoke props & textiles",
      "15 premium fine-art printed files",
      "Museum-grade hand-made archival presentation box",
      "Certificate of authenticity for prints"
    ],
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "fashion-films",
    icon: <Video className="w-10 h-10 text-[#d4af37]" />,
    title: "Fashion Films",
    subtitle: "Premium 8K Cinematography",
    price: "GH₵3,500+",
    duration: "1 - 2 Shoot Days",
    description: "High-contrast, high-end motion narrative packages capturing movement, texture, and brand message. Crafted in supreme Red/Arri 8k resolution with fully-licensed custom cinematic scores.",
    features: [
      "Cinematic storyboard and script formulation",
      "Director of Photography & camera crew",
      "Professional color grading & audio design",
      "60-second high-impact edit for platforms",
      "3-minute full editorial director's cut",
      "Uncompressed high-bitrate video formats"
    ],
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "archival-printing",
    icon: <ImageIcon className="w-10 h-10 text-[#d4af37]" />,
    title: "Archival Printing",
    subtitle: "Museum Grade Exhibition Formats",
    price: "GH₵750+",
    duration: "Finishing Suite",
    description: "Meticulous physical translation of digital imagery to real-world mediums. We employ high-end giclée pigment printers and Hahnemühle papers to ensure gallery-grade dynamic range and a lifetime of archival longevity.",
    features: [
      "Full color profile proofing sessions",
      "Select Hahnemühle or Canson rag substrates",
      "Exhibition-grade custom framing options",
      "Ultra-high definition scan optimization",
      "Acid-free mount seals and archival shielding",
      "Global professional shipping services"
    ],
    image: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&q=80&w=800"
  }
];

const steps = [
  {
    num: "01",
    title: "The Creative Inception",
    desc: "Every commission begins with a blank sheet. We meet over espresso or Zoom to map out themes, color palettes, emotional curves, and locations."
  },
  {
    num: "02",
    title: "The Sacred Session",
    desc: "In our fully-equipped heritage studio or on-location, we curate an intimate atmosphere with precision lightning to extract genuine character."
  },
  {
    num: "03",
    title: "Signature Post-Production",
    desc: "Our darkroom editors develop a dedicated color-grade and meticulously retouch every individual frame by hand, focusing on texture integrity."
  },
  {
    num: "04",
    title: "Permanent Legacy",
    desc: "We host a private unveiling of your digital vault or deliver museum-grade prints and custom physical gallery albums to secure your legacy."
  }
];

export default function ServicesPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-luxury-black text-white pt-28 pb-20 relative overflow-hidden">
      
      {/* Decorative backdrop elements */}
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-[#d4af37]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-[#d4af37]/3 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 sm:px-12 relative z-10">
        
        {/* Header Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-24 space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-full text-[9px] uppercase tracking-[0.2em] text-[#d4af37] font-mono"
          >
            <Sparkles className="w-3 h-3 text-[#d4af37]" />
            <span>Sartorial Eye & Pristine Craft</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl font-display text-white"
          >
            Creative <span className="italic font-serif text-[#d4af37]">Services</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-sm text-white/50 max-w-xl mx-auto font-sans leading-relaxed"
          >
            Explore our curated menu of high-end visual solutions. From bespoke portraiture session briefs to museum-grade, lifetime archival exhibitions.
          </motion.p>
        </div>

        {/* Services Listings (Alternating Cards) */}
        <div className="max-w-5xl mx-auto space-y-24 mb-32">
          {serviceCategories.map((service, index) => {
            const isReversed = index % 2 !== 0;
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`grid grid-cols-1 lg:grid-cols-12 gap-12 items-center bg-white/[0.01] p-6 lg:p-10 rounded-3xl border border-white/5 backdrop-blur-sm ${
                  isReversed ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Visual Cover image */}
                <div className={`lg:col-span-5 relative group overflow-hidden rounded-2xl h-80 lg:h-[400px] ${
                  isReversed ? "lg:order-last" : ""
                }`}>
                  <img 
                    src={service.image} 
                    alt={service.title}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  
                  {/* Category Pill Tag Overlay */}
                  <div className="absolute top-4 left-4 px-3 py-1 bg-black/80 backdrop-blur border border-white/10 rounded-full text-[8px] font-mono uppercase tracking-widest text-[#d4af37]">
                    Premium Unit
                  </div>
                </div>

                {/* Technical & Creative specifications */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-[#d4af37]/5 border border-[#d4af37]/10 rounded-2xl">
                      {service.icon}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#d4af37] block">
                        {service.subtitle}
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-serif text-white mt-1">
                        {service.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-sm text-white/50 leading-relaxed font-sans">
                    {service.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-white/5 text-xs font-mono">
                    <div className="flex items-center gap-2 bg-black/30 p-3 rounded-xl border border-white/5">
                      <Clock className="w-4 h-4 text-[#d4af37] shrink-0" />
                      <div>
                        <span className="text-[9px] text-white/30 block uppercase">Duration</span>
                        <span className="text-white font-medium">{service.duration}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-black/30 p-3 rounded-xl border border-white/5">
                      <Layers className="w-4 h-4 text-[#d4af37] shrink-0" />
                      <div>
                        <span className="text-[9px] text-white/30 block uppercase">Retainer</span>
                        <span className="text-[#d4af37] font-bold">{service.price}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <span className="text-[9px] font-mono uppercase text-white/40 tracking-widest block mb-1">
                      Includes the following inclusions:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {service.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-white/70">
                          <Check className="w-3.5 h-3.5 text-[#d4af37] shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Deep link direct booking trigger action */}
                  <div className="pt-4 flex">
                    <Link to={`/book?service=${encodeURIComponent(service.title)}`}>
                      <Button className="flex items-center gap-2 text-[10px] tracking-widest uppercase font-mono font-bold bg-[#d4af37] hover:bg-[#d4af37]/90 text-black px-6 py-3">
                        <span>Initiate Commission</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Beautiful Timeline: How We Create */}
        <div className="max-w-5xl mx-auto mb-32 space-y-16">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#d4af37]">Process Architecture</span>
            <h2 className="text-3xl sm:text-4xl font-display text-white">How We Sculpt <span className="italic">History</span></h2>
            <p className="text-xs text-white/40 max-w-md mx-auto leading-relaxed">
              Our photographic workflow is meticulously structured to ensure an exceptional experience and legacy quality artifact outputs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className="relative bg-white/[0.01] border border-white/5 p-6 rounded-2xl flex flex-col justify-between group hover:border-[#d4af37]/20 transition-all cursor-default"
              >
                <div className="space-y-4">
                  <span className="text-3xl font-serif text-[#d4af37]/20 group-hover:text-[#d4af37]/40 transition-colors duration-500 font-extrabold tracking-tighter">
                    {step.num}
                  </span>
                  <h4 className="text-md font-serif text-white font-bold tracking-tight">
                    {step.title}
                  </h4>
                  <p className="text-xs text-white/40 leading-relaxed font-sans">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quality Inclusions / Bottom CTA Banner */}
        <div className="max-w-4xl mx-auto text-center border border-white/10 bg-gradient-to-br from-white/[0.02] via-black to-[#d4af37]/5 p-8 sm:p-12 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/3 blur-xl rounded-full" />
          <div className="relative z-10 space-y-6">
            <h3 className="text-2xl sm:text-3xl font-serif">Have a Bespoke Custom <span className="italic font-serif text-[#d4af37]">Inquiry</span>?</h3>
            <p className="text-xs text-white/50 max-w-md mx-auto leading-relaxed">
              For high-end fashion campaigns, major record label commissions, curated brand books, or global editorial travel inquiries, connect with our team directly.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/book">
                <Button className="font-mono text-[10px] tracking-widest uppercase py-3.5 px-8">
                  Begin Booking Process & Schedule
                </Button>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
