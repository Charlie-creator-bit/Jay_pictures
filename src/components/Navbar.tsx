import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, Menu, X, User, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { auth } from "../lib/firebase";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, role } = useAuth();
  const location = useLocation();

  const isHome = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Gallery", href: "/gallery", show: true, isRoute: true },
    { name: "Services", href: "/services", show: true, isRoute: true },
    { name: "Testimonials", href: "/testimonials", show: true, isRoute: true },
    { name: "Pricing", href: "/pricing", show: true, isRoute: true },
    { name: "Book", href: "/book", show: true, isRoute: true },
  ];

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <nav
      id="main-nav"
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 border-b border-white/5 ${
        isScrolled || !isHome ? "h-20 glass-dark" : "h-24 bg-transparent"
      }`}
    >
      <div className="container mx-auto px-12 h-full flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Link to="/" className="flex items-center gap-2">
            <Camera className="w-6 h-6 text-luxury-gold" />
            <span className="text-2xl font-serif tracking-tighter text-luxury-gold">
              JAY PICTURES
            </span>
          </Link>
        </motion.div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-10">
          {navLinks.filter(l => l.show).map((link, i) => 
            link.isRoute ? (
              <Link
                key={link.name}
                to={link.href}
                className="text-[11px] uppercase tracking-[0.2em] font-medium text-white/70 hover:text-luxury-gold transition-colors"
              >
                {link.name}
              </Link>
            ) : (
              <motion.a
                key={link.name}
                href={link.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-[11px] uppercase tracking-[0.2em] font-medium text-white/70 hover:text-luxury-gold transition-colors"
              >
                {link.name}
              </motion.a>
            )
          )}
          
          {user ? (
            <div className="flex items-center gap-6">
              <Link 
                to={role === "admin" ? "/admin" : "/dashboard"}
                className="flex items-center gap-2 py-2 px-4 bg-white/5 border border-white/10 rounded-lg text-[10px] uppercase tracking-widest font-bold hover:bg-white/10 transition-colors"
              >
                <User className="w-3 h-3 text-luxury-gold" />
                Dashboard
              </Link>
              {user && !user.isAnonymous && (
                <button
                  onClick={handleLogout}
                  className="text-white/40 hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : null}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-dark border-t border-white/5 overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-6">
              {navLinks.filter(l => l.show).map((link) => 
                link.isRoute ? (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-lg font-medium tracking-widest uppercase hover:text-luxury-gold text-left"
                  >
                    {link.name}
                  </Link>
                ) : (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-lg font-medium tracking-widest uppercase hover:text-luxury-gold text-left"
                  >
                    {link.name}
                  </a>
                )
              )}
              {user ? (
                <>
                  <Link 
                    to={role === "admin" ? "/admin" : "/dashboard"}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-lg font-medium tracking-widest uppercase text-luxury-gold"
                  >
                    Dashboard
                  </Link>
                  {user && !user.isAnonymous && (
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="text-lg font-medium tracking-widest uppercase text-red-500 text-left"
                    >
                      Logout
                    </button>
                  )}
                </>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
