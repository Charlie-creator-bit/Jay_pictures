import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Check, HelpCircle, Sparkles, DollarSign, Calculator, ChevronRight, Info, Award, 
  Layers, Camera, Image as ImageIcon, Shirt, RefreshCw
} from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button.tsx";

const categories = {
  studio: [
    {
      name: "Studio Starter",
      price: 600,
      priceLabel: "GH₵600",
      duration: "50 Min Session",
      popular: false,
      subtitle: "Ideal for fast portrait setups and premium high-quality headshots.",
      features: [
        "7 Retouched Pictures",
        "1-2 Outfit changes",
        "50 Minutes dedicated studio session",
        "Classic studio setup and backdrops",
        "High-resolution digital delivery",
        "Private password-secured online gallery",
        "Standard client usage rights"
      ]
    },
    {
      name: "Studio Standard",
      price: 800,
      priceLabel: "GH₵800",
      duration: "1 Hour Session",
      popular: true,
      subtitle: "Our signature time-frame for multi-angle creative fine art portraits.",
      features: [
        "10 Retouched Pictures",
        "1-3 Outfit changes",
        "1 Hour professional studio session",
        "Bespoke dramatic lighting directions",
        "Full premium color-graded proofs",
        "Private password-secured online gallery",
        "Commercial display license registry"
      ]
    },
    {
      name: "Studio Premium",
      price: 1000,
      priceLabel: "GH₵1,000",
      duration: "1Hr 20Min Session",
      popular: false,
      subtitle: "The complete elite package with personal makeup artist fully included on set.",
      features: [
        "12 Retouched Pictures",
        "1-4 Outfit changes",
        "1 Hour 20 Minutes studio session",
        "PROFESSIONAL MAKEUP INCLUDED",
        "Complete bespoke creative art styling",
        "Private password-secured online gallery",
        "Premium darkroom print sample included",
        "Full extended commercial buyout rights"
      ]
    }
  ],
  outdoor: [
    {
      name: "Outdoor Starter",
      price: 700,
      priceLabel: "GH₵700",
      duration: "50 Min Session",
      popular: false,
      subtitle: "Capturing natural lighting brilliance on real locations with style.",
      features: [
        "6 Retouched Pictures",
        "1-2 Outfit changes",
        "50 Minutes outdoor location shoot",
        "Natural light and reflector styling",
        "High-resolution digital delivery",
        "Private password-secured online gallery",
        "Standard client usage rights"
      ]
    },
    {
      name: "Outdoor Standard",
      price: 900,
      priceLabel: "GH₵900",
      duration: "50 Min Session",
      popular: true,
      subtitle: "Our benchmark outdoor collection with multi-backdrop scenic angles.",
      features: [
        "10 Retouched Pictures",
        "1-3 Outfit changes",
        "50 Minutes outdoor location shoot",
        "Pro dynamic weather-grade guidance",
        "Full color-graded proofs collection",
        "Private password-secured online gallery",
        "Commercial display license registry"
      ]
    },
    {
      name: "Outdoor Premium",
      price: 1100,
      priceLabel: "GH₵1,100",
      duration: "50 Min Session",
      popular: false,
      subtitle: "Advanced level natural environment showcase designed with maximum detail.",
      features: [
        "12 Retouched Pictures",
        "1-4 Outfit changes",
        "50 Minutes outdoor location shoot",
        "Bespoke location staging direction",
        "Enhanced landscape backdrop styling",
        "Private password-secured online gallery",
        "Premium darkroom print sample included",
        "Full extended commercial buyout rights"
      ]
    }
  ],
  wedding1: [
    {
      name: "One-Day Budget",
      price: 2700,
      priceLabel: "GH₵2,700",
      duration: "One Day Coverage",
      popular: false,
      subtitle: "Streamlined single-day coverage focusing on the essential core ceremonies.",
      features: [
        "All Edited Event Pictures",
        "Video Film (1 Mins)",
        "Full Video",
        "ONE Frame included",
        "5 Exclusive couple Pictures",
        "Premium Flash Drive folder"
      ]
    },
    {
      name: "One-Day Basic",
      price: 3900,
      priceLabel: "GH₵3,900",
      duration: "Highlight & Photobook",
      popular: true,
      subtitle: "Comprehensive coverage with dedicated Audio Recorded Sound capture and a premium PhotoBook.",
      features: [
        "All Edited Event Pictures",
        "Highlight Film (2 Mins)",
        "Full Edited Video",
        "Neatly Recorded Sound",
        "Premium PhotoBook",
        "12 Exclusive couple Pictures",
        "Flash Drive packaging",
        "Secure Cloud Storage"
      ]
    },
    {
      name: "One-Day Classic",
      price: 4900,
      priceLabel: "GH₵4,900",
      duration: "Lifetime Legacy",
      popular: false,
      subtitle: "Our absolute signature premium cinematic visual legacy. Includes Pre-Wedding, Drone coverage, Love Story, and Two custom frames.",
      features: [
        "Pre-Wedding shoot session",
        "All Edited Event Pictures",
        "18 Exclusive couple Pictures",
        "Cinematic Video Film (3-4 Mins)",
        "Neatly Recorded Sound",
        "Couple Love Story Film",
        "Drone premium coverage",
        "Bespoke PhotoBook",
        "Two Custom Frames",
        "Full Edited Video portfolio",
        "Cloud Storage (Lifetime Access)"
      ]
    }
  ],
  wedding2: [
    {
      name: "Two-Day Budget",
      price: 3500,
      priceLabel: "GH₵3,500",
      duration: "Two Days Coverage",
      popular: false,
      subtitle: "Cost-effective two-day legacy coverage documenting all core ceremonies.",
      features: [
        "All Edited Event Pictures",
        "Trailer Film (2 Mins)",
        "Full Video",
        "8 Exclusive couple Pictures",
        "Flash Drive folder",
        "Terms and conditions applied"
      ]
    },
    {
      name: "Two-Day Basic",
      price: 4900,
      priceLabel: "GH₵4,900",
      duration: "Advanced Duo coverage",
      popular: true,
      subtitle: "Fully structured dual-day visual production including high-end physical Photobooks and secure digital storage.",
      features: [
        "All Edited Event Pictures",
        "Trailer Film (3 Mins)",
        "Neatly Recorded Sound",
        "Premium PhotoBook",
        "12 Exclusive couple Pictures",
        "Flash Drive packaging",
        "Cloud Storage (Lifetime Access)",
        "Terms and conditions applied"
      ]
    },
    {
      name: "Two-Day Classic",
      price: 6900,
      priceLabel: "GH₵6,900",
      duration: "Ultimate Royal Legacy",
      popular: false,
      subtitle: "The non-compromise multi-day epic cinematic custom production. Complete drone coverage, couple love story interview, and multiple legacy frames.",
      features: [
        "Pre-Wedding shoot session",
        "All Edited Event Pictures",
        "20 Exclusive couple Pictures",
        "Cinematic Video Film (3-4 Mins)",
        "Neatly Recorded Sound",
        "Couple Love Story Interview",
        "Drone premium coverage",
        "Bespoke PhotoBook",
        "Two Custom Frames",
        "Full Edited Video portfolio",
        "Cloud Storage (Lifetime Access)",
        "Terms and conditions applied"
      ]
    }
  ],
  kids_studio: [
    {
      name: "Kids-Studio Starter",
      price: 600,
      priceLabel: "GH₵600",
      duration: "50 Min Session",
      popular: false,
      subtitle: "Bespoke studio experience crafted for beautiful portraits of your little ones.",
      features: [
        "7 Retouched Pictures",
        "1-2 Outfit changes",
        "Engaging child-friendly setup & backdrops",
        "High-resolution digital delivery",
        "Private password-secured online gallery",
        "Terms and conditions applied"
      ]
    },
    {
      name: "Kids-Studio Gold",
      price: 700,
      priceLabel: "GH₵700",
      duration: "50 Min Session",
      popular: true,
      subtitle: "Our signature, most loved child studio setup with custom playful props.",
      features: [
        "9 Retouched Pictures",
        "1-3 Outfit changes",
        "Engaging child-friendly setup & playful props",
        "High-resolution digital delivery",
        "Private password-secured online gallery",
        "Terms and conditions applied"
      ]
    },
    {
      name: "Kids-Studio Luxury",
      price: 900,
      priceLabel: "GH₵900",
      duration: "50 Min Session",
      popular: false,
      subtitle: "The complete elite luxury package with themed sets and full styling support.",
      features: [
        "12 Retouched Pictures",
        "1-4 Outfit changes",
        "Premium themed sets & playful props",
        "Full stylist consultation & guidance on set",
        "High-resolution digital delivery",
        "Private password-secured online gallery",
        "Terms and conditions applied"
      ]
    }
  ],
  kids_outdoor: [
    {
      name: "Kids-Outdoor Starter",
      price: 900,
      priceLabel: "GH₵900",
      duration: "Outdoor or Home",
      popular: false,
      subtitle: "Capturing organic outdoor child play or cozy home sessions with style.",
      features: [
        "7 Retouched Pictures",
        "1-2 Outfit changes",
        "Natural light and reflector styling",
        "Cozy backdrop setting & play actions",
        "High-resolution digital delivery",
        "Private password-secured online gallery",
        "Terms and conditions applied"
      ]
    },
    {
      name: "Kids-Outdoor Gold",
      price: 1000,
      priceLabel: "GH₵1,000",
      duration: "Outdoor or Home",
      popular: true,
      subtitle: "Scenic nature backdrops or beautifully staged multi-angle home designs.",
      features: [
        "9 Retouched Pictures",
        "1-3 Outfit changes",
        "Professional location staging setups",
        "Dynamic high-speed focus capture",
        "High-resolution digital delivery",
        "Private password-secured online gallery",
        "Terms and conditions applied"
      ]
    },
    {
      name: "Kids-Outdoor Luxury",
      price: 1200,
      priceLabel: "GH₵1,200",
      duration: "Outdoor or Home",
      popular: false,
      subtitle: "Advanced custom themed child location production with custom props.",
      features: [
        "12 Retouched Pictures",
        "1-4 Outfit changes",
        "Premium customized theme setups",
        "Bespoke location staging props provided",
        "High-resolution digital delivery",
        "Private password-secured online gallery",
        "Terms and conditions applied"
      ]
    }
  ],
  funeral: [
    {
      name: "Funeral Basic",
      price: 2500,
      priceLabel: "GH₵2,500",
      duration: "One Day Coverage",
      popular: false,
      subtitle: "Professional single-day coverage of funeral events, ceremonies, and family gatherings.",
      features: [
        "All Edited Event Pictures",
        "Highlight Film (2 Mins)",
        "Full Edited Video",
        "Flash Drive",
        "Extra crew Members option",
        "Terms and conditions applied"
      ]
    },
    {
      name: "Funeral Diamond",
      price: 3500,
      priceLabel: "GH₵3,500",
      duration: "One Day Coverage",
      popular: true,
      subtitle: "Enhanced sound-monitored single day coverage containing family premium photobooks and portrait pictures.",
      features: [
        "All Edited Event Pictures",
        "Highlight Film (2 Mins)",
        "Full Edited Video",
        "Neatly Recorded Sound",
        "Premium PhotoBook",
        "12 Exclusive Portrait/Family Pictures",
        "Flash Drive",
        "Extra crew Members option",
        "Terms and conditions applied"
      ]
    },
    {
      name: "Funeral Classic",
      price: 4900,
      priceLabel: "GH₵4,900",
      duration: "One Day Coverage",
      popular: false,
      subtitle: "Complete non-compromise multi-angle cinematic production covering every sequence in detail.",
      features: [
        "All Edited Event Pictures",
        "Cinematic Video Highlight (3-4 Mins)",
        "Neatly Recorded Sound",
        "Drone coverage",
        "Premium PhotoBook",
        "Two Custom Frames",
        "Full Edited Video",
        "Cloud Storage (Lifetime Access)",
        "Extra crew Members option",
        "Terms and conditions applied"
      ]
    }
  ],
  funeral_2d: [
    {
      name: "Funeral-2D Basic",
      price: 3200,
      priceLabel: "GH₵3,200",
      duration: "Two Days Coverage",
      popular: false,
      subtitle: "Professional two-day coverage of funeral events, ceremonies, and family gatherings.",
      features: [
        "All Edited Event Pictures",
        "Highlight Film (2 Mins)",
        "Full Edited Video",
        "Flash Drive",
        "Extra crew Members option",
        "Terms and conditions applied"
      ]
    },
    {
      name: "Funeral-2D Diamond",
      price: 4900,
      priceLabel: "GH₵4,900",
      duration: "Two Days Coverage",
      popular: true,
      subtitle: "Enhanced sound-monitored two days coverage containing family premium photobooks and portrait pictures.",
      features: [
        "All Edited Event Pictures",
        "Highlight Film (2 Mins)",
        "Full Edited Video",
        "Neatly Recorded Sound",
        "Premium PhotoBook",
        "12 Exclusive Portrait/Family Pictures",
        "Flash Drive",
        "Extra crew Members option",
        "Terms and conditions applied"
      ]
    },
    {
      name: "Funeral-2D Classic",
      price: 6900,
      priceLabel: "GH₵6,900",
      duration: "Two Days Coverage",
      popular: false,
      subtitle: "Complete non-compromise multi-angle cinematic production covering both days of sequence in detail.",
      features: [
        "All Edited Event Pictures",
        "Cinematic Video Highlight (3-4 Mins)",
        "Neatly Recorded Sound",
        "Drone coverage",
        "Premium PhotoBook",
        "Two Custom Frames",
        "Full Edited Video",
        "Cloud Storage (Lifetime Access)",
        "Extra crew Members option",
        "Terms and conditions applied"
      ]
    }
  ],
  funeral_3d: [
    {
      name: "Funeral-3D Basic",
      price: 4800,
      priceLabel: "GH₵4,800",
      duration: "Three Days Coverage",
      popular: false,
      subtitle: "Professional three-day coverage of funeral events, ceremonies, and family gatherings.",
      features: [
        "All Edited Event Pictures",
        "Highlight Film (2 Mins)",
        "Full Edited Video",
        "Flash Drive",
        "Extra crew Members option",
        "Terms and conditions applied"
      ]
    },
    {
      name: "Funeral-3D Diamond",
      price: 6900,
      priceLabel: "GH₵6,900",
      duration: "Three Days Coverage",
      popular: true,
      subtitle: "Enhanced sound-monitored three days coverage containing family premium photobooks and portrait pictures.",
      features: [
        "All Edited Event Pictures",
        "Highlight Film (2 Mins)",
        "Full Edited Video",
        "Neatly Recorded Sound",
        "Premium PhotoBook",
        "12 Exclusive couple Pictures",
        "Flash Drive",
        "Extra crew Members option",
        "Terms and conditions applied"
      ]
    },
    {
      name: "Funeral-3D Classic",
      price: 8900,
      priceLabel: "GH₵8,900",
      duration: "Three Days Coverage",
      popular: false,
      subtitle: "Complete non-compromise multi-angle cinematic production covering all three days of events in detail.",
      features: [
        "All Edited Event Pictures",
        "Cinematic Video Highlight (3-4 Mins)",
        "Neatly Recorded Sound",
        "Drone coverage",
        "Premium PhotoBook",
        "Full Edited Video",
        "Cloud Storage (Lifetime Access)",
        "Extra crew Members option",
        "Terms and conditions applied"
      ]
    }
  ],
  corporate: [
    {
      name: "Corporate Photo Only",
      price: 1000,
      priceLabel: "GH₵1,000",
      duration: "One Day Coverage",
      popular: false,
      subtitle: "Professional high-resolution photography coverage for single-day corporate meetings, brand activations, and conferences.",
      features: [
        "All Edited Corporate Pictures",
        "High-Resolution Digital Delivery",
        "Professional Editing & Color Grading",
        "1 Senior Photographer Team",
        "Full commercial usage rights",
        "Terms and conditions applied"
      ]
    },
    {
      name: "Corporate Photo & Video Standard",
      price: 2000,
      priceLabel: "GH₵2,000",
      duration: "One Day Coverage",
      popular: true,
      subtitle: "Our signature single-day business production package including professional high-fidelity sound, photography and video coverage.",
      features: [
        "All Edited Corporate Pictures",
        "High-definition Video Highlight Film",
        "Full Event Video Coverage",
        "Recorded Sound / Clip Mic Capture",
        "1 Senior Photographer",
        "1 Senior Videographer",
        "Full commercial usage rights",
        "Terms and conditions applied"
      ]
    },
    {
      name: "Corporate Photo & Video Deluxe",
      price: 2500,
      priceLabel: "GH₵2,500",
      duration: "One Day Coverage",
      popular: false,
      subtitle: "Ultra comprehensive business event production with multi-camera angles and expanded crew capacity for maximum coverage.",
      features: [
        "All Edited Corporate Pictures",
        "Enhanced Video Highlight Film",
        "Full Comprehensive Video Documentation",
        "Multi-angle Audio Recording",
        "1 Senior Photographer",
        "2 Senior Videographers",
        "Full commercial usage rights",
        "Terms and conditions applied"
      ]
    }
  ],
  corporate_2d: [
    {
      name: "Corporate-2D Photo Only",
      price: 1800,
      priceLabel: "GH₵1,800",
      duration: "Two Days Coverage",
      popular: false,
      subtitle: "Two-day professional photography covering entire corporate forums, summits, or promotional activations.",
      features: [
        "All Edited Corporate Pictures",
        "High-Resolution Digital Delivery",
        "Professional Editing & Color Grading",
        "1 Senior Photographer Team",
        "Full commercial usage rights",
        "Terms and conditions applied"
      ]
    },
    {
      name: "Corporate-2D Photo & Video Standard",
      price: 2900,
      priceLabel: "GH₵2,900",
      duration: "Two Days Coverage",
      popular: true,
      subtitle: "Complete multi-media coverage over both consecutive event days for balanced photo and video documentation.",
      features: [
        "All Edited Corporate Pictures",
        "High-definition Video Highlight Film",
        "Full Event Video Coverage",
        "Recorded Sound / Clip Mic Capture",
        "1 Senior Photographer",
        "1 Senior Videographer",
        "Full commercial usage rights",
        "Terms and conditions applied"
      ]
    },
    {
      name: "Corporate-2D Photo & Video Deluxe",
      price: 3900,
      priceLabel: "GH₵3,900",
      duration: "Two Days Coverage",
      popular: false,
      subtitle: "Borders corporate scale coverage over two full days with a high-capacity media team and flawless execution.",
      features: [
        "All Edited Corporate Pictures",
        "Premium Video Highlight Film",
        "Full Event Video Coverage & Raw Files Access",
        "Multi-angle Audio Recording",
        "1 Senior Photographer",
        "2 Senior Videographers",
        "Full commercial usage rights",
        "Terms and conditions applied"
      ]
    }
  ]
};

const currencies = [
  { code: "GHS", symbol: "GH₵", rate: 1.0 },
  { code: "USD", symbol: "$", rate: 1 / 14.50 },
  { code: "NGN", symbol: "₦", rate: 105.0 },
  { code: "GBP", symbol: "£", rate: 0.054 }
];

export default function PricingPage() {
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0]);
  
  // Category Tab state
  const [activeCategory, setActiveCategory] = useState<"studio" | "outdoor" | "wedding1" | "wedding2" | "kids_studio" | "kids_outdoor" | "funeral" | "funeral_2d" | "funeral_3d" | "corporate" | "corporate_2d">("studio");
  
  // Dynamic Calculator states
  const [baseTier, setBaseTier] = useState(categories.studio[1]); // Default to popular
  const [extraHours, setExtraHours] = useState(0); // $200 / hr
  const [extraPrints, setExtraPrints] = useState(0); // $50 / print
  const [includeStylist, setIncludeStylist] = useState(false); // $450 flat
  const [includeFrame, setIncludeFrame] = useState(false); // $300 flat

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Compute total estimate (in GHS base)
  const calcBasePrice = baseTier.price;
  const calcHoursPrice = extraHours * 150; // GH₵150 / hr
  const calcPrintsPrice = extraPrints * 30; // GH₵30 / print
  const calcStylistPrice = includeStylist ? 200 : 0; // GH₵200 flat
  const calcFramePrice = includeFrame ? 150 : 0; // GH₵150 flat

  const totalGHS = calcBasePrice + calcHoursPrice + calcPrintsPrice + calcStylistPrice + calcFramePrice;
  const convertedTotal = (totalGHS * selectedCurrency.rate).toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <div className="min-h-screen bg-luxury-black text-white pt-28 pb-20 relative overflow-hidden">
      
      {/* Dynamic ambient vector details */}
      <div className="absolute top-1/4 right-0 w-80 h-80 bg-luxury-gold/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-luxury-gold/3 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 sm:px-12 relative z-10">
        
        {/* Header Hero Title */}
        <div className="max-w-4xl mx-auto text-center mb-16 space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-full text-[9px] uppercase tracking-[0.2em] text-[#d4af37] font-mono"
          >
            <Calculator className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Legacy Development Investments</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl font-display text-white"
          >
            Aesthetic <span className="italic font-serif text-[#d4af37]">Investments</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-sm text-white/50 max-w-xl mx-auto font-sans leading-relaxed"
          >
            A genuine photographic capsule is a permanent investment in family heritage and creative legacy. Review our modular plans or estimate a bespoke package below.
          </motion.p>
        </div>

        {/* Category & Currency filter controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          {/* Studio vs Outdoor Category Switcher */}
          <div className="flex flex-wrap justify-center items-center gap-1.5 p-1 bg-black/60 border border-white/5 rounded-2xl font-mono text-[10px] uppercase font-bold tracking-wider">
            <button
              onClick={() => {
                setActiveCategory("studio");
                setBaseTier(categories.studio[1]);
              }}
              className={`px-5 py-2 rounded-xl cursor-pointer transition-all ${
                activeCategory === "studio"
                  ? "bg-[#d4af37] text-black font-extrabold shadow-lg"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Studio Sessions
            </button>
            <button
              onClick={() => {
                setActiveCategory("outdoor");
                setBaseTier(categories.outdoor[1]);
              }}
              className={`px-5 py-2 rounded-xl cursor-pointer transition-all ${
                activeCategory === "outdoor"
                  ? "bg-[#d4af37] text-black font-extrabold shadow-lg"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Outdoor Sessions
            </button>
            <button
              onClick={() => {
                setActiveCategory("wedding1");
                setBaseTier(categories.wedding1[1]);
              }}
              className={`px-5 py-2 rounded-xl cursor-pointer transition-all ${
                activeCategory === "wedding1"
                  ? "bg-[#d4af37] text-black font-extrabold shadow-lg"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Wedding (1-Day)
            </button>
            <button
              onClick={() => {
                setActiveCategory("wedding2");
                setBaseTier(categories.wedding2[1]);
              }}
              className={`px-5 py-2 rounded-xl cursor-pointer transition-all ${
                activeCategory === "wedding2"
                  ? "bg-[#d4af37] text-black font-extrabold shadow-lg"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Wedding (2-Day)
            </button>
            <button
              onClick={() => {
                setActiveCategory("kids_studio");
                setBaseTier(categories.kids_studio[1]);
              }}
              className={`px-5 py-2 rounded-xl cursor-pointer transition-all ${
                activeCategory === "kids_studio"
                  ? "bg-[#d4af37] text-black font-extrabold shadow-lg"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Kids Studio
            </button>
            <button
              onClick={() => {
                setActiveCategory("kids_outdoor");
                setBaseTier(categories.kids_outdoor[1]);
              }}
              className={`px-5 py-2 rounded-xl cursor-pointer transition-all ${
                activeCategory === "kids_outdoor"
                  ? "bg-[#d4af37] text-black font-extrabold shadow-lg"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Kids Outdoor
            </button>
            <button
              onClick={() => {
                setActiveCategory("funeral");
                setBaseTier(categories.funeral[1]);
              }}
              className={`px-5 py-2 rounded-xl cursor-pointer transition-all ${
                activeCategory === "funeral"
                  ? "bg-[#d4af37] text-black font-extrabold shadow-lg"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Funeral (1-Day)
            </button>
            <button
              onClick={() => {
                setActiveCategory("funeral_2d");
                setBaseTier(categories.funeral_2d[1]);
              }}
              className={`px-5 py-2 rounded-xl cursor-pointer transition-all ${
                activeCategory === "funeral_2d"
                  ? "bg-[#d4af37] text-black font-extrabold shadow-lg"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Funeral (2-Day)
            </button>
            <button
              onClick={() => {
                setActiveCategory("funeral_3d");
                setBaseTier(categories.funeral_3d[1]);
              }}
              className={`px-5 py-2 rounded-xl cursor-pointer transition-all ${
                activeCategory === "funeral_3d"
                  ? "bg-[#d4af37] text-black font-extrabold shadow-lg"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Funeral (3-Day)
            </button>
            <button
              onClick={() => {
                setActiveCategory("corporate");
                setBaseTier(categories.corporate[1]);
              }}
              className={`px-5 py-2 rounded-xl cursor-pointer transition-all ${
                activeCategory === "corporate"
                  ? "bg-[#d4af37] text-black font-extrabold shadow-lg"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Corporate (1-Day)
            </button>
            <button
              onClick={() => {
                setActiveCategory("corporate_2d");
                setBaseTier(categories.corporate_2d[1]);
              }}
              className={`px-5 py-2 rounded-xl cursor-pointer transition-all ${
                activeCategory === "corporate_2d"
                  ? "bg-[#d4af37] text-black font-extrabold shadow-lg"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Corporate (2-Day)
            </button>
          </div>

          {/* Currency Switch Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-black/60 border border-white/5 rounded-full font-mono text-[9px] font-bold uppercase tracking-widest text-white/50">
            {currencies.map(curr => (
              <button
                key={curr.code}
                onClick={() => setSelectedCurrency(curr)}
                className={`px-4 py-1.5 rounded-full cursor-pointer transition-all ${
                  selectedCurrency.code === curr.code
                    ? "bg-[#d4af37] text-black font-extrabold"
                    : "hover:text-white"
                }`}
              >
                {curr.code} ({curr.symbol})
              </button>
            ))}
          </div>
        </div>

        {/* Three Pillars Pricing comparison cards */}
        <div key={activeCategory} className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {categories[activeCategory].map((tier) => {
            const convertedPrice = (tier.price * selectedCurrency.rate).toLocaleString(undefined, { maximumFractionDigits: 0 });
            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className={`relative rounded-3xl p-8 border flex flex-col justify-between hover:scale-101 transition-all duration-300 ${
                  tier.popular 
                    ? "bg-gradient-to-b from-white/[0.04] to-black border-[#d4af37]/60 shadow-2xl" 
                    : "bg-white/[0.01]/10 border-white/5"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#d4af37] text-black text-[9px] uppercase tracking-widest font-extrabold rounded-full shadow-lg">
                    Most Popular Choice
                  </div>
                )}

                <div className="space-y-6">
                  {/* Name & Subtitle */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-[#d4af37] uppercase tracking-[0.2em] font-bold block">
                      {tier.duration}
                    </span>
                    <h3 className="text-xl font-serif text-white font-bold">{tier.name}</h3>
                    <p className="text-xs text-white/40 leading-relaxed min-h-[40px] font-sans">
                      {tier.subtitle}
                    </p>
                  </div>

                  {/* Price info */}
                  <div className="py-4 border-y border-white/5 flex items-baseline gap-1.5">
                    <span className="text-4xl font-serif text-white font-bold">{selectedCurrency.symbol}{convertedPrice}</span>
                    <span className="text-[11px] font-mono text-white/30 uppercase">Base Retainer</span>
                  </div>

                  {/* Features list */}
                  <div className="space-y-3 pt-2">
                    <span className="text-[9px] uppercase font-mono tracking-widest text-white/40 block">
                      Featured package assets:
                    </span>
                    <ul className="space-y-3.5 text-xs text-white/70">
                      {tier.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5 leading-tight">
                          <Check className="w-3.5 h-3.5 text-[#d4af37] shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Direct Action */}
                <div className="pt-8">
                  <Link to={`/book?service=${encodeURIComponent(tier.name)}`}>
                    <button
                      className={`w-full py-3.5 rounded-xl uppercase font-mono font-bold text-[10px] tracking-widest cursor-pointer transition-all ${
                        tier.popular
                          ? "bg-[#d4af37] hover:bg-[#d4af37]/90 text-black shadow-xl"
                          : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                      }`}
                    >
                      Choose {tier.name.split(" ")[0]} Package
                    </button>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Investment Estimator Interactive Calculator */}
        <div className="max-w-4xl mx-auto mb-20 bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/3 blur-xl rounded-full" />
          
          <div className="space-y-10 relative z-10">
            <div className="text-center space-y-2">
              <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-[#d4af37]">Interactive Studio Assistant</span>
              <h2 className="text-2xl sm:text-3xl font-serif">Bespoke Heritage <span className="italic font-serif text-[#d4af37]">Estimator</span></h2>
              <p className="text-xs text-white/45 max-w-sm mx-auto leading-relaxed">
                Add selective studio capabilities in real-time to preview a budget estimate tailored seamlessly to your custom commission details.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start font-mono text-xs">
              
              {/* Estimator Configuration form parameters */}
              <div className="space-y-6 bg-white/[0.01] p-6 rounded-2xl border border-white/5 font-mono">
                
                {/* Select Base Tier */}
                <div className="space-y-4">
                  <label className="text-[#d4af37] text-[9px] uppercase tracking-wider block font-bold">1. Base Service Foundation</label>
                  
                  <div className="space-y-2">
                    <span className="text-[8px] uppercase tracking-widest text-white/30 block">Studio Foundations</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {categories.studio.map(t => (
                        <button
                          key={t.name}
                          type="button"
                          onClick={() => setBaseTier(t)}
                          className={`p-2 rounded-lg border text-[9px] text-center font-bold tracking-tight cursor-pointer transition-all ${
                            baseTier.name === t.name
                              ? "bg-[#d4af37]/10 border-[#d4af37] text-[#d4af37]"
                              : "bg-black/40 border-white/5 text-white/50 hover:text-white"
                          }`}
                        >
                          {t.name.split(" ")[1]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[8px] uppercase tracking-widest text-white/30 block">Outdoor Foundations</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {categories.outdoor.map(t => (
                        <button
                          key={t.name}
                          type="button"
                          onClick={() => setBaseTier(t)}
                          className={`p-2 rounded-lg border text-[9px] text-center font-bold tracking-tight cursor-pointer transition-all ${
                            baseTier.name === t.name
                              ? "bg-[#d4af37]/10 border-[#d4af37] text-[#d4af37]"
                              : "bg-black/40 border-white/5 text-white/50 hover:text-white"
                          }`}
                        >
                          {t.name.split(" ")[1]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[8px] uppercase tracking-widest text-white/30 block">Wedding 1-Day Foundations</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {categories.wedding1.map(t => (
                        <button
                          key={t.name}
                          type="button"
                          onClick={() => setBaseTier(t)}
                          className={`p-2 rounded-lg border text-[9px] text-center font-bold tracking-tight cursor-pointer transition-all ${
                            baseTier.name === t.name
                              ? "bg-[#d4af37]/10 border-[#d4af37] text-[#d4af37]"
                              : "bg-black/40 border-white/5 text-white/50 hover:text-white"
                          }`}
                        >
                          {t.name.split(" ")[1]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[8px] uppercase tracking-widest text-white/30 block">Wedding 2-Day Foundations</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {categories.wedding2.map(t => (
                        <button
                          key={t.name}
                          type="button"
                          onClick={() => setBaseTier(t)}
                          className={`p-2 rounded-lg border text-[9px] text-center font-bold tracking-tight cursor-pointer transition-all ${
                            baseTier.name === t.name
                              ? "bg-[#d4af37]/10 border-[#d4af37] text-[#d4af37]"
                              : "bg-black/40 border-white/5 text-white/50 hover:text-white"
                          }`}
                        >
                          {t.name.split(" ")[1]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[8px] uppercase tracking-widest text-white/30 block">Kids Studio Foundations</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {categories.kids_studio.map(t => (
                        <button
                          key={t.name}
                          type="button"
                          onClick={() => setBaseTier(t)}
                          className={`p-2 rounded-lg border text-[9px] text-center font-bold tracking-tight cursor-pointer transition-all ${
                            baseTier.name === t.name
                              ? "bg-[#d4af37]/10 border-[#d4af37] text-[#d4af37]"
                              : "bg-black/40 border-white/5 text-white/50 hover:text-white"
                          }`}
                        >
                          {t.name.split(" ")[1]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[8px] uppercase tracking-widest text-white/30 block">Kids Outdoor Foundations</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {categories.kids_outdoor.map(t => (
                        <button
                          key={t.name}
                          type="button"
                          onClick={() => setBaseTier(t)}
                          className={`p-2 rounded-lg border text-[9px] text-center font-bold tracking-tight cursor-pointer transition-all ${
                            baseTier.name === t.name
                              ? "bg-[#d4af37]/10 border-[#d4af37] text-[#d4af37]"
                              : "bg-black/40 border-white/5 text-white/50 hover:text-white"
                          }`}
                        >
                          {t.name.split(" ")[1]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[8px] uppercase tracking-widest text-white/30 block">Funeral 1-Day Foundations</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {categories.funeral.map(t => (
                        <button
                          key={t.name}
                          type="button"
                          onClick={() => setBaseTier(t)}
                          className={`p-2 rounded-lg border text-[9px] text-center font-bold tracking-tight cursor-pointer transition-all ${
                            baseTier.name === t.name
                              ? "bg-[#d4af37]/10 border-[#d4af37] text-[#d4af37]"
                              : "bg-black/40 border-white/5 text-white/50 hover:text-white"
                          }`}
                        >
                          {t.name.split(" ")[1]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[8px] uppercase tracking-widest text-white/30 block">Funeral 2-Day Foundations</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {categories.funeral_2d.map(t => (
                        <button
                          key={t.name}
                          type="button"
                          onClick={() => setBaseTier(t)}
                          className={`p-2 rounded-lg border text-[9px] text-center font-bold tracking-tight cursor-pointer transition-all ${
                            baseTier.name === t.name
                              ? "bg-[#d4af37]/10 border-[#d4af37] text-[#d4af37]"
                              : "bg-black/40 border-white/5 text-white/50 hover:text-white"
                          }`}
                        >
                          {t.name.split(" ")[1]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[8px] uppercase tracking-widest text-white/30 block">Funeral 3-Day Foundations</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {categories.funeral_3d.map(t => (
                        <button
                          key={t.name}
                          type="button"
                          onClick={() => setBaseTier(t)}
                          className={`p-2 rounded-lg border text-[9px] text-center font-bold tracking-tight cursor-pointer transition-all ${
                            baseTier.name === t.name
                              ? "bg-[#d4af37]/10 border-[#d4af37] text-[#d4af37]"
                              : "bg-black/40 border-white/5 text-white/50 hover:text-white"
                          }`}
                        >
                          {t.name.split(" ")[1]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[8px] uppercase tracking-widest text-white/30 block">Corporate 1-Day Foundations</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {categories.corporate.map(t => (
                        <button
                          key={t.name}
                          type="button"
                          onClick={() => setBaseTier(t)}
                          className={`p-2 rounded-lg border text-[9px] text-center font-bold tracking-tight cursor-pointer transition-all ${
                            baseTier.name === t.name
                              ? "bg-[#d4af37]/10 border-[#d4af37] text-[#d4af37]"
                              : "bg-black/40 border-white/5 text-white/50 hover:text-white"
                          }`}
                        >
                          {t.name.replace("Corporate-2D ", "").replace("Corporate ", "")}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[8px] uppercase tracking-widest text-white/30 block">Corporate 2-Day Foundations</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {categories.corporate_2d.map(t => (
                        <button
                          key={t.name}
                          type="button"
                          onClick={() => setBaseTier(t)}
                          className={`p-2 rounded-lg border text-[9px] text-center font-bold tracking-tight cursor-pointer transition-all ${
                            baseTier.name === t.name
                              ? "bg-[#d4af37]/10 border-[#d4af37] text-[#d4af37]"
                              : "bg-black/40 border-white/5 text-white/50 hover:text-white"
                          }`}
                        >
                          {t.name.replace("Corporate-2D ", "").replace("Corporate ", "")}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Select Extra Hours */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-bold">
                    <label className="text-[#d4af37] uppercase tracking-wider block">2. Extra Studio Shoot Hours</label>
                    <span className="text-white/45">(+{selectedCurrency.symbol}{(150 * selectedCurrency.rate).toFixed(0)} / hr)</span>
                  </div>
                  <div className="flex items-center gap-4 bg-black/60 p-1.5 border border-white/5 rounded-xl">
                    <button 
                      onClick={() => setExtraHours(Math.max(0, extraHours - 1))}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 font-bold active:scale-95 transition-all cursor-pointer flex items-center justify-center text-sm"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-bold text-white">{extraHours} Hour{extraHours !== 1 ? 's' : ''}</span>
                    <button 
                      onClick={() => setExtraHours(Math.min(10, extraHours + 1))}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 font-bold active:scale-95 transition-all cursor-pointer flex items-center justify-center text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Extra Retouched Fine Art Prints */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-bold">
                    <label className="text-[#d4af37] uppercase tracking-wider block">3. Extra Fine Art Prints</label>
                    <span className="text-white/45">(+{selectedCurrency.symbol}{(30 * selectedCurrency.rate).toFixed(0)} / print)</span>
                  </div>
                  <div className="flex items-center gap-4 bg-black/60 p-1.5 border border-white/5 rounded-xl">
                    <button 
                      onClick={() => setExtraPrints(Math.max(0, extraPrints - 1))}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 font-bold active:scale-95 transition-all cursor-pointer flex items-center justify-center text-sm"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-bold text-white">{extraPrints} Print{extraPrints !== 1 ? 's' : ''}</span>
                    <button 
                      onClick={() => setExtraPrints(Math.min(50, extraPrints + 1))}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 font-bold active:scale-95 transition-all cursor-pointer flex items-center justify-center text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Checkboxes addons */}
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <span className="text-[9px] uppercase text-[#d4af37] font-bold tracking-widest block mb-1">
                    4. Professional Production Add-ons
                  </span>
                  
                  {/* Outfit / Makeup Stylist Crew */}
                  <label className="flex items-center gap-3 cursor-pointer group text-[10px]">
                    <input 
                      type="checkbox"
                      checked={includeStylist}
                      onChange={(e) => setIncludeStylist(e.target.checked)}
                      className="w-4 h-4 rounded border-white/10 bg-black text-[#d4af37] checked:bg-[#d4af37]"
                    />
                    <div className="flex-1">
                      <span className="text-white group-hover:text-white transition-colors block">Add Styling & Makeup Team</span>
                      <span className="text-white/30 text-[9px] block">+{selectedCurrency.symbol}{(200 * selectedCurrency.rate).toLocaleString(undefined, { maximumFractionDigits: 0 })} flat professional salon services on site.</span>
                    </div>
                  </label>

                  {/* Museum custom framing option */}
                  <label className="flex items-center gap-3 cursor-pointer group text-[10px] pt-1">
                    <input 
                      type="checkbox"
                      checked={includeFrame}
                      onChange={(e) => setIncludeFrame(e.target.checked)}
                      className="w-4 h-4 rounded border-white/10 bg-black text-[#d4af37]"
                    />
                    <div className="flex-1">
                      <span className="text-white group-hover:text-white transition-colors block">Premium Exhibition Custom Framing</span>
                      <span className="text-white/30 text-[9px] block">+{selectedCurrency.symbol}{(150 * selectedCurrency.rate).toLocaleString(undefined, { maximumFractionDigits: 0 })} museum anti-acid framing overlay.</span>
                    </div>
                  </label>
                </div>

              </div>

              {/* Estimate Preview Column */}
              <div className="bg-black/60 border border-[#d4af37]/20 p-8 rounded-2xl flex flex-col justify-between h-full space-y-8 font-mono text-center sm:text-left">
                
                <div className="space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37] block">Inception Blueprint Summary</span>
                  <div className="space-y-2 border-b border-white/5 pb-4 text-[11px] text-white/60 text-left">
                    <div className="flex justify-between">
                      <span>Base Retainer:</span>
                      <span className="text-white font-bold">{selectedCurrency.symbol}{(baseTier.price * selectedCurrency.rate).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    {extraHours > 0 && (
                      <div className="flex justify-between">
                        <span>Extra Time ({extraHours} hrs):</span>
                        <span className="text-white font-bold">+{selectedCurrency.symbol}{(calcHoursPrice * selectedCurrency.rate).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                    )}
                    {extraPrints > 0 && (
                      <div className="flex justify-between">
                        <span>Extra Prints ({extraPrints}):</span>
                        <span className="text-white font-bold">+{selectedCurrency.symbol}{(calcPrintsPrice * selectedCurrency.rate).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                    )}
                    {includeStylist && (
                      <div className="flex justify-between">
                        <span>On-site Salon Stylists:</span>
                        <span className="text-white font-bold">+{selectedCurrency.symbol}{(calcStylistPrice * selectedCurrency.rate).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                    )}
                    {includeFrame && (
                      <div className="flex justify-between">
                        <span>Acid-free Custom Frame:</span>
                        <span className="text-white font-bold">+{selectedCurrency.symbol}{(calcFramePrice * selectedCurrency.rate).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 text-left pt-2">
                    <span className="text-[10px] text-[#d4af37] uppercase font-bold tracking-widest block">Estimated Total</span>
                    <p className="text-3xl font-serif text-white font-bold">
                      {selectedCurrency.symbol}{convertedTotal}
                    </p>
                    <span className="text-[9px] text-white/30 italic block leading-snug">
                      Rates vary securely matching bespoke location complexity.
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link to={`/book?service=${encodeURIComponent(baseTier.name)}`}>
                    <button className="w-full py-4 bg-[#d4af37] text-black font-extrabold uppercase text-[10px] tracking-widest rounded-xl hover:bg-opacity-95 cursor-pointer shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                      <span>Inquire Design & Book Slots</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </Link>
                  <p className="text-[9px] text-center text-white/30 leading-normal">
                    Estimate holds for session booking within the next 45 days.
                  </p>
                </div>

              </div>

            </div>
          </div>
        </div>

        {/* Studio terms of service guidelines */}
        <div className="max-w-4xl mx-auto border-t border-white/5 pt-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs leading-relaxed text-white/40 font-mono">
            <div className="space-y-3">
              <h4 className="text-[#d4af37] font-bold uppercase tracking-wider text-[10px]">Travel & Destination Terms</h4>
              <p>
                Our standard packages include full coverage for locations within a 50-mile radius of our heritage studio. Destination options in other countries carry customized global travel, boarding guidelines, and scheduling arrangements handled collaboratively online.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="text-[#d4af37] font-bold uppercase tracking-wider text-[10px]">Intellectual Property</h4>
              <p>
                All digital images include personal/commercial promotion exhibition license privileges. Exclusive copyright buyouts are also available for major corporate and record labels on request during consultation phases.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
