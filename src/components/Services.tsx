import { motion } from "motion/react";
import { Camera, Image, Video, Palette } from "lucide-react";
import GlassCard from "./ui/GlassCard.tsx";

const services = [
  {
    icon: <Camera className="w-8 h-8" />,
    title: "Cinematic Portraits",
    description: "High-end portraiture focused on character and narrative depth using studio Rembrandt lighting techniques.",
  },
  {
    icon: <Palette className="w-8 h-8" />,
    title: "Fine Art Direction",
    description: "Tailored conceptual styling and set design to ensure every frame aligns with your creative vision.",
  },
  {
    icon: <Video className="w-8 h-8" />,
    title: "Fashion Films",
    description: "Moving visual narratives that capture the essence of movement and fabric in 8k cinematic resolution.",
  },
  {
    icon: <Image className="w-8 h-8" />,
    title: "Archival Printing",
    description: "Museum-grade giclée prints on fine art paper, ensuring your moments last for generations.",
  },
];

export default function Services() {
  return (
    <section id="services" className="py-24 border-b border-white/5">
      <div className="container mx-auto px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            <div className="text-[10px] uppercase tracking-[0.2em] mb-4 text-luxury-gold">Services</div>
            <h2 className="text-3xl md:text-4xl font-display mb-12">
              Our <span className="italic">Craft</span>
            </h2>
          </div>
          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
            {services.map((service) => (
              <div key={service.title} className="flex flex-col">
                <h3 className="text-lg font-serif mb-3 flex items-center gap-3">
                  <span className="text-luxury-gold flex-shrink-0">{service.icon}</span>
                  {service.title}
                </h3>
                <p className="text-sm leading-relaxed opacity-40 ml-11">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
