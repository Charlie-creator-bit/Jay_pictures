import { useState } from "react";
import { motion } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../lib/firebase";
import { Link, useNavigate } from "react-router-dom";
import { Camera, Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import Button from "../components/ui/Button";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      navigate("/");
    } catch (err: any) {
      // If logging in with the owner's primary admin email/password on a brand-new database console,
      // seamlessly register and provision the account in Firebase Auth & Firestore live.
      if (
        data.email.toLowerCase() === "asarearthur442@gmail.com" &&
        data.password === "JayPictures442a@" &&
        (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password")
      ) {
        try {
          const { createUserWithEmailAndPassword } = await import("firebase/auth");
          const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
          const { db } = await import("../lib/firebase");
          
          const { user } = await createUserWithEmailAndPassword(auth, data.email, data.password);
          await setDoc(doc(db, "users", user.uid), {
            fullName: "Asare Arthur (Owner & Admin)",
            email: data.email,
            role: "admin",
            createdAt: serverTimestamp(),
          });
          
          navigate("/");
          return;
        } catch (createErr: any) {
          console.error("Seamless admin registration failed:", createErr);
        }
      }

      let msg = err.message || "Failed to sign in";
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        msg = "Invalid email or password. If you haven't created your account yet, please register first using the link at the bottom of the page.";
      } else if (err.code === "auth/invalid-email") {
        msg = "This is not a valid email address.";
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate("/");
    } catch (err: any) {
      console.error("Google sign in verification error:", err);
      let msg = err.message || "Google sign in failed";
      
      // Specifically identify popup blocker errors commonly seen within embedded preview iframes
      if (err.code === "auth/popup-blocked" || msg.includes("popup-blocked") || msg.includes("popup_blocked")) {
        msg = "Google login pop-up was blocked. Pop-ups are blocked by browsers when running inside an embedded preview iframe. To sign in with Google, please open this app in a new browser tab using the external arrow button at the top right of the screen, or sign in using your Email/Password above.";
      } else if (err.code === "auth/popup-closed-by-user" || msg.includes("popup-closed-by-user")) {
        msg = "The authentication pop-up was closed before completion. Please try again and complete the Google login prompt.";
      } else if (err.code === "auth/account-exists-with-different-credential" || msg.includes("account-exists-with-different-credential")) {
        msg = "An account already exists with this email address under a different sign-in method (Email/Password). Please log in using your Email and Password above. (Note: System administrators can allow both methods on the same email by toggling 'Allow creation of multiple accounts with the same email' under Firebase Console > Authentication > Settings).";
      }
      setError(msg);
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
          <h2 className="text-3xl font-display text-white">Welcome Back</h2>
          <p className="text-white/40 mt-2">Sign in to your luxury archive</p>
        </div>

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

          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-luxury-gold mb-2">Password</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-luxury-gold transition-colors focus:outline-none z-10"
                title={showPassword ? "Hide password" : "Show password"}
                id="login-password-left-toggle"
              >
                {showPassword ? (
                  <Eye className="w-5 h-5" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
              </button>
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-12 pr-12 text-white focus:outline-none focus:border-luxury-gold transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-luxury-gold transition-colors focus:outline-none z-10"
                title={showPassword ? "Hide password" : "Show password"}
                id="login-password-right-toggle"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div className="flex items-center justify-between">
            <Link to="/forgot-password" title="Recover password" label="recover password" id="forgot-password-link" className="text-xs text-white/40 hover:text-luxury-gold transition-colors">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full py-4 text-xs font-bold uppercase tracking-widest">
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest"><span className="bg-luxury-black px-4 text-white/20">Or continue with</span></div>
          </div>

          <button
            type="button"
            onClick={signInWithGoogle}
            className="w-full py-4 border border-white/10 rounded-lg flex items-center justify-center gap-3 text-white/60 hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>
          
          <p className="text-[10px] text-white/30 text-center mt-2 leading-relaxed italic">
            * Pop-ups are blocked by standard browser safety policies within embedded preview frames. If using Google login, please ensure you open the app in a new tab/window using the external arrow button.
          </p>
        </form>

        <p className="text-center mt-10 text-white/40 text-xs uppercase tracking-widest">
          Don't have an account?{" "}
          <Link to="/register" className="text-luxury-gold font-bold hover:underline">Register</Link>
        </p>
      </motion.div>
    </div>
  );
}
