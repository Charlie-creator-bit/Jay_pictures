import { useState } from "react";
import { motion } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../lib/firebase";
import { Link } from "react-router-dom";
import { Camera, Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import Button from "../components/ui/Button";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/notifications/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Branded pipeline reset failure.");
      }
      setIsSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-luxury-black px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Camera className="w-8 h-8 text-luxury-gold" />
            <span className="text-2xl font-serif tracking-tighter text-luxury-gold">JAY PICTURES</span>
          </Link>
          <h2 className="text-3xl font-display text-white">Reset Password</h2>
          <p className="text-white/40 mt-2">Enter your email to receive recovery link</p>
        </div>

        {isSent ? (
          <div className="text-center p-8 glass-dark rounded-2xl">
            <CheckCircle className="w-16 h-16 text-luxury-gold mx-auto mb-6" />
            <h3 className="text-2xl font-serif mb-4">Check your email</h3>
            <p className="text-white/40 mb-8 leading-relaxed">
              We've sent recovery instructions to your email address.
            </p>
            <Link to="/login" className="inline-flex items-center gap-2 text-luxury-gold font-bold uppercase tracking-widest text-xs hover:underline">
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-500 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-luxury-gold mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                <input
                  {...register("email")}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:border-luxury-gold transition-colors"
                  placeholder="studio@example.com"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <Button type="submit" disabled={isLoading} className="w-full py-4 text-xs font-bold uppercase tracking-widest mt-4">
              {isLoading ? "Sending Link..." : "Send Reset Link"}
            </Button>

            <Link to="/login" className="flex items-center justify-center gap-2 text-white/40 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>
          </form>
        )}
      </motion.div>
    </div>
  );
}
