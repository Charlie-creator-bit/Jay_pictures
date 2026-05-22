import { motion } from "motion/react";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  id?: string;
  hover?: boolean;
  key?: string | number;
  title?: string;
  onClick?: () => void;
}

export default function GlassCard({ children, className = "", id, hover = true, title, onClick }: GlassCardProps) {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      whileHover={hover ? { y: -10, transition: { duration: 0.3 } } : {}}
      onClick={onClick}
      className={`glass-dark p-8 rounded-2xl ${className}`}
    >
      {children}
    </motion.div>
  );
}
