import { useState } from "react";
import { motion } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { handleFirestoreError, OperationType } from "../lib/firestore-error";
import { Link, useNavigate } from "react-router-dom";
import { Camera, Mail, Lock, User, AlertCircle } from "lucide-react";
import Button from "../components/ui/Button";

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "client"]),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "client" }
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setError(null);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      // Create user document in Firestore with role
      try {
        await setDoc(doc(db, "users", user.uid), {
          fullName: data.fullName,
          email: data.email,
          role: data.role,
          createdAt: serverTimestamp(),
        });
      } catch (dbErr: any) {
        handleFirestoreError(dbErr, OperationType.WRITE, `users/${user.uid}`);
      }

      navigate("/");
    } catch (err: any) {
      setError(err.message || "Registration failed");
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
          <h2 className="text-3xl font-display text-white">Join the Archive</h2>
          <p className="text-white/40 mt-2">Begin your photographic journey</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-500 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-luxury-gold mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
              <input
                {...register("fullName")}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:border-luxury-gold transition-colors"
                placeholder="Jane Cooper"
              />
            </div>
            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-luxury-gold mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
              <input
                {...register("email")}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:border-luxury-gold transition-colors"
                placeholder="jane@example.com"
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-luxury-gold mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
              <input
                {...register("password")}
                type="password"
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:border-luxury-gold transition-colors"
                placeholder="••••••••"
              />
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-luxury-gold mb-2">Account Type</label>
            <select
              {...register("role")}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-luxury-gold transition-colors appearance-none"
            >
              <option value="client" className="bg-luxury-black">Client</option>
              <option value="admin" className="bg-luxury-black">Admin</option>
            </select>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full py-4 text-xs font-bold uppercase tracking-widest mt-4">
            {isLoading ? "Creating account..." : "Join Archive"}
          </Button>
        </form>

        <p className="text-center mt-10 text-white/40 text-xs uppercase tracking-widest">
          Already a member?{" "}
          <Link to="/login" className="text-luxury-gold font-bold hover:underline">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
}
