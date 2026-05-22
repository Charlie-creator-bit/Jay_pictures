import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../lib/firebase";
import { 
  collection, 
  getDocs, 
  doc, 
  query, 
  where, 
  getDoc, 
  updateDoc, 
  addDoc, 
  deleteDoc,
  serverTimestamp 
} from "firebase/firestore";
import GlassCard from "../components/ui/GlassCard";
import { 
  Image as ImageIcon, 
  Clock, 
  MessageSquare, 
  Download, 
  Calendar, 
  Ticket, 
  CreditCard, 
  ChevronRight, 
  Check, 
  User, 
  Sliders, 
  Plus, 
  Trash2, 
  Camera, 
  CheckCircle, 
  AlertCircle, 
  Inbox, 
  Eye, 
  ExternalLink, 
  FileText, 
  X, 
  Grid, 
  Heart, 
  Settings, 
  Menu 
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { motion, AnimatePresence } from "motion/react";

interface Booking {
  id: string;
  clientId: string;
  serviceId: string;
  bookingDate: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  totalAmount: number;
  serviceTitle?: string;
}

interface GalleryDoc {
  id: string;
  clientId: string;
  bookingId: string;
  title: string;
  images: Array<{ url: string; filename: string }>;
}

interface PaymentRecord {
  id: string;
  bookingId: string;
  clientId: string;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "refunded";
  stripePaymentIntentId?: string;
  paystackReference?: string;
  createdAt?: any;
}

interface InspItem {
  id: string;
  imageUrl: string;
  title: string;
  conceptNotes?: string;
}

interface UserProfile {
  fullName: string;
  phoneNumber: string;
  themePreference: string;
  creativeNotes: string;
}

// Creative inspirations presets
const INSPIRATION_PRESETS = [
  { title: "Velvet Noir Portrait", imageUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=800", note: "Deep dark shadows with low-key studio spotlight." },
  { title: "Editorial Vogue Glamour", imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800", note: "High fashion aesthetic framing with stark golden accents." },
  { title: "Rembrandt Soft Lighting", imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800", note: "Chiaroscuro shadows casting a cinematic timeless mood." },
  { title: "Venice Waterscape Reflections", imageUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=800", note: "Vibrant motion blur portraiture captured alongside water canals." }
];

export default function ClientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Core collections data
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [galleries, setGalleries] = useState<GalleryDoc[]>([]);
  const [inspirations, setInspirations] = useState<InspItem[]>([]);
  
  // Profile settings state
  const [profile, setProfile] = useState<UserProfile>({
    fullName: "",
    phoneNumber: "",
    themePreference: "Cinematic Warm",
    creativeNotes: ""
  });

  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"portfolio" | "bookings" | "inspiration" | "billing" | "settings">("portfolio");

  // Status warnings / success
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New inspiration Board uploader state
  const [newInspUrl, setNewInspUrl] = useState("");
  const [newInspTitle, setNewInspTitle] = useState("");
  const [newInspNotes, setNewInspNotes] = useState("");
  const [isUploadingInsp, setIsUploadingInsp] = useState(false);

  // Fullscreen images inspect lightbox
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  
  // Fullscreen invoice review printable modal
  const [selectedInvoice, setSelectedInvoice] = useState<PaymentRecord | null>(null);

  // Profile save loading status
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const fetchClientInformation = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Query services to build package lookup
      const servicesSnap = await getDocs(collection(db, "services"));
      const sMap: Record<string, string> = {};
      servicesSnap.forEach(d => {
        sMap[d.id] = d.data().title;
      });

      // 2. Query user's bookings from Firestore
      const bookingsQuery = query(
        collection(db, "bookings"),
        where("clientId", "==", user.uid)
      );
      const bookingsSnap = await getDocs(bookingsQuery);
      const bList: Booking[] = [];
      bookingsSnap.forEach(d => {
        const data = d.data();
        bList.push({
          id: d.id,
          clientId: data.clientId,
          serviceId: data.serviceId,
          bookingDate: data.bookingDate,
          status: data.status,
          totalAmount: data.totalAmount || 0,
          serviceTitle: sMap[data.serviceId] || "Creative Shoot",
        });
      });
      // Sort: Chronological (newest booking date first)
      bList.sort((a,b) => b.bookingDate.localeCompare(a.bookingDate));
      setUserBookings(bList);

      // 3. Query client's real itemized payments
      const paymentsQuery = query(
        collection(db, "payments"),
        where("clientId", "==", user.uid)
      );
      const paymentsSnap = await getDocs(paymentsQuery);
      const pList: PaymentRecord[] = [];
      paymentsSnap.forEach(d => {
        const data = d.data();
        pList.push({
          id: d.id,
          bookingId: data.bookingId || "N/A",
          clientId: data.clientId || "N/A",
          amount: data.amount || 0,
          currency: data.currency || "USD",
          status: data.status || "paid",
          stripePaymentIntentId: data.stripePaymentIntentId || "",
          paystackReference: data.paystackReference || "",
          createdAt: data.createdAt
        });
      });
      setPayments(pList);

      // 4. Load client delivered visual galleries
      const galleriesQuery = query(
        collection(db, "galleries"),
        where("clientId", "==", user.uid)
      );
      const galleriesSnap = await getDocs(galleriesQuery);
      const gList: GalleryDoc[] = [];
      galleriesSnap.forEach(d => {
        const data = d.data();
        gList.push({
          id: d.id,
          clientId: data.clientId,
          bookingId: data.bookingId,
          title: data.title || "Curated Collection Archive",
          images: data.images || [],
        });
      });
      setGalleries(gList);

      // 5. Query user inspirations moodboard
      const inspQuery = query(
        collection(db, "inspirations"),
        where("clientId", "==", user.uid)
      );
      const inspSnap = await getDocs(inspQuery);
      const iList: InspItem[] = [];
      inspSnap.forEach(d => {
        const data = d.data();
        iList.push({
          id: d.id,
          imageUrl: data.imageUrl,
          title: data.title,
          conceptNotes: data.conceptNotes
        });
      });
      setInspirations(iList);

      // 6. Fetch user profile configurations
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const uData = userDocSnap.data();
        setProfile({
          fullName: uData.fullName || "",
          phoneNumber: uData.phoneNumber || "",
          themePreference: uData.themePreference || "Cinematic Warm",
          creativeNotes: uData.creativeNotes || ""
        });
      } else {
        // Fallback fallback setting
        setProfile({
          fullName: user.displayName || "",
          phoneNumber: "",
          themePreference: "Classic Black & White",
          creativeNotes: ""
        });
      }

    } catch (err: any) {
      console.error("Error loading client metrics:", err);
      setStatusMsg({ type: "error", text: "Database synchronization issue. Retrying..." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientInformation();
  }, [user]);

  // Cancel booking logic
  const handleCancelBooking = async (bookingId: string, bookingDate: string) => {
    if (!window.confirm("Are you sure you want to cancel this booking window? Custom time allocations will be set back to free space.")) return;
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      await updateDoc(bookingRef, {
        status: "cancelled",
        updatedAt: serverTimestamp()
      });

      // Free slot availability block
      const [dateStr, timeStr] = bookingDate.split("T");
      if (dateStr && timeStr) {
        const dStr = dateStr;
        const tStr = timeStr.slice(0, 5);
        const slotId = `${dStr}_${tStr.replace(":", "")}`;
        const slotRef = doc(db, "availability", slotId);

        const slotSnap = await getDoc(slotRef);
        if (slotSnap.exists()) {
          await updateDoc(slotRef, {
            isBooked: false,
            bookingId: ""
          });
        }
      }

      // Sync status
      setStatusMsg({ type: "success", text: "Your reservation cancellation has been filed securely." });
      
      // Inline refresh state
      setUserBookings(prev => 
        prev.map(b => b.id === bookingId ? { ...b, status: "cancelled" } : b)
      );
    } catch (err: any) {
      console.error("Cancel failure:", err);
      setStatusMsg({ type: "error", text: "Cancellation pipeline error: " + err.message });
    }
  };

  // Profile preferences submit handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingProfile(true);
    setStatusMsg(null);
    try {
      const uRef = doc(db, "users", user.uid);
      await updateDoc(uRef, {
        fullName: profile.fullName,
        phoneNumber: profile.phoneNumber,
        themePreference: profile.themePreference,
        creativeNotes: profile.creativeNotes,
        updatedAt: serverTimestamp()
      });
      setStatusMsg({ type: "success", text: "Luxury profile parameters synchronized in Realtime Database." });
    } catch (err: any) {
      console.error("Profile save error:", err);
      setStatusMsg({ type: "error", text: "Save error: " + err.message });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Submit Inspiration asset to your fine-art moodboard
  const handleAddInspiration = async (imgUrl: string, titleText: string, noteText: string) => {
    if (!user) return;
    if (!imgUrl) {
      setStatusMsg({ type: "error", text: "Image reference URL is mandatory." });
      return;
    }
    setIsUploadingInsp(true);
    setStatusMsg(null);
    try {
      const newRef = await addDoc(collection(db, "inspirations"), {
        clientId: user.uid,
        imageUrl: imgUrl,
        title: titleText || "Curated Preset Concept",
        conceptNotes: noteText || "Refined styling backdrop guideline.",
        createdAt: serverTimestamp()
      });

      // Inline update state to show instantly
      setInspirations(prev => [
        ...prev,
        {
          id: newRef.id,
          imageUrl: imgUrl,
          title: titleText || "Curated Preset Concept",
          conceptNotes: noteText || "Refined styling backdrop guideline."
        }
      ]);
      
      setStatusMsg({ type: "success", text: "Concept pinned to your private session moodboard!" });
      setNewInspUrl("");
      setNewInspTitle("");
      setNewInspNotes("");
    } catch (err: any) {
      console.error("Inspiration post error:", err);
      setStatusMsg({ type: "error", text: "Inspiration pinning failure: " + err.message });
    } finally {
      setIsUploadingInsp(false);
    }
  };

  // Delete element from inspiration board
  const handleDeleteInspiration = async (inspId: string) => {
    try {
      await deleteDoc(doc(db, "inspirations", inspId));
      setInspirations(prev => prev.filter(i => i.id !== inspId));
      setStatusMsg({ type: "success", text: "Item removed from moodboard." });
    } catch (err: any) {
      setStatusMsg({ type: "error", text: "Failed to erase pin: " + err.message });
    }
  };

  // Get human readable status notes
  const getStatusDescription = (status: string) => {
    switch (status) {
      case "pending":
        return "Our creative director is currently organizing studio lights, locations, and props. We will verify your shoot soon.";
      case "confirmed":
        return "Congratulations. Shoot window locked. Please outline your visual inspiration notes inside the moodboard.";
      case "cancelled":
        return "This shoot was marked empty or cancelled. Contact support to rearrange dates.";
      case "completed":
        return "Assets processed! Head over to the Delivered Portfolio section to view/download high-res heirlooms.";
      default:
        return "Photoshoot status pending synchronization.";
    }
  };

  // Determine booking tracker stage
  const getBookingProgressStep = (status: string) => {
    switch (status) {
      case "pending":
        return { step: 1, text: "Verification" };
      case "confirmed":
        return { step: 2, text: "Ready to Shoot" };
      case "completed":
        return { step: 3, text: "Post-Processing & Delivered" };
      case "cancelled":
        return { step: 0, text: "Cancelled" };
      default:
        return { step: 1, text: "Awaiting review" };
    }
  };

  // Active future booking
  const soonestBooking = userBookings.find(b => b.status === "confirmed" || b.status === "pending") || userBookings[0];

  return (
    <div className="min-h-screen bg-luxury-black text-white selection:bg-luxury-gold/30 selection:text-white pb-20">
      
      {/* Header Separation Anchor */}
      <div className="h-20 border-b border-white/5 print:hidden" />

      {/* Hero Banner Area */}
      <div className="relative bg-gradient-to-b from-[#111] to-luxury-black py-12 px-6 sm:px-12 border-b border-white/5 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-[0.3em] font-mono text-luxury-gold font-bold">Patron Workspace</span>
            <h1 className="text-3xl sm:text-4xl font-display">
              Welcome, <span className="italic font-serif text-[#d4af37]">{profile.fullName || "Esteemed Client"}</span>
            </h1>
            <p className="text-xs text-white/45 max-w-lg">
              Manage custom photoshoot schedules, fine-tune creative guidelines in your personal moodboard, and view exquisite heirloom photography.
            </p>
          </div>
          
          <div className="flex gap-4 shrink-0">
            <Link to="/book">
              <button className="px-5 py-2.5 bg-luxury-gold text-black rounded text-[10px] uppercase tracking-widest font-mono font-bold hover:bg-opacity-90 cursor-pointer transition-all shadow-lg shadow-luxury-gold/5">
                New Photoshoot
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Responsive Grid Layout containing Sidebar and Core Views */}
      <div className="max-w-7xl mx-auto px-6 sm:px-12 mt-12 flex flex-col lg:flex-row gap-12">
        
        {/* SIDEBAR NAVIGATION CONTROLS */}
        <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-6 print:hidden">
          
          {/* Tabs Menu Selection */}
          <div className="bg-[#0c0c0c] border border-white/5 p-4 rounded-xl space-y-1">
            
            <button
              onClick={() => setActiveTab("portfolio")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider font-mono transition-all text-left ${
                activeTab === "portfolio"
                  ? "bg-luxury-gold text-black font-black"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              1. My Portfolio
            </button>

            <button
              onClick={() => setActiveTab("bookings")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider font-mono transition-all text-left ${
                activeTab === "bookings"
                  ? "bg-luxury-gold text-black font-black"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="flex items-center gap-3">
                <Clock className="w-4 h-4" />
                2. Shoot Trackers
              </span>
              {userBookings.filter(b => b.status === "pending").length > 0 && (
                <span className="w-4 h-4 text-[8px] bg-yellow-500 text-black font-extrabold rounded-full flex items-center justify-center animate-pulse">
                  {userBookings.filter(b => b.status === "pending").length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("inspiration")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider font-mono transition-all text-left ${
                activeTab === "inspiration"
                  ? "bg-luxury-gold text-black font-black"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <Heart className="w-4 h-4" />
              3. Visual Moodboard
            </button>

            <button
              onClick={() => setActiveTab("billing")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider font-mono transition-all text-left ${
                activeTab === "billing"
                  ? "bg-luxury-gold text-black font-black"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              4. Receipts & Bills
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider font-mono transition-all text-left ${
                activeTab === "settings"
                  ? "bg-luxury-gold text-black font-black"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <Settings className="w-4 h-4" />
              5. Profile Rules
            </button>

          </div>

          {/* Quick Info Box */}
          <GlassCard className="p-5 space-y-4 text-xs font-mono text-white/40" hover={false}>
            <p className="uppercase text-[9px] font-bold tracking-widest text-[#d4af37]">Support Hotlines</p>
            <p>Our studio coordinators remain active 24/7 to fine-tune backdrops, styles, and vintage prints selection.</p>
            <div className="border-t border-white/5 pt-3 text-[10px] space-y-1">
              <p className="text-white/75">Email: support@jaypictures.co</p>
              <p className="text-white/75">Phone: +1 (281) 505-PIX</p>
            </div>
          </GlassCard>

        </aside>

        {/* CORE DATA DISPLAY PANEL VIEWPORTS */}
        <main className="flex-1">

          {/* Inline alert messages bar */}
          <AnimatePresence>
            {statusMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 border text-xs rounded-xl flex items-center gap-3 mb-8 print:hidden ${
                  statusMsg.type === "success" 
                    ? "bg-green-500/10 border-green-500/20 text-green-400" 
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}
              >
                {statusMsg.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{statusMsg.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="h-80 flex flex-col items-center justify-center gap-3 text-white/30 text-xs font-mono">
              <div className="w-6 h-6 border-2 border-t-white border-white/10 rounded-full animate-spin" />
              Fetching client archive schemas from database...
            </div>
          ) : (
            <div>

              {/* ============================================================== */}
              {/* TAB 1: DELIVERED PORTFOLIO GALERIST */}
              {/* ============================================================== */}
              {activeTab === "portfolio" && (
                <div className="space-y-8">
                  <header className="border-b border-white/5 pb-4">
                    <h2 className="text-2xl font-display text-white">Delivered <span className="italic text-[#d4af37]">Portfolios</span></h2>
                    <p className="text-[10px] tracking-widest font-mono text-white/40 uppercase mt-1">High-end digital heirloom galleries</p>
                  </header>

                  {galleries.length > 0 ? (
                    <div className="space-y-12">
                      {galleries.map((gal) => (
                        <div key={gal.id} className="space-y-6">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-baseline gap-2 border-b border-white/5 pb-2">
                            <h3 className="text-lg font-serif italic text-white/90">{gal.title}</h3>
                            <span className="text-[9px] font-mono text-white/30">Delivered Index: {gal.id.slice(0, 10).toUpperCase()}</span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {gal.images.map((img, idx) => (
                              <div 
                                key={idx} 
                                className="aspect-[4/5] bg-white/5 border border-white/10 rounded-xl relative group overflow-hidden shadow-xl cursor-pointer"
                                onClick={() => setSelectedPhotoUrl(img.url)}
                              >
                                <img 
                                  src={img.url} 
                                  alt={img.filename} 
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 text-center">
                                  <p className="text-[10px] font-mono font-bold text-white line-clamp-2 mb-2">{img.filename}</p>
                                  <div className="flex gap-2">
                                    <button 
                                      className="p-2 bg-luxury-gold text-black rounded-full hover:scale-110 transition-transform"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(img.url, "_blank");
                                      }}
                                      title="Open original"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                      className="p-2 bg-white text-black rounded-full hover:scale-110 transition-transform"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedPhotoUrl(img.url);
                                      }}
                                      title="Inspect photo"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Elegant fallback showing pre-selected cinematic reference art shots waiting for their custom photos post-processing */
                    <div className="space-y-8">
                      <div className="p-6 border border-white/5 bg-white/[0.01] rounded-2xl flex items-start gap-4">
                        <MessageSquare className="w-5 h-5 text-luxury-gold shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-xs font-serif font-semibold text-white">Heirlooms Post-Processing Channel</p>
                          <p className="text-[11px] text-white/50 leading-relaxed">
                            Fine-art curation takes roughly 5 to 7 studio days after the shoot wraps. Our post-production darkroom team is currently framing lighting balances and grain selections on your files. Browse our director's lookbooks in the meantime.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800",
                          "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=800",
                          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800",
                          "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=800"
                        ].map((url, i) => (
                          <div key={i} className="aspect-square bg-white/5 border border-white/10 rounded-xl overflow-hidden relative group shadow-xl">
                            <img 
                              src={url} 
                              alt="Jay Pictures director look" 
                              className="w-full h-full object-cover grayscale transition-all duration-750 group-hover:grayscale-0 group-hover:scale-105" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-[9px] uppercase tracking-widest font-mono text-luxury-gold font-bold">Lookbook Preset {i+1}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 2: ACTIVE RECONNAISSANCE BOOKINGS TRACKER */}
              {/* ============================================================== */}
              {activeTab === "bookings" && (
                <div className="space-y-8">
                  <header className="border-b border-white/5 pb-4">
                    <h2 className="text-2xl font-display text-white">Photoshoot <span className="italic text-[#d4af37]">Milestones</span></h2>
                    <p className="text-[10px] tracking-widest font-mono text-white/40 uppercase mt-1">Real-time status trackers and booking allocations</p>
                  </header>

                  {/* Progressive visual milestone tracker for incoming booking */}
                  {soonestBooking && soonestBooking.status !== "cancelled" && (
                    <GlassCard className="p-6 space-y-6 border border-[#d4af37]/10" hover={false}>
                      <div className="flex justify-between items-center sm:items-start flex-col sm:flex-row gap-2">
                        <div>
                          <span className="text-[8px] uppercase tracking-widest font-bold font-mono px-2 py-0.5 rounded border border-[#d4af37]/30 bg-[#d4af37]/10 text-luxury-gold">
                            Active Project Tracker
                          </span>
                          <h4 className="text-lg font-serif font-bold text-white mt-2">{soonestBooking.serviceTitle}</h4>
                          <p className="text-xs text-white/40 font-mono mt-0.5">Reservation ID: {soonestBooking.id}</p>
                        </div>

                        <div className="text-right sm:text-right text-left w-full sm:w-auto font-mono text-[10px] text-white/50">
                          <p className="text-white font-bold text-sm">Date: {soonestBooking.bookingDate.split("T")[0]}</p>
                          <p className="mt-0.5">Hour: {soonestBooking.bookingDate.split("T")[1]?.slice(0, 5) || "09:00"}</p>
                        </div>
                      </div>

                      {/* Line Milestone Steps graphics */}
                      <div className="relative pt-6 pb-2">
                        <div className="absolute top-[41px] left-4 right-4 h-[2px] bg-white/10 -z-10" />
                        <div 
                          className="absolute top-[41px] left-4 h-[2px] bg-luxury-gold -z-10 transition-all duration-500"
                          style={{ 
                            width: `${
                              soonestBooking.status === "pending" ? "10%" :
                              soonestBooking.status === "confirmed" ? "50%" :
                              soonestBooking.status === "completed" ? "100%" : "0%"
                            }` 
                          }}
                        />

                        <div className="flex justify-between items-center font-mono text-[9px]">
                          {/* Step 1 */}
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 transition-colors bg-black border-luxury-gold text-luxury-gold">
                              1
                            </div>
                            <span className="font-semibold text-white/90">Verification</span>
                          </div>

                          {/* Step 2 */}
                          <div className="flex flex-col items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 transition-colors ${
                              soonestBooking.status === "confirmed" || soonestBooking.status === "completed"
                                ? "bg-black border-luxury-gold text-luxury-gold"
                                : "bg-black/80 border-white/10 text-white/30"
                            }`}>
                              2
                            </div>
                            <span className={soonestBooking.status === "confirmed" || soonestBooking.status === "completed" ? "text-white/90 font-semibold" : "text-white/30"}>
                              Ready to Shoot
                            </span>
                          </div>

                          {/* Step 3 */}
                          <div className="flex flex-col items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 transition-colors ${
                              soonestBooking.status === "completed"
                                ? "bg-black border-luxury-gold text-[#d4af37]"
                                : "bg-black/80 border-white/10 text-white/30"
                            }`}>
                              3
                            </div>
                            <span className={soonestBooking.status === "completed" ? "text-[#d4af37] font-semibold" : "text-white/30"}>
                              Delivered Gallery
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/5 flex items-start gap-3">
                        <Inbox className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                        <p className="text-[11px] text-white/60 leading-relaxed font-sans italic">
                          "{getStatusDescription(soonestBooking.status)}"
                        </p>
                      </div>
                    </GlassCard>
                  )}

                  {/* List of full bookings history */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-luxury-gold font-mono">My Reservation Catalog</h3>
                    
                    {userBookings.length === 0 ? (
                      <div className="p-8 border border-white/5 bg-white/[0.01] rounded-xl text-center text-white/35 text-xs font-mono">
                        <Ticket className="w-8 h-8 mx-auto opacity-20 mb-2" />
                        No photo bookings registered. Launch a customized session shoot.
                      </div>
                    ) : (
                      userBookings.map((b) => {
                        const [dateStr, timeStr] = b.bookingDate.split("T");
                        return (
                          <div 
                            key={b.id} 
                            className="p-5 border border-white/5 bg-black/40 rounded-xl hover:border-white/10 transition-colors flex justify-between items-center flex-wrap sm:flex-nowrap gap-4"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[8px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${
                                  b.status === "confirmed" 
                                    ? "bg-green-500/10 border-green-500/20 text-green-400"
                                    : b.status === "completed"
                                      ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                      : b.status === "cancelled"
                                        ? "bg-red-500/10 border-red-500/20 text-red-400"
                                        : "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
                                }`}>
                                  {b.status}
                                </span>
                                <span className="text-[9px] font-mono text-white/20">Ref: {b.id.slice(0, 10).toUpperCase()}</span>
                              </div>
                              <h4 className="text-sm font-serif font-bold text-white pt-1">{b.serviceTitle}</h4>
                              <p className="text-[10px] font-mono text-white/40">
                                Schedule: {dateStr} at {timeStr ? timeStr.slice(0, 5) : "09:00"}
                              </p>
                            </div>

                            <div className="flex items-center gap-4 ml-auto sm:ml-0">
                              <span className="text-xs font-mono font-bold text-white">${b.totalAmount.toLocaleString()}</span>
                              
                              {b.status === "pending" && (
                                <button
                                  onClick={() => handleCancelBooking(b.id, b.bookingDate)}
                                  className="px-2.5 py-1.5 border border-red-500/20 hover:border-red-500/50 hover:bg-red-500/5 text-red-400 text-[9px] font-mono tracking-widest uppercase font-bold rounded cursor-pointer transition-all"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 3: VISUAL MOODBOARD BOARD */}
              {/* ============================================================== */}
              {activeTab === "inspiration" && (
                <div className="space-y-8">
                  <header className="border-b border-white/5 pb-4">
                    <h2 className="text-2xl font-display text-white">Visual <span className="italic text-[#d4af37]">Inspiration board</span></h2>
                    <p className="text-[10px] tracking-widest font-mono text-white/40 uppercase mt-1">Stage portrait models, backdrops, lighting concepts, and notes</p>
                  </header>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Inspiration pinning board */}
                    <div className="lg:col-span-2 space-y-6">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[#d4af37] font-mono">My Moodboard Pins ({inspirations.length})</h3>
                      
                      {inspirations.length === 0 ? (
                        <div className="p-10 border border-white/5 bg-white/[0.01] rounded-2xl text-center text-white/30 text-xs font-mono">
                          <ImageIcon className="w-8 h-8 opacity-25 mx-auto mb-3" />
                          Moodboard empty. Select a curated preset look on the right, or submit your favorite visual pins/Pinterest mock concepts.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          {inspirations.map((item) => (
                            <div key={item.id} className="border border-white/5 bg-black/40 rounded-xl overflow-hidden shadow-2xl group relative flex flex-col">
                              <div className="aspect-[3/2] bg-white/5 relative overflow-hidden shrink-0">
                                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
                                
                                <button
                                  onClick={() => handleDeleteInspiration(item.id)}
                                  className="absolute top-2.5 right-2.5 p-2 bg-black/80 hover:bg-red-500/20 text-white/50 hover:text-red-400 rounded-lg backdrop-blur transition-all cursor-pointer"
                                  title="Unpin image"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="p-4 flex-1 flex flex-col justify-between">
                                <div className="space-y-1">
                                  <h4 className="text-xs font-mono font-bold text-white">{item.title}</h4>
                                  <p className="text-[10px] text-white/50 leading-relaxed italic">
                                    "{item.conceptNotes || "Studio mood layout guidelines."}"
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Uploader Stager Panel */}
                    <div className="space-y-6">
                      
                      {/* Manual submission */}
                      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl space-y-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-luxury-gold font-mono">Pin Custom Concept</p>
                        
                        <div className="space-y-3 font-mono text-[10px]">
                          <div className="space-y-1">
                            <label className="text-white/40 block">Unsplash/Pinterest Image URL</label>
                            <input 
                              type="text"
                              value={newInspUrl}
                              onChange={(e) => setNewInspUrl(e.target.value)}
                              placeholder="https://images.unsplash.com/..."
                              className="w-full p-2 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-[#d4af37] text-white text-[11px]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-white/40 block">Shoot Concept Scene Title</label>
                            <input 
                              type="text"
                              value={newInspTitle}
                              onChange={(e) => setNewInspTitle(e.target.value)}
                              placeholder="e.g. Vintage Silk Shadows"
                              className="w-full p-2 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-[#d4af37] text-white text-[11px]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-white/40 block">Styling / Lighting Preferences Notes</label>
                            <textarea
                              rows={3}
                              value={newInspNotes}
                              onChange={(e) => setNewInspNotes(e.target.value)}
                              placeholder="Mention backdrop tones, poses, physical models..."
                              className="w-full p-2 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-[#d4af37] text-white text-[11px] resize-none"
                            />
                          </div>

                          <button
                            disabled={isUploadingInsp}
                            onClick={() => handleAddInspiration(newInspUrl, newInspTitle, newInspNotes)}
                            className="w-full py-2 bg-[#d4af37] text-black font-bold uppercase tracking-widest text-[9px] cursor-pointer hover:bg-opacity-90 rounded-lg transition-colors"
                          >
                            {isUploadingInsp ? "Pinning..." : "Pin Mood to Board"}
                          </button>
                        </div>
                      </div>

                      {/* Quick Premium Presets list to test uploader easily */}
                      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl space-y-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-luxury-gold font-mono">Director Curation Preset Pins</p>
                        <p className="text-[10px] text-white/40 leading-normal">
                          Instantly select artistic layout guides curated by our studio team below to populate your moodboard:
                        </p>

                        <div className="space-y-2">
                          {INSPIRATION_PRESETS.map((p, i) => (
                            <div 
                              key={i} 
                              className="flex items-center gap-3 p-2 border border-white/5 hover:border-[#d4af37]/40 bg-black/60 rounded-lg cursor-pointer group transition-all"
                              onClick={() => handleAddInspiration(p.imageUrl, p.title, p.note)}
                            >
                              <img src={p.imageUrl} className="w-10 h-10 object-cover rounded shrink-0" alt="Preset" referrerPolicy="no-referrer" />
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold text-white truncate group-hover:text-luxury-gold transition-colors">{p.title}</p>
                                <p className="text-[8px] text-white/30 truncate">{p.note}</p>
                              </div>
                              <Plus className="w-3.5 h-3.5 text-white/40 group-hover:text-luxury-gold" />
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 4: ACCURATE INVOICES & PAYSTACK LEDGER */}
              {/* ============================================================== */}
              {activeTab === "billing" && (
                <div className="space-y-8">
                  <header className="border-b border-white/5 pb-4">
                    <h2 className="text-2xl font-display text-white">Transactions <span className="italic text-[#d4af37]">& Billing Receipts</span></h2>
                    <p className="text-[10px] tracking-widest font-mono text-white/40 uppercase mt-1">Itemized digital invoice registries & verified checkout reference lists</p>
                  </header>

                  <div className="bg-[#0b0b0b] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-white/5 text-white/40 font-bold uppercase text-[9px] tracking-widest">
                            <th className="py-4 px-6">Transaction Ref ID</th>
                            <th className="py-4 px-6">Assigned Photo Booking</th>
                            <th className="py-4 px-6">Amount Paid (USD)</th>
                            <th className="py-4 px-6">Paystack/Stripe Ref</th>
                            <th className="py-4 px-6">Checkout Status</th>
                            <th className="py-4 px-6 text-right">Invoice</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono text-[11px] text-white/80">
                          {payments.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-12 px-6 text-center text-white/30">
                                No verified transaction checkout histories match your user profile account.
                              </td>
                            </tr>
                          ) : (
                            payments.map((p) => (
                              <tr key={p.id} className="hover:bg-white/[0.01] transition-colors">
                                <td className="py-4 px-6 font-bold text-white">
                                  {p.id.slice(0, 10).toUpperCase()}...
                                </td>
                                <td className="py-4 px-6 text-white/60">
                                  {p.bookingId === "N/A" ? "Curated Project" : `Ref: ${p.bookingId.slice(0, 10).toUpperCase()}`}
                                </td>
                                <td className="py-4 px-6 text-luxury-gold font-bold">
                                  ${p.amount.toLocaleString()}.00
                                </td>
                                <td className="py-4 px-6 text-white/30">
                                  {p.paystackReference || p.stripePaymentIntentId || "Direct Gate Reference"}
                                </td>
                                <td className="py-4 px-6">
                                  <span className="text-[8px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border bg-green-500/10 border-green-500/20 text-green-400">
                                    {p.status}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-right">
                                  <button
                                    onClick={() => setSelectedInvoice(p)}
                                    className="px-2 py-1 bg-white/5 hover:bg-white/15 border border-white/10 text-[9px] font-mono uppercase tracking-widest rounded text-white flex items-center gap-1.5 ml-auto cursor-pointer"
                                  >
                                    <FileText className="w-3 h-3" /> View HTML
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 5: EDIT PROFILE PARAMETERS RULES */}
              {/* ============================================================== */}
              {activeTab === "settings" && (
                <div className="space-y-8">
                  <header className="border-b border-white/5 pb-4">
                    <h2 className="text-2xl font-display text-white">Profile <span className="italic text-[#d4af37]">Configuration</span></h2>
                    <p className="text-[10px] tracking-widest font-mono text-white/40 uppercase mt-1">Manage contact telemetry and aesthetic preferences</p>
                  </header>

                  <div className="max-w-2xl bg-[#0b0b0b] border border-white/5 p-8 rounded-2xl shadow-xl">
                    <form onSubmit={handleSaveProfile} className="space-y-6 text-xs font-mono">
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-white/40 block">Full Name</label>
                          <input 
                            type="text"
                            required
                            value={profile.fullName}
                            onChange={(e) => setProfile(prev => ({ ...prev, fullName: e.target.value }))}
                            placeholder="John Doe"
                            className="w-full p-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-luxury-gold text-white text-[12px]"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-white/40 block">Assigned Telephone</label>
                          <input 
                            type="tel"
                            value={profile.phoneNumber}
                            onChange={(e) => setProfile(prev => ({ ...prev, phoneNumber: e.target.value }))}
                            placeholder="+1 (555) 000-0000"
                            className="w-full p-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-luxury-gold text-white text-[12px]"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-white/40 block">Default Styling Mood Preference</label>
                        <select 
                          value={profile.themePreference}
                          onChange={(e) => setProfile(prev => ({ ...prev, themePreference: e.target.value }))}
                          className="w-full p-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-luxury-gold text-white text-[12px] cursor-pointer"
                        >
                          <option value="Cinematic Warm">Cinematic Warm (Velvet and high-contrast ambient glow)</option>
                          <option value="Classic Black & White">Classic Monochrome Noir (Timeless Rembrandt look)</option>
                          <option value="Editorial Glamour">Editorial High Fashion Vogue Style (Stark white backgrounds)</option>
                          <option value="Moody Chiaroscuro">Moody Chiaroscuro Shadows (Deep textures & focus)</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-white/40 block">Photoshoot Session Styling notes (For Jay Pictures Curation)</label>
                        <textarea
                          rows={4}
                          value={profile.creativeNotes}
                          onChange={(e) => setProfile(prev => ({ ...prev, creativeNotes: e.target.value }))}
                          placeholder="Describe outfit materials, styling concepts, or specific poses you favor..."
                          className="w-full p-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-luxury-gold text-white text-[12px] resize-none leading-relaxed"
                        />
                      </div>

                      <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                        <p className="text-[10px] text-white/35">Changes take effect across admin console panels instantly.</p>
                        
                        <button
                          type="submit"
                          disabled={isSavingProfile}
                          className="px-6 py-3 bg-[#d4af37] text-black text-[10px] uppercase tracking-widest font-mono font-bold hover:bg-opacity-95 rounded-lg transition-all cursor-pointer shadow-lg shadow-luxury-gold/5"
                        >
                          {isSavingProfile ? "Syncing..." : "Update Profile Fields"}
                        </button>
                      </div>

                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

        </main>

      </div>

      {/* ============================================================== */}
      {/* INTERACTIVE MODAL 1: HIGH-RES PHOTO LIGHTBOX INSPECTOR */}
      {/* ============================================================== */}
      <AnimatePresence>
        {selectedPhotoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPhotoUrl(null)}
            className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 backdrop-blur-sm cursor-zoom-out print:hidden"
          >
            <button
              onClick={() => setSelectedPhotoUrl(null)}
              className="absolute top-6 right-6 p-3 bg-white/5 hover:bg-white/15 border border-white/10 font-mono text-white rounded-full transition-all cursor-pointer"
              title="Close Fullscreen"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="max-w-4xl max-h-[80vh] overflow-hidden rounded-xl shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
              <img 
                src={selectedPhotoUrl} 
                alt="Enlarged curated heirloom" 
                className="max-w-full max-h-[80vh] object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="mt-6 flex gap-4" onClick={(e) => e.stopPropagation()}>
              <a
                href={selectedPhotoUrl}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 bg-luxury-gold text-black rounded text-[10px] uppercase tracking-widest font-mono font-bold flex items-center gap-2 hover:bg-opacity-90 cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Open original high resolution file
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* INTERACTIVE MODAL 2: INTERACTIVE PRINTABLE HTML INVOICE */}
      {/* ============================================================== */}
      <AnimatePresence>
        {selectedInvoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6 backdrop-blur-sm overflow-y-auto"
          >
            {/* Elegant Print Container */}
            <div className="bg-[#0b0b0b] border border-white/10 rounded-2xl max-w-2xl w-full p-8 sm:p-12 shadow-2xl space-y-8 relative my-8 print:bg-white print:text-black print:border-none">
              
              {/* Header section */}
              <div className="flex justify-between items-start border-b border-white/5 pb-8 print:border-black/5">
                <div>
                  <h3 className="text-xl font-display uppercase tracking-widest text-[#d4af37]">Jay Pictures</h3>
                  <p className="text-[10px] font-mono text-white/40 mt-1 print:text-black/50">Luxury Photography Studio & Fine-Art Darkroom</p>
                  <p className="text-[9px] font-mono text-white/30 print:text-black/40">Houston / Venice / Paris</p>
                </div>
                
                <div className="text-right font-mono text-[10px] text-white/50 space-y-1 print:text-black/70">
                  <p className="font-bold text-white text-xs uppercase print:text-black">Digital Bill Receipt</p>
                  <p>Ref: JAY-PF-{selectedInvoice.id.slice(0, 10).toUpperCase()}</p>
                  <p>Date Filed: 2026-05-20</p>
                </div>
              </div>

              {/* Client section */}
              <div className="grid grid-cols-2 gap-6 font-mono text-[10px]">
                <div className="space-y-1.5">
                  <p className="text-white/40 uppercase font-bold tracking-widest text-[8px] print:text-black/50">Billed To Patron</p>
                  <p className="text-sm font-semibold text-white print:text-black">{profile.fullName || "Esteemed Client"}</p>
                  <p className="text-white/60 print:text-black/60">{user?.email}</p>
                  {profile.phoneNumber && <p className="text-white/60 print:text-black/60">{profile.phoneNumber}</p>}
                </div>
                
                <div className="space-y-1.5">
                  <p className="text-white/40 uppercase font-bold tracking-widest text-[8px] print:text-black/50">Payment Gateway Status</p>
                  <p className="text-sm font-semibold text-green-400 font-mono uppercase">Verified Paid / Success</p>
                  <p className="text-white/60 print:text-black/60">Checkout system checkout: Paystack</p>
                  <p className="text-white/40 print:text-black/40 text-[9px]">Ref No: {selectedInvoice.paystackReference || "Direct Hook Registry"}</p>
                </div>
              </div>

              {/* Items charges grid */}
              <div className="border border-white/5 rounded-lg overflow-hidden font-mono text-[10px] print:border-black/10">
                <div className="bg-white/5 p-3 font-semibold uppercase tracking-wider text-[8px] grid grid-cols-4 border-b border-white/5 text-white/40 print:bg-black/5 print:text-black print:border-black/10">
                  <span className="col-span-2">Collection Shoot Item</span>
                  <span className="text-center">Rate / Fees</span>
                  <span className="text-right">Sum paid</span>
                </div>
                
                <div className="p-4 space-y-4 text-white/90 print:text-black">
                  <div className="grid grid-cols-4 items-center">
                    <div className="col-span-2 space-y-0.5">
                      <p className="font-bold text-white print:text-black">Curated luxury Photoshoot package</p>
                      <p className="text-[8px] text-white/35 leading-normal print:text-black/50">Rembrandt ambient studio lighting, tailored sets & digital delivered galleries.</p>
                    </div>
                    <span className="text-center text-white/70 print:text-black/70">${selectedInvoice.amount.toLocaleString()}.00 USD</span>
                    <span className="text-right font-bold text-luxury-gold print:text-black">${selectedInvoice.amount.toLocaleString()}.00 USD</span>
                  </div>
                </div>
                
                {/* Total box calculations */}
                <div className="bg-white/[0.02] border-t border-white/5 p-4 space-y-1.5 text-right font-mono text-[10px] text-white/80 print:bg-black/5 print:text-black print:border-black/10">
                  <div className="flex justify-between max-w-xs ml-auto">
                    <span>Subtotal:</span>
                    <span>${selectedInvoice.amount.toLocaleString()}.00</span>
                  </div>
                  <div className="flex justify-between max-w-xs ml-auto">
                    <span>Processing Taxes (0% Standard):</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between max-w-xs ml-auto text-sm font-bold text-[#d4af37] print:text-black border-t border-white/5 pt-1.5 mt-1.5 print:border-black/10">
                    <span>Total Net Charges:</span>
                    <span>${selectedInvoice.amount.toLocaleString()}.00 USD</span>
                  </div>
                </div>
              </div>

              {/* Thank you note */}
              <div className="text-center space-y-1 py-4 font-mono text-[9px] text-white/35 print:text-black/60 italic leading-relaxed">
                <p>"Thank you for commissioning Jay Pictures. You are an essential part of our art narrative."</p>
                <p>Digital invoice verified under high-art cryptography protocols. No physical signature required.</p>
              </div>

              {/* Controls bar hidden on print */}
              <div className="pt-6 border-t border-white/5 flex justify-end gap-3 print:hidden">
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 border border-white/10 hover:border-white/30 text-white font-mono text-[9px] uppercase tracking-widest font-bold rounded cursor-pointer transition-colors"
                >
                  Close Receipt
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-luxury-gold text-black hover:bg-opacity-90 font-mono text-[9px] uppercase tracking-widest font-bold rounded cursor-pointer transition-colors"
                >
                  Print Invoice (Ctrl + P)
                </button>
              </div>

            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
