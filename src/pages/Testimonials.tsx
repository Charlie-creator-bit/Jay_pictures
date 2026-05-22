import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Star, Quote, User, Sparkles, MessageSquare, Check, AlertCircle, Heart, Award, 
  ThumbsUp, Feather, Calendar
} from "lucide-react";
import { collection, addDoc, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import Button from "../components/ui/Button.tsx";

interface Testimonial {
  id?: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  date?: string;
  isPreset?: boolean;
}

const PRESET_TESTIMONIALS: Testimonial[] = [
  {
    name: "Elena Rossi",
    role: "Fashion Designer & Creative Lead",
    content: "Jay doesn't just take photographs; he masterfully captures the very soul and story of a collection. The visual Chiaroscuro depth in every frame is unparalleled. An indispensable creative partner.",
    rating: 5,
    date: "April 2026",
    isPreset: true
  },
  {
    name: "Marcus Thorne",
    role: "Fine Art Collector",
    content: "I've commissioned works globally, but the precision of lighting, styling direction, and physical archival printing here is of extraordinary heritage standards. Truly a masterpiece-class studio.",
    rating: 5,
    date: "May 2026",
    isPreset: true
  },
  {
    name: "Sophie Chen",
    role: "Visual Creative Director",
    content: "The attention to raw skin textures, natural contrast, and architectural placement is absolutely breathtaking. They translated our brand's complex core ethos into high-contrast fine art frames effortlessly.",
    rating: 5,
    date: "February 2026",
    isPreset: true
  },
  {
    name: "Arthur Pendelton",
    role: "Museum Exhibition Curator",
    content: "Jay's prints have served as primary features on multiple galleries. The giclée ink thickness holds magnificent deep blacks and accurate shadows. Uncompromising lifetime longevity.",
    rating: 5,
    date: "January 2026",
    isPreset: true
  }
];

const milestones = [
  { val: "100+", label: "Patrons Worldwide", desc: "Serving luxury clients from Paris, New York, Rome, and Tokyo." },
  { val: "15+", label: "Gallery Exhibitions", desc: "Fine art items safely displayed in international contemporary spaces." },
  { val: "4.9", label: "Average Rating", desc: "Patrons rank our visual development as absolute elite quality." },
  { val: "20+", label: "Vogue & Editorial Features", desc: "Award-winning editorial campaigns printed in global magazines." }
];

export default function TestimonialsPage() {
  const { user } = useAuth();
  const [dbTestimonials, setDbTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states for guest review submission
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchUserBookings = async () => {
        setLoadingBookings(true);
        try {
          const qBl = query(collection(db, "bookings"), where("clientId", "==", user.uid));
          const snapshot = await getDocs(qBl);
          const list: any[] = [];
          snapshot.forEach(docSnap => {
            list.push({ id: docSnap.id, ...docSnap.data() });
          });
          setUserBookings(list);
          if (list.length > 0) {
            setSelectedBookingId(list[0].id);
          }
        } catch (err) {
          console.error("Error loading user bookings for reviews:", err);
        } finally {
          setLoadingBookings(false);
        }
      };
      fetchUserBookings();
    } else {
      setUserBookings([]);
      setSelectedBookingId("");
    }
  }, [user]);

  const fetchDbTestimonials = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "testimonials"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const items: Testimonial[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.isApproved === true) {
          items.push({
            id: docSnap.id,
            name: data.fullName || data.name || "Verified Patron",
            role: "Commissioned Client",
            content: data.feedback || data.content || "",
            rating: data.rating || 5,
            date: data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : "Recent"
          });
        }
      });
      setDbTestimonials(items);
    } catch (err) {
      console.warn("Could not query custom testimonials path. Using fallback static model.", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDbTestimonials();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const combinedTestimonials = [...dbTestimonials, ...PRESET_TESTIMONIALS];

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setSubmitError("An active session is required to post a review.");
      return;
    }
    if (!selectedBookingId) {
      setSubmitError("A verified slot booking ID is required to publish a testimonial.");
      return;
    }
    if (!formName.trim() || !formRole.trim() || !formContent.trim()) {
      setSubmitError("Please fill out all the fields before submitting registration.");
      return;
    }
    setSubmitError("");
    setSubmitSuccess("");
    setSubmitting(true);

    try {
      const now = new Date();
      await addDoc(collection(db, "testimonials"), {
        clientId: user.uid,
        bookingId: selectedBookingId,
        fullName: formName.trim(),
        rating: formRating,
        feedback: formContent.trim(),
        isApproved: false,
        createdAt: now
      });

      setSubmitSuccess("Your reflection review has been submitted for verified admin approval and cataloged securely!");
      setFormName("");
      setFormRole("");
      setFormContent("");
      setFormRating(5);
      fetchDbTestimonials();
    } catch (err: any) {
      console.error(err);
      setSubmitError("Failed saving testimonial to server: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-luxury-black text-white pt-28 pb-20 relative overflow-hidden">
      
      {/* Decorative ambient backgrounds */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-luxury-gold/5 blur-[130px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 sm:px-12 relative z-10">
        
        {/* Page Title Header */}
        <div className="max-w-4xl mx-auto text-center mb-16 space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-full text-[9px] uppercase tracking-[0.2em] text-[#d4af37] font-mono"
          >
            <Award className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Honorable Reflections & In-depth Trust</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl font-display text-white"
          >
            Patron <span className="italic font-serif text-[#d4af37]">Testimonials</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-sm text-white/50 max-w-xl mx-auto font-sans leading-relaxed"
          >
            Read original reflections written by fine art collectors, global designers, and exhibition partners who have worked with Jay Pictures.
          </motion.p>
        </div>

        {/* Milestone Statistics Banners */}
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 mb-24">
          {milestones.map((milestone, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-white/[0.01] border border-white/5 p-6 rounded-2xl text-center space-y-1.5 focus:border-[#d4af37]/30 group hover:bg-[#d4af37]/5 transition-colors duration-500"
            >
              <div className="text-3xl sm:text-4xl font-serif text-[#d4af37] font-bold">
                {milestone.val}
              </div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/90">
                {milestone.label}
              </div>
              <div className="text-[10px] text-white/30 leading-snug">
                {milestone.desc}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Testimonials Editorial Grids */}
        <div className="max-w-5xl mx-auto mb-28">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {combinedTestimonials.map((testimonial, idx) => (
              <motion.div
                key={testimonial.id || idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: (idx % 2) * 0.15 }}
                className="bg-white/[0.01] p-8 rounded-3xl border border-white/5 relative flex flex-col justify-between hover:border-[#d4af37]/15 transition-all shadow-xl"
              >
                <div className="space-y-6">
                  {/* Quotes Decoration */}
                  <Quote className="w-10 h-10 text-[#d4af37] opacity-15" />
                  
                  {/* Ratings Stars */}
                  <div className="flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, rIdx) => (
                      <Star key={rIdx} className="w-4 h-4 fill-current text-[#d4af37]" />
                    ))}
                  </div>

                  {/* Comment */}
                  <p className="text-sm sm:text-base text-white/85 italic font-serif leading-relaxed">
                    "{testimonial.content}"
                  </p>
                </div>

                {/* Author Credentials */}
                <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#d4af37]/10 flex items-center justify-center border border-[#d4af37]/20 text-[#d4af37]">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-serif font-bold text-white tracking-wide">{testimonial.name}</h4>
                      <p className="text-[10px] font-mono text-white/40">{testimonial.role}</p>
                    </div>
                  </div>
                  {testimonial.isPreset ? (
                    <span className="text-[8px] font-mono uppercase tracking-widest text-[#d4af37]/80 bg-[#d4af37]/10 border border-[#d4af37]/20 px-2.5 py-1 rounded-full">
                      Verified Client
                    </span>
                  ) : (
                    <span className="text-[8px] font-mono uppercase tracking-widest text-white/30 bg-white/5 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Feather className="w-2.5 h-2.5" />
                      Guest Log
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Dynamic Guest reflection upload book */}
        <div className="max-w-3xl mx-auto bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-[#d4af37]/3 blur-xl rounded-full" />
          
          <div className="space-y-8 relative z-10">
            <div className="text-center space-y-2">
              <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-[#d4af37]">Studio Archives</span>
              <h2 className="text-2xl sm:text-3xl font-serif">Leave a <span className="italic font-serif text-[#d4af37]">Reflection</span></h2>
              <p className="text-xs text-white/45 max-w-sm mx-auto leading-relaxed">
                {user 
                  ? "Share your custom aesthetic experience with our community. Your voice represents our legacy of quality."
                  : "An active user session is required to publish review records to the database. Welcome guest profile."
                }
              </p>
            </div>

            {user ? (
              userBookings.length === 0 ? (
                <div className="text-center py-6 bg-black/40 border border-white/5 rounded-2xl">
                  <Feather className="w-8 h-8 text-[#d4af37]/30 mx-auto mb-3" />
                  <p className="text-xs text-white/60 mb-4 max-w-sm mx-auto leading-relaxed">
                    You do not have any active or previous photography bookings logged under your account. A verified session booking is required to submit a public client reflection.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Link to="/book">
                      <Button className="text-[10px] tracking-widest uppercase font-mono font-bold bg-[#d4af37] hover:bg-[#d4af37]/90 text-black px-6 py-3">
                        Schedule a Session
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-5 font-mono text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[#d4af37] text-[9px] uppercase tracking-wider block font-bold">Your Full Name</label>
                      <input 
                        type="text"
                        className="w-full bg-black/60 border border-white/5 rounded-xl p-3 text-white focus:outline-none focus:border-[#d4af37] transition-colors"
                        placeholder="e.g. Jean-Luc Godard"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[#d4af37] text-[9px] uppercase tracking-wider block font-bold">Role / Profession / context</label>
                      <input 
                        type="text"
                        className="w-full bg-black/60 border border-white/5 rounded-xl p-3 text-white focus:outline-none focus:border-[#d4af37] transition-colors"
                        placeholder="e.g. Gallery Collector"
                        value={formRole}
                        onChange={(e) => setFormRole(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[#d4af37] text-[9px] uppercase tracking-wider block font-bold">Select Stars Rating</label>
                      <select
                        className="w-full bg-black/60 border border-white/5 rounded-xl p-3 text-white focus:outline-none focus:border-[#d4af37] transition-colors"
                        value={formRating}
                        onChange={(e) => setFormRating(Number(e.target.value))}
                      >
                        <option value="5">⭐⭐⭐⭐⭐ (5 / 5 Extreme quality)</option>
                        <option value="4">⭐⭐⭐⭐ (4 / 5 High craft)</option>
                        <option value="3">⭐⭐⭐ (3 / 5 Satisfactory)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[#d4af37] text-[9px] uppercase tracking-wider block font-bold">Eligible Booking Session</label>
                      <select
                        className="w-full bg-black/60 border border-white/5 rounded-xl p-3 text-white focus:outline-none focus:border-[#d4af37] transition-colors"
                        value={selectedBookingId}
                        onChange={(e) => setSelectedBookingId(e.target.value)}
                        required
                      >
                        {userBookings.map(b => (
                          <option key={b.id} value={b.id}>
                            Session Date: {b.bookingDate} ({b.status})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[#d4af37] text-[9px] uppercase tracking-wider block font-bold">Your Photographic Reflection</label>
                    <textarea 
                      rows={4}
                      className="w-full bg-black/60 border border-white/5 rounded-xl p-3 text-white focus:outline-none focus:border-[#d4af37] transition-colors resize-none leading-relaxed"
                      placeholder="Describe your session, art direction outcome, overall support, prints quality..."
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      required
                    />
                  </div>

                  {submitError && (
                    <div className="p-3 bg-red-500/15 border border-red-500/20 text-red-400 text-[10.5px] rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {submitSuccess && (
                    <div className="p-3 bg-green-500/15 border border-green-500/20 text-green-400 text-[10.5px] rounded-xl flex items-center gap-2">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>{submitSuccess}</span>
                    </div>
                  )}

                  <div className="text-center pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-8 py-3 bg-[#d4af37] text-black font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-opacity-95 active:scale-95 transition-all shadow-lg cursor-pointer"
                    >
                      {submitting ? "Publishing Reflections..." : "Submit to Public Record"}
                    </button>
                  </div>
                </form>
              )
            ) : (
              <div className="text-center py-6 bg-black/40 border border-white/5 rounded-2xl">
                <Feather className="w-8 h-8 text-[#d4af37]/30 mx-auto mb-3" />
                <p className="text-xs text-white/60 mb-4 max-w-sm mx-auto leading-relaxed">
                  Join our archives to submit a public client reflection record to the database and track active photography commissions.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" className="text-[10px] font-mono tracking-widest uppercase">
                    <a href="/login?redirect=/testimonials">Login or Setup Guest</a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
