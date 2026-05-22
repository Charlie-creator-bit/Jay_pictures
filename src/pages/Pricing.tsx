import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Check, HelpCircle, Sparkles, DollarSign, Calculator, ChevronRight, Info, Award, 
  Layers, Camera, Image as ImageIcon, Shirt, RefreshCw
} from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button.tsx";

const tiers = [
  {
    name: "Editorial Heritage",
    price: 1500,
    priceLabel: "$1,500+",
    duration: "4 Hour Session",
    popular: false,
    subtitle: "Ideal for artists, editorial essays, and high-quality portraits.",
    features: [
      "Dedicated Creative Art Direction",
      "Rembrandt and Classic Studio Setups",
      "Up to 3 distinct outfit changes",
      "10 High-End Retouched master files",
      "Private password-secured online gallery",
      "Premium digital delivery (uncompressed TIFF)",
      "Standard Commercial Usage License"
    ]
  },
  {
    name: "Cinematic Narrative",
    price: 3500,
    priceLabel: "$3,500+",
    duration: "Full Day Location Shoot",
    popular: true,
    subtitle: "Our signature production capturing cinematic motion & brand stories.",
    features: [
      "All-day location multi-scene setup",
      "Full on-site Styling and Makeup Team",
      "25 Master-Retouched physical prints",
      "Premium 60s Cinematic BTS Motion Film",
      "Hand-bound Archival Gallery Photo Album",
      "Extended Commercial Exhibition License",
      "Unlimited digital proofs of original captures"
    ]
  },
  {
    name: "Curated Exhibition",
    price: 7500,
    priceLabel: "$7,500+",
    duration: "Multi-Day Assignment",
    popular: false,
    subtitle: "The absolute pinnacle of high-end photography and book collections.",
    features: [
      "Multi-day national/international travel",
      "Complete photography production crew",
      "Unlimited master-retouched visual files",
      "Exquisite Italian leather-bound print album",
      "Personal public physical exhibition design assistance",
      "Full Buyout Corporate Usage License",
      "Dedicated premium darkroom developer consultant"
    ]
  }
];

const currencies = [
  { code: "USD", symbol: "$", rate: 1.0 },
  { code: "GHS", symbol: "GH₵", rate: 14.50 },
  { code: "NGN", symbol: "₦", rate: 1400.0 },
  { code: "GBP", symbol: "£", rate: 0.79 }
];

export default function PricingPage() {
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0]);
  
  // Dynamic Calculator states
  const [baseTier, setBaseTier] = useState(tiers[1]); // Default to popular
  const [extraHours, setExtraHours] = useState(0); // $200 / hr
  const [extraPrints, setExtraPrints] = useState(0); // $50 / print
  const [includeStylist, setIncludeStylist] = useState(false); // $450 flat
  const [includeFrame, setIncludeFrame] = useState(false); // $300 flat

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Compute total estimate
  const calcBasePrice = baseTier.price;
  const calcHoursPrice = extraHours * 200;
  const calcPrintsPrice = extraPrints * 50;
  const calcStylistPrice = includeStylist ? 450 : 0;
  const calcFramePrice = includeFrame ? 300 : 0;

  const totalUSD = calcBasePrice + calcHoursPrice + calcPrintsPrice + calcStylistPrice + calcFramePrice;
  const convertedTotal = (totalUSD * selectedCurrency.rate).toLocaleString(undefined, { maximumFractionDigits: 0 });

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

        {/* Currency Switch Selector */}
        <div className="flex justify-center mb-10">
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
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {tiers.map((tier) => {
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
                <div className="space-y-2">
                  <label className="text-[#d4af37] text-[9px] uppercase tracking-wider block font-bold">1. Base Service Foundation</label>
                  <div className="grid grid-cols-3 gap-2">
                    {tiers.map(t => (
                      <button
                        key={t.name}
                        onClick={() => setBaseTier(t)}
                        className={`p-2.5 rounded-lg border text-[9px] text-center font-bold tracking-tight cursor-pointer transition-all ${
                          baseTier.name === t.name
                            ? "bg-[#d4af37]/10 border-[#d4af37] text-[#d4af37]"
                            : "bg-black/40 border-white/5 text-white/50 hover:text-white"
                        }`}
                      >
                        {t.name.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Select Extra Hours */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-bold">
                    <label className="text-[#d4af37] uppercase tracking-wider block">2. Extra Studio Shoot Hours</label>
                    <span className="text-white/45">(+$200 / hr)</span>
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
                    <span className="text-white/45">(+$50 / print)</span>
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
                      <span className="text-white/30 text-[9px] block">+$450 flat professional salon services on site.</span>
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
                      <span className="text-white/30 text-[9px] block">+$300 museum anti-acid framing overlay.</span>
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
                      <span className="text-white font-bold">${baseTier.price.toLocaleString()}</span>
                    </div>
                    {extraHours > 0 && (
                      <div className="flex justify-between">
                        <span>Extra Time ({extraHours} hrs):</span>
                        <span className="text-white font-bold">+${calcHoursPrice.toLocaleString()}</span>
                      </div>
                    )}
                    {extraPrints > 0 && (
                      <div className="flex justify-between">
                        <span>Extra Prints ({extraPrints}):</span>
                        <span className="text-white font-bold">+${calcPrintsPrice.toLocaleString()}</span>
                      </div>
                    )}
                    {includeStylist && (
                      <div className="flex justify-between">
                        <span>On-site Salon Stylists:</span>
                        <span className="text-white font-bold">+$450</span>
                      </div>
                    )}
                    {includeFrame && (
                      <div className="flex justify-between">
                        <span>Acid-free Custom Frame:</span>
                        <span className="text-white font-bold">+$300</span>
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
