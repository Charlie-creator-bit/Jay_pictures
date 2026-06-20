import { motion } from "motion/react";
import { Check } from "lucide-react";
import Button from "./ui/Button.tsx";
import GlassCard from "./ui/GlassCard.tsx";
import { Link } from "react-router-dom";

const tiers = [
  {
    name: "Editorial",
    price: "1,500",
    features: [
      "4 Hour Studio Session",
      "Creative Art Direction",
      "10 High-End Retouched Images",
      "Private Online Gallery",
      "Commercial Usage License",
    ],
  },
  {
    name: "Cinematic",
    price: "3,500",
    popular: true,
    features: [
      "Full Day Location Shoot",
      "Full Styling Team",
      "25 Master-Retouched Prints",
      "Cinematic BTS Film",
      "Archival Photo Album",
    ],
  },
  {
    name: "Curated",
    price: "7,500",
    features: [
      "Multi-Day Destination Shoot",
      "Complete Production Team",
      "Unlimited Retouched Images",
      "Hand-crafted Leather Album",
      "Personal Exhibition Service",
    ],
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 border-b border-white/5 bg-white/[0.01]">
      <div className="container mx-auto px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            <div className="text-[10px] uppercase tracking-[0.2em] mb-4 text-luxury-gold">Investment</div>
          </div>
          <div className="md:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-12">
              <div className="flex flex-col justify-between">
                <div>
                  {tiers.slice(0, 2).map((tier) => (
                    <div key={tier.name} className="flex justify-between items-baseline border-b border-white/10 pb-3 mb-6">
                      <span className="text-xs uppercase tracking-widest">{tier.name}</span>
                      <span className="text-xl font-serif text-luxury-gold">GH₵{tier.price}+</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] uppercase opacity-30 leading-relaxed tracking-widest mt-8">
                  Bespoke commissions available upon inquiry. Local and destination travel rates applicable.
                </p>
              </div>
              <div className="flex flex-col gap-8">
                <p className="text-white/50 text-sm leading-relaxed italic border-l border-luxury-gold/30 pl-6 py-2">
                  "We believe photography is an investment in heritage. Each collection is tailored to preserve your legacy with cinematic precision."
                </p>
                <Link to="/book">
                  <Button variant="outline" className="w-fit text-[10px] tracking-widest uppercase">
                    Inquire / Book Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
