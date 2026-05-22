import { motion } from "motion/react";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Elena Rossi",
    role: "Fashion Designer",
    content: "Jay doesn't just take photos; he captures the soul of the collection. The cinematic depth in every frame is unparalleled.",
  },
  {
    name: "Marcus Thorne",
    role: "Collector",
    content: "I've worked with many studios, but the level of fine art direction here is on another level. Truly a luxury experience.",
  },
  {
    name: "Sophie Chen",
    role: "Creative Director",
    content: "The attention to lighting and texture is breathtaking. They understood our brand narrative and elevated it beyond expectations.",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 border-b border-white/5">
      <div className="container mx-auto px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            <div className="text-[10px] uppercase tracking-[0.2em] mb-4 text-luxury-gold">Voices</div>
          </div>
          <div className="md:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {testimonials.map((t, i) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.2 }}
                  className="flex flex-col justify-center"
                >
                  <p className="text-sm italic font-serif leading-relaxed mb-6 opacity-80">
                    "{t.content}"
                  </p>
                  <span className="text-[9px] uppercase tracking-widest font-bold text-luxury-gold">
                    — {t.name}, {t.role}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
