import React, { useState } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { 
  Camera, 
  Mail, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Send 
} from "lucide-react";
import Button from "../components/ui/Button";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!email.trim()) {
        throw new Error("Please enter your registered email address.");
      }
      
      // Branded email pipeline via custom backend
      const response = await fetch("/api/notifications/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed using default recovery channel.");
      }
      
      setIsSent(true);
    } catch (err: any) {
      console.error("Recovery error:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-luxury-black px-6 py-12 relative overflow-hidden">
      {" "}
      {/* Decorative Gold Glow Ambient Light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-luxury-gold/5 blur-[100px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group transition-colors">
            <Camera className="w-8 h-8 text-luxury-gold group-hover:scale-105 transition-transform" />
            <span className="text-2xl font-serif tracking-tighter text-luxury-gold">JAY PICTURES</span>
          </Link>
          <h2 className="text-3xl font-display text-white">Reset Account Access</h2>
          <p className="text-white/40 mt-2 text-sm">Enter your registered email below to receive a password reset link</p>
        </div>

        {isSent ? (
          <div className="space-y-6">
            <div className="text-center p-8 glass-dark rounded-2xl border border-white/5">
              <CheckCircle className="w-16 h-16 text-luxury-gold mx-auto mb-6 animate-pulse" />
              <h3 className="text-2xl font-serif mb-4">Verification Sent</h3>
              <p className="text-white/60 text-sm mb-6 leading-relaxed">
                We've successfully dispatched account recovery details to <span className="text-luxury-gold font-bold">{email}</span>. Click the link inside to set a secure password.
              </p>
              <Link 
                to="/login" 
                className="inline-flex items-center gap-2 text-luxury-gold font-bold uppercase tracking-widest text-xs hover:underline decoration-luxury-gold/50"
              >
                <ArrowLeft className="w-4 h-4" /> Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-500 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="leading-tight">{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-luxury-gold mb-2">Registered Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-luxury-gold transition-colors text-sm"
                    placeholder="studio@example.com"
                    required
                  />
                </div>
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full py-4 text-xs font-bold uppercase tracking-widest mt-2 flex items-center justify-center gap-2">
              {isLoading ? (
                "Processing Query..."
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Send Recovery Link
                </>
              )}
            </Button>

            <Link 
              to="/login" 
              className="flex items-center justify-center gap-2 text-white/40 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest pt-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>
          </form>
        )}
      </motion.div>
    </div>
  );
}
