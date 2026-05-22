import { motion } from "motion/react";
import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "outline" | "ghost";
  className?: string;
  onClick?: () => void;
  id?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export default function Button({ children, variant = "primary", className = "", onClick, id, type = "button", disabled = false }: ButtonProps) {
  const baseStyles = "px-8 py-3 font-medium transition-all duration-300 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-white text-black hover:bg-luxury-gold hover:text-white",
    outline: "border border-white/20 text-white hover:border-luxury-gold hover:text-luxury-gold",
    ghost: "text-white/70 hover:text-white"
  };

  return (
    <motion.button
      id={id}
      type={type}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      <span className="relative z-10">{children}</span>
      {variant === "primary" && !disabled && (
        <div className="absolute inset-0 bg-luxury-gold translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
      )}
    </motion.button>
  );
}
