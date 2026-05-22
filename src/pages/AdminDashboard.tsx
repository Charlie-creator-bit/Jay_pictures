import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../lib/firebase";
import { handleFirestoreError, OperationType } from "../lib/firestore-error";
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  serverTimestamp,
  writeBatch,
  getDoc,
  addDoc
} from "firebase/firestore";
import { 
  Users, 
  Camera, 
  DollarSign, 
  LayoutDashboard, 
  Database, 
  Calendar, 
  Clock, 
  Check, 
  X, 
  ChevronRight,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Menu,
  Grid,
  CreditCard,
  Image as ImageIcon,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Sliders,
  Inbox,
  Send,
  Download,
  Search,
  CheckSquare,
  FileText
} from "lucide-react";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";

// Responsive charts from Recharts
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

// High-art premium preset images for rapid premium client deliverables seating
const BRAND_PRESET_IMAGES = [
  { url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=800", filename: "Editorial-Gold-Vogue.jpg" },
  { url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800", filename: "Rembrandt-Client-Portrait.jpg" },
  { url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800", filename: "Cinematic-Noir-Studio.jpg" },
  { url: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=800", filename: "Venezia-Art-Exhibition.jpg" },
  { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800", filename: "Classic-Tuxedo-Monochrome.jpg" },
  { url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=800", filename: "Modernist-Stark-Profile.jpg" }
];

interface Booking {
  id: string;
  clientId: string;
  serviceId: string;
  bookingDate: string; 
  status: "pending" | "confirmed" | "cancelled" | "completed";
  totalAmount: number;
  clientName?: string;
  clientEmail?: string;
  serviceTitle?: string;
}

interface Payment {
  id: string;
  bookingId: string;
  clientId: string;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "refunded";
  stripePaymentIntentId?: string;
  paystackReference?: string;
  paidCurrency?: string;
  paidAmountLocal?: number;
  amountType?: string;
  createdAt: any;
}

interface Service {
  id: string;
  title: string;
  price: number;
  durationMinutes: number;
  description: string;
  isActive: boolean;
}

interface ClientUser {
  id: string;
  fullName?: string;
  email?: string;
  role?: string;
  createdAt?: any;
}

interface GalleryDoc {
  id: string;
  clientId: string;
  bookingId: string;
  title: string;
  images: Array<{ url: string; filename: string }>;
  createdAt?: any;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  
  // Dashboard overall arrays
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<ClientUser[]>([]);
  const [galleries, setGalleries] = useState<GalleryDoc[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "bookings" | "clients" | "services" | "calendar" | "payments">("dashboard");
  
  // Mobile navigation toggler
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Status/Admin utility notifications
  const [dbStatusMsg, setDbStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Admin Form details for Service editor
  const [newSvcId, setNewSvcId] = useState("");
  const [newSvcTitle, setNewSvcTitle] = useState("");
  const [newSvcPrice, setNewSvcPrice] = useState(1500);
  const [newSvcDuration, setNewSvcDuration] = useState(180);
  const [newSvcDesc, setNewSvcDesc] = useState("");
  const [editorLoading, setEditorLoading] = useState(false);

  // Gallery Uploader Form Details
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [galleryTitle, setGalleryTitle] = useState("Venice Vows");
  const [uploadedImages, setUploadedImages] = useState<Array<{ url: string; filename: string }>>([]);
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [customImageName, setCustomImageName] = useState("");

  // Search queries
  const [bookingFilterStatus, setBookingFilterStatus] = useState<string>("all");
  const [bookingSearch, setBookingSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");

  // Seed loading triggers
  const [isSeeding, setIsSeeding] = useState(false);
  const [isGeneratingSlots, setIsGeneratingSlots] = useState(false);

  // Calendar timeslots State
  const [calendarSlots, setCalendarSlots] = useState<any[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [selectedDateForSlots, setSelectedDateForSlots] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });

  // Fetch full metrics
  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Photography Services
      const servicesSnap = await getDocs(collection(db, "services"));
      const sMap: Record<string, string> = {};
      const sList: Service[] = [];
      servicesSnap.forEach(d => {
        const data = d.data();
        sMap[d.id] = data.title;
        sList.push({
          id: d.id,
          title: data.title || "Custom Shoot",
          price: data.price || 0,
          durationMinutes: data.durationMinutes || 120,
          description: data.description || "",
          isActive: data.isActive !== false
        });
      });
      setServices(sList);

      // 2. Fetch Users
      const usersSnap = await getDocs(collection(db, "users"));
      const uMap: Record<string, { name: string; email: string }> = {};
      const cList: ClientUser[] = [];
      usersSnap.forEach(d => {
        const data = d.data();
        uMap[d.id] = {
          name: data.fullName || "Guest Patron",
          email: data.email || ""
        };
        cList.push({
          id: d.id,
          fullName: data.fullName || "Guest Patron",
          email: data.email || "",
          role: data.role || "client",
          createdAt: data.createdAt
        });
      });
      setClients(cList);

      // 3. Fetch Bookings
      const bookingsSnap = await getDocs(collection(db, "bookings"));
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
          clientName: uMap[data.clientId]?.name || "Anonymous Client",
          clientEmail: uMap[data.clientId]?.email || "",
          serviceTitle: sMap[data.serviceId] || "Creative Shoot",
        });
      });
      // Sort bookings chronologically descending (newest first)
      bList.sort((a,b) => b.bookingDate.localeCompare(a.bookingDate));
      setBookings(bList);

      // 4. Fetch Payments Ledger
      const paymentsSnap = await getDocs(collection(db, "payments"));
      const pList: Payment[] = [];
      paymentsSnap.forEach(d => {
        const data = d.data();
        pList.push({
          id: d.id,
          bookingId: data.bookingId || "N/A",
          clientId: data.clientId || "N/A",
          amount: data.amount || 0,
          currency: data.currency || "USD",
          status: data.status || "pending",
          stripePaymentIntentId: data.stripePaymentIntentId || "",
          paystackReference: data.paystackReference || "",
          paidAmountLocal: data.paidAmountLocal || 0,
          paidCurrency: data.paidCurrency || "",
          amountType: data.amountType || "full",
          createdAt: data.createdAt,
        });
      });
      setPayments(pList);

      // 5. Fetch Client Galleries
      const galleriesSnap = await getDocs(collection(db, "galleries"));
      const gList: GalleryDoc[] = [];
      galleriesSnap.forEach(d => {
        const data = d.data();
        gList.push({
          id: d.id,
          clientId: data.clientId,
          bookingId: data.bookingId,
          title: data.title,
          images: data.images || [],
          createdAt: data.createdAt,
        });
      });
      setGalleries(gList);

    } catch (err: any) {
      console.error("Critical error building admin records:", err);
      setDbStatusMsg({ type: "error", text: "Failed loading database nodes. Ensure Firestore is provisioned." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Fetch timeslots on date change or calendar state check
  const fetchCalendarSlotsForDate = async (dateStr: string) => {
    setCalendarLoading(true);
    try {
      const qSlots = query(collection(db, "availability"), where("date", "==", dateStr));
      const sSnap = await getDocs(qSlots);
      const listSlots: any[] = [];
      sSnap.forEach(d => {
        listSlots.push({
          id: d.id,
          ...d.data()
        });
      });
      listSlots.sort((a, b) => a.time.localeCompare(b.time));
      setCalendarSlots(listSlots);
    } catch (err) {
      console.error("Error loading slots:", err);
    } finally {
      setCalendarLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarSlotsForDate(selectedDateForSlots);
  }, [selectedDateForSlots]);

  // Seeding Photography Services
  const handlePreseedPackages = async () => {
    setIsSeeding(true);
    setDbStatusMsg(null);
    try {
      const servicesList = [
        {
          id: "editorial",
          title: "Editorial Collection",
          price: 1500,
          durationMinutes: 240,
          description: "4 Hour Studio Session. Specialized in portrait character styling with rich cinematic lighting, Rembrandt frames, and commercial-grade usage permission.",
          isActive: true
        },
        {
          id: "cinematic",
          title: "Cinematic Collection",
          price: 3500,
          durationMinutes: 480,
          description: "Full Day Location Shoot. Complete with our master styling team, 25 high-end physical prints, atmospheric BTS footage, and private heirloom archiving.",
          isActive: true
        },
        {
          id: "curated",
          title: "Curated Collection",
          price: 7500,
          durationMinutes: 720,
          description: "Multi-Day Destination Shoot. Includes comprehensive styling direction, infinite museum-grade physical frames, leather binder, and personal art support.",
          isActive: true
        }
      ];

      for (const svc of servicesList) {
        await setDoc(doc(db, "services", svc.id), {
          title: svc.title,
          price: svc.price,
          durationMinutes: svc.durationMinutes,
          description: svc.description,
          isActive: svc.isActive,
          createdAt: serverTimestamp(),
        });
      }

      setDbStatusMsg({ type: "success", text: "Database services populated successfully! Re-query complete." });
      fetchAllData();
    } catch (err: any) {
      setDbStatusMsg({ type: "error", text: "Database preseed failed: " + err.message });
    } finally {
      setIsSeeding(false);
    }
  };

  // Seeding availability slots for next 30 days
  const handleGenerateSlots = async () => {
    setIsGeneratingSlots(true);
    setDbStatusMsg(null);
    try {
      const batch = writeBatch(db);
      const times = ["09:00", "11:00", "14:00", "16:00", "19:00"];
      
      for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;

        for (const t of times) {
          const slotId = `${dateStr}_${t.replace(":", "")}`;
          const slotRef = doc(db, "availability", slotId);
          batch.set(slotRef, {
            date: dateStr,
            time: t,
            isBooked: false,
          });
        }
      }

      await batch.commit();
      setDbStatusMsg({ type: "success", text: "Prepopulated 150 hours across 30 days! Calendar synced." });
      fetchCalendarSlotsForDate(selectedDateForSlots);
    } catch (err: any) {
      setDbStatusMsg({ type: "error", text: "Timeslots generation failed: " + err.message });
    } finally {
      setIsGeneratingSlots(false);
    }
  };

  // Approval/Status triggers
  const handleUpdateStatus = async (bookingId: string, newStatus: "confirmed" | "completed" | "cancelled", dateStr?: string, timeStr?: string) => {
    setDbStatusMsg(null);
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      await updateDoc(bookingRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      // Release booked slot inside database if cancelled
      if (newStatus === "cancelled" && dateStr && timeStr) {
        const dStr = dateStr.split("T")[0];
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

      // Re-trigger notifications for clients
      const targetB = bookings.find(b => b.id === bookingId);
      if (targetB) {
        const notifId = doc(collection(db, "notifications")).id;
        await setDoc(doc(db, "notifications", notifId), {
          recipientId: targetB.clientId,
          title: `Session ${newStatus.toUpperCase()}`,
          message: `Your booking order for ${targetB.serviceTitle} is now marked ${newStatus.toUpperCase()}. Contact your coordinator for visual planning.`,
          isRead: false,
          type: "status_update",
          createdAt: serverTimestamp()
        });
      }

      setDbStatusMsg({ type: "success", text: `Booking set to ${newStatus} with real-time updates.` });

      // Automatically dispatch email notifications when status changes
      if (newStatus === "confirmed") {
        fetch("/api/notifications/booking-confirmed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId })
        }).catch(err => console.error("Background booking confirmed email error:", err));
      }

      fetchAllData();
    } catch (err: any) {
      setDbStatusMsg({ type: "error", text: err.message || "Approval status modification error." });
    }
  };

  // Dispatch live shoot reminder via Resend
  const handleSendReminder = async (bookingId: string) => {
    try {
      setDbStatusMsg({ type: "success", text: "Dispatching branded reminder email payload to patron..." });
      const response = await fetch("/api/notifications/booking-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, reminderScope: "Tomorrow" })
      });
      const data = await response.json();
      if (data.success) {
        setDbStatusMsg({ type: "success", text: "Branded shoot reminder successfully delivered via Resend API!" });
      } else {
        setDbStatusMsg({ type: "error", text: "Resend pipeline error: " + (data.details || "SMTP limit or API bypass.") });
      }
    } catch (err: any) {
      setDbStatusMsg({ type: "error", text: "Failed reaching notice server: " + err.message });
    }
  };


  // Manage timeslot manually (Block/Unblock)
  const handleToggleTimeslotManual = async (slotId: string, currentBooked: boolean) => {
    try {
      const slotRef = doc(db, "availability", slotId);
      await updateDoc(slotRef, {
        isBooked: !currentBooked,
        bookingId: !currentBooked ? "MANUAL_STUDIO_BLOCK" : ""
      });
      setDbStatusMsg({ type: "success", text: "Timeslot allocation tweaked successfully." });
      fetchCalendarSlotsForDate(selectedDateForSlots);
    } catch (err: any) {
      setDbStatusMsg({ type: "error", text: "Allocation toggle error: " + err.message });
    }
  };

  // Create new Photo Service package
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSvcId || !newSvcTitle || !newSvcPrice) {
      setDbStatusMsg({ type: "error", text: "ID, Title, and Base Price must be fully filled out." });
      return;
    }
    setEditorLoading(true);
    setDbStatusMsg(null);
    try {
      await setDoc(doc(db, "services", newSvcId.toLowerCase().trim()), {
        title: newSvcTitle,
        price: Number(newSvcPrice),
        durationMinutes: Number(newSvcDuration),
        description: newSvcDesc,
        isActive: true,
        createdAt: serverTimestamp()
      });
      setDbStatusMsg({ type: "success", text: "New luxury photoshoot collection registered!" });
      setNewSvcId("");
      setNewSvcTitle("");
      setNewSvcPrice(1500);
      setNewSvcDuration(180);
      setNewSvcDesc("");
      fetchAllData();
    } catch (err: any) {
      setDbStatusMsg({ type: "error", text: err.message || "Failed saving new collection configuration." });
    } finally {
      setEditorLoading(false);
    }
  };

  // Delete Service package
  const handleDeleteService = async (svcId: string) => {
    if (!window.confirm("Are you sure you want to delete this studio package? Clients will no longer be able to select it.")) return;
    try {
      await deleteDoc(doc(db, "services", svcId));
      setDbStatusMsg({ type: "success", text: "Photography collection deleted from catalog." });
      fetchAllData();
    } catch (err: any) {
      setDbStatusMsg({ type: "error", text: "Deletion error: " + err.message });
    }
  };

  // Add sample preset image to uploaded pool
  const addPresetImage = (preset: { url: string; filename: string }) => {
    if (uploadedImages.some(img => img.url === preset.url)) return;
    setUploadedImages(prev => [...prev, preset]);
  };

  // Add custom internet URL item
  const addCustomImage = () => {
    if (!customImageUrl) return;
    const filename = customImageName.trim() || `Asset-${Math.floor(Math.random() * 1000)}.jpg`;
    setUploadedImages(prev => [...prev, { url: customImageUrl, filename }]);
    setCustomImageUrl("");
    setCustomImageName("");
  };

  // Deploy dynamic gallery assets to particular user for their client portal
  const handleDeployGallery = async () => {
    if (!selectedClientId) {
       setDbStatusMsg({ type: "error", text: "Please pick a target client to attach deliverables to." });
       return;
    }
    if (uploadedImages.length === 0) {
       setDbStatusMsg({ type: "error", text: "Upload gallery list cannot be empty. Match presets or custom URLs." });
       return;
    }

    try {
       const galleryId = doc(collection(db, "galleries")).id;
       await setDoc(doc(db, "galleries", galleryId), {
          clientId: selectedClientId,
          bookingId: selectedBookingId || "STANDALONE_PROJECT",
          title: galleryTitle || "Venice Vows Archive",
          images: uploadedImages,
          createdAt: serverTimestamp()
       });

       setDbStatusMsg({ type: "success", text: "Highly aesthetic digital gallery successfully deployed to user's collection!" });

       // Asynchronously dispatch premium Resend notification email about the gallery delivery
       fetch("/api/notifications/gallery-delivered", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           clientId: selectedClientId,
           galleryTitle: galleryTitle || "Venice Vows Archive",
           photosCount: uploadedImages.length
         })
       }).catch(err => console.error("Background gallery email dispatch error:", err));
       // Clean form
       setUploadedImages([]);
       setGalleryTitle("Venice Vows");
       setSelectedClientId("");
       setSelectedBookingId("");
       fetchAllData();
    } catch (err: any) {
       setDbStatusMsg({ type: "error", text: "Gallery seating failure: " + err.message });
    }
  };

  // Clear single image out of staging pool
  const removeStagedImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Quick helper to fetch client profile metrics
  const getClientBookingsAndGalleryCount = (clientId: string) => {
    const matchedBookings = bookings.filter(b => b.clientId === clientId);
    const matchedGalleryDocs = galleries.filter(g => g.clientId === clientId);
    const totalAssetsDelivered = matchedGalleryDocs.reduce((count, g) => count + g.images.length, 0);
    return {
      bookingsCount: matchedBookings.length,
      galleriesCount: matchedGalleryDocs.length,
      assetsCount: totalAssetsDelivered
    };
  };

  // Calculation Metrics for Analytics Dashboard
  const analyticsMetrics = () => {
    const totalSessions = bookings.length;
    const uniqueClientsVal = clients.length;
    
    // Total Revenue sums up all payments set to "paid" (or Paystack success checks)
    const totalRevenue = payments
      .filter(p => p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingRevenue = bookings
      .filter(b => b.status === "pending")
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const completedBookings = bookings.filter(b => b.status === "completed").length;
    const confirmedBookings = bookings.filter(b => b.status === "confirmed").length;
    const pendingBookings = bookings.filter(b => b.status === "pending").length;
    const cancelledBookings = bookings.filter(b => b.status === "cancelled").length;

    // Chart 1: Revenue Timeline (Monthly simulated index matching payments)
    const monthlyRevenueData = [
      { name: "Jan", revenue: totalRevenue * 0.1 },
      { name: "Feb", revenue: totalRevenue * 0.15 },
      { name: "Mar", revenue: totalRevenue * 0.25 },
      { name: "Apr", revenue: totalRevenue * 0.35 },
      { name: "May", revenue: totalRevenue * 1.0 }, // Peak current month
    ];

    // Chart 2: Popularity breakdown by package selection
    const packagePopularity = services.map(s => {
      const count = bookings.filter(b => b.serviceId === s.id).length;
      return {
        name: s.title.replace(" Collection", ""),
        value: count,
        income: count * s.price
      };
    });

    // Chart 3: Booking ratios
    const bookingRatios = [
      { name: "Pending", value: pendingBookings, color: "#eab308" },
      { name: "Confirmed", value: confirmedBookings, color: "#22c55e" },
      { name: "Completed", value: completedBookings, color: "#3b82f6" },
      { name: "Cancelled", value: cancelledBookings, color: "#ef4444" }
    ];

    return {
      totalSessions,
      uniqueClientsVal,
      totalRevenue,
      pendingRevenue,
      completedBookings,
      pendingBookings,
      monthlyRevenueData,
      packagePopularity,
      bookingRatios
    };
  };

  const metrics = analyticsMetrics();

  // Filters logic
  const filteredBookings = bookings.filter(b => {
    const matchesStatus = bookingFilterStatus === "all" || b.status === bookingFilterStatus;
    const matchesSearch = b.clientName?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
                          b.serviceTitle?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
                          b.id.toLowerCase().includes(bookingSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredClients = clients.filter(c => {
    return c.fullName?.toLowerCase().includes(clientSearch.toLowerCase()) ||
           c.email?.toLowerCase().includes(clientSearch.toLowerCase()) ||
           c.id.toLowerCase().includes(clientSearch.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-luxury-black text-white selection:bg-luxury-gold/30 selection:text-white">
      
      {/* Upper Navigation Spacer */}
      <div className="h-20 border-b border-white/5 print:hidden" />

      {/* Main SaaS Responsive Flexbox Container */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">

        {/* ----------------- SIDEBAR NAVIGATION ----------------- */}
        <aside className="w-full lg:w-72 bg-black/60 border-r border-white/5 p-6 flex flex-col gap-8 shrink-0 print:hidden">
          
          {/* Studio Quick Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-luxury-gold/10 border border-luxury-gold/20 rounded-lg text-luxury-gold">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-display text-sm tracking-wide">Studio Control</h4>
                <p className="text-[9px] uppercase tracking-widest text-[#d4af37] font-bold">Jay Pictures Hub</p>
              </div>
            </div>

            {/* Mobile Trigger Burger */}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-white/60 hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items Container (Responsive Drawer on Mobile, static on Desktop) */}
          <nav className={`${sidebarOpen ? "block" : "hidden"} lg:block space-y-1.5 transition-all`}>
            
            <button
              onClick={() => { setActiveTab("dashboard"); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider font-sans transition-all text-left ${
                activeTab === "dashboard"
                  ? "bg-luxury-gold text-black shadow-lg shadow-luxury-gold/10 font-black"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </button>

            <button
              onClick={() => { setActiveTab("bookings"); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider font-sans transition-all text-left ${
                activeTab === "bookings"
                  ? "bg-luxury-gold text-black shadow-lg shadow-luxury-gold/10 font-black"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <Camera className="w-4 h-4" />
              Bookings & Reviews
              {bookings.filter(b => b.status === "pending").length > 0 && (
                <span className="ml-auto bg-yellow-500 text-black font-semibold rounded-full w-4 h-4 text-[8px] flex items-center justify-center animate-pulse">
                  {bookings.filter(b => b.status === "pending").length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab("clients"); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider font-sans transition-all text-left ${
                activeTab === "clients"
                  ? "bg-luxury-gold text-black shadow-lg shadow-luxury-gold/10 font-black"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <Users className="w-4 h-4" />
              Patron Galleries
            </button>

            <button
              onClick={() => { setActiveTab("services"); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider font-sans transition-all text-left ${
                activeTab === "services"
                  ? "bg-luxury-gold text-black shadow-lg shadow-luxury-gold/10 font-black"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <Database className="w-4 h-4" />
              Studio Collections
            </button>

            <button
              onClick={() => { setActiveTab("calendar"); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider font-sans transition-all text-left ${
                activeTab === "calendar"
                  ? "bg-luxury-gold text-black shadow-lg shadow-luxury-gold/10 font-black"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <Calendar className="w-4 h-4" />
              Hour Allocation
            </button>

            <button
              onClick={() => { setActiveTab("payments"); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider font-sans transition-all text-left ${
                activeTab === "payments"
                  ? "bg-luxury-gold text-black shadow-lg shadow-luxury-gold/10 font-black"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Paystack Ledger
            </button>

          </nav>

          {/* Quick Stats Block */}
          <div className="mt-auto hidden lg:block border-t border-white/5 pt-6 space-y-4 font-mono text-[10px] text-white/40">
            <p className="uppercase tracking-widest text-[8px] font-bold text-luxury-gold">Environment Info</p>
            <div className="flex justify-between">
              <span>Database Sync:</span>
              <span className="text-green-400 font-bold flex items-center gap-1">● ON</span>
            </div>
            <div className="flex justify-between">
              <span>Total Clients:</span>
              <span className="text-white font-bold">{clients.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Paystack Hook:</span>
              <span className="text-white/80">Active Crypt</span>
            </div>
          </div>

        </aside>

        {/* ----------------- CORE DATA VIEWPANEL ----------------- */}
        <main className="flex-1 p-8 lg:p-12 overflow-x-hidden">

          {/* Notification Banner Bar */}
          <AnimatePresence>
            {dbStatusMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 border rounded-xl flex items-center gap-3 text-xs mb-8 print:hidden ${
                  dbStatusMsg.type === "success" 
                    ? "bg-green-500/10 border-green-500/30 text-green-400" 
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}
              >
                {dbStatusMsg.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{dbStatusMsg.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading Overlayer fallback */}
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-4 text-white/30 text-xs font-mono">
              <div className="w-8 h-8 border-2 border-t-white border-white/10 rounded-full animate-spin" />
              Searching global collection schemas...
            </div>
          ) : (
            <div className="space-y-12">
              
              {/* ============================================================== */}
              {/* TAB 1: OVERVIEW DASHBOARD */}
              {/* ============================================================== */}
              {activeTab === "dashboard" && (
                <div className="space-y-12">
                  <header>
                    <h1 className="text-3xl font-display mb-2">Metrics <span className="italic">Chronology</span></h1>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Studio Performance Summary</p>
                  </header>

                  {/* KPI Quick Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <GlassCard hover={false} className="p-6 relative overflow-hidden flex items-center gap-5">
                      <div className="p-3.5 bg-luxury-gold/10 border border-luxury-gold/20 rounded-xl text-luxury-gold">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-white/40">Verified Income</p>
                        <p className="text-2xl font-display mt-0.5 text-white">${metrics.totalRevenue.toLocaleString()}</p>
                      </div>
                    </GlassCard>

                    <GlassCard hover={false} className="p-6 relative overflow-hidden flex items-center gap-5">
                      <div className="p-3.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-500">
                        <Inbox className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-white/40">In Review Booking</p>
                        <p className="text-2xl font-display mt-0.5 text-white">{metrics.pendingBookings} Shoots</p>
                      </div>
                    </GlassCard>

                    <GlassCard hover={false} className="p-6 relative overflow-hidden flex items-center gap-5">
                      <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
                        <Camera className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-white/40">Total Sessions</p>
                        <p className="text-2xl font-display mt-0.5 text-white">{metrics.totalSessions} Reserved</p>
                      </div>
                    </GlassCard>

                    <GlassCard hover={false} className="p-6 relative overflow-hidden flex items-center gap-5">
                      <div className="p-3.5 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-white/40">Patron Pool</p>
                        <p className="text-2xl font-display mt-0.5 text-white">{metrics.uniqueClientsVal} Accounts</p>
                      </div>
                    </GlassCard>
                  </div>

                  {/* Recharts Analytics Charts Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Area Chart: Revenue Trend */}
                    <GlassCard hover={false} className="lg:col-span-2 p-6 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-luxury-gold">Transaction Progression (USD)</h4>
                      <div className="h-64 font-mono text-[10px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={metrics.monthlyRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                            <XAxis dataKey="name" stroke="#555" />
                            <YAxis stroke="#555" />
                            <Tooltip contentStyle={{ backgroundColor: "#111", borderColor: "#333", color: "#fff" }} />
                            <Area type="monotone" dataKey="revenue" stroke="#d4af37" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </GlassCard>

                    {/* Simple Pie Chart: Ratio status */}
                    <GlassCard hover={false} className="p-6 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-luxury-gold">Studio Slot Status Ratios</h4>
                      <div className="h-64 flex flex-col justify-center items-center">
                        <div className="h-44 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={metrics.bookingRatios}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={60}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {metrics.bookingRatios.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: "#111", borderColor: "#333", color: "#fff" }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        
                        {/* Legend list */}
                        <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center font-mono text-[9px] text-white/60">
                          {metrics.bookingRatios.map(r => (
                            <div key={r.name} className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                              <span>{r.name} ({r.value})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </GlassCard>

                    {/* Bar Chart: popular collections */}
                    <GlassCard hover={false} className="lg:col-span-3 p-6 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-luxury-gold">Active Session Distributions & Projected Ledger ($)</h4>
                      <div className="h-60 font-mono text-[10px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={metrics.packagePopularity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                            <XAxis dataKey="name" stroke="#666" />
                            <YAxis stroke="#666" />
                            <Tooltip contentStyle={{ backgroundColor: "#111", borderColor: "#333", color: "#fff" }} />
                            <Legend />
                            <Bar dataKey="value" name="Session Volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="income" name="Income Gained ($)" fill="#d4af37" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </GlassCard>
                  </div>

                  {/* DB Seeding Fallback helper (if empty data) */}
                  {bookings.length === 0 && (
                    <div className="p-8 border border-white/5 bg-white/[0.01] rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="space-y-1 text-center md:text-left">
                        <h4 className="text-sm font-bold text-luxury-gold flex items-center gap-2 justify-center md:justify-start">
                          <CheckCircle className="w-4 h-4 text-yellow-500" /> Preseed Schema Sandbox
                        </h4>
                        <p className="text-xs text-white/50 max-w-lg">
                          Fill your studio environment with sample collections, client mock listings, and hours to visualize the luxury theme layout.
                        </p>
                      </div>
                      <div className="flex gap-3 shrink-0">
                        <button
                          disabled={isSeeding}
                          onClick={handlePreseedPackages}
                          className="px-4 py-2 border border-white/10 text-white hover:border-[#d4af37] text-xs font-bold tracking-widest rounded-lg cursor-pointer transition-colors"
                        >
                          {isSeeding ? "Syncing..." : "Seed Collections"}
                        </button>
                        <button
                          disabled={isGeneratingSlots}
                          onClick={handleGenerateSlots}
                          className="px-4 py-2 bg-[#d4af37] text-black text-xs font-bold tracking-widest rounded-lg cursor-pointer hover:bg-opacity-90 transition-opacity"
                        >
                          {isGeneratingSlots ? "Filing..." : "Deploy 150 Timeslots"}
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 2: ACTIVE BOOKINGS MANAGER */}
              {/* ============================================================== */}
              {activeTab === "bookings" && (
                <div className="space-y-8">
                  <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
                    <div>
                      <h1 className="text-3xl font-display mb-1">Archived <span className="italic">Reservations</span></h1>
                      <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Process incoming orders & reviews</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type="text"
                          value={bookingSearch}
                          onChange={(e) => setBookingSearch(e.target.value)}
                          placeholder="Search bookings or patrons..."
                          className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-luxury-gold w-48 sm:w-64"
                        />
                      </div>

                      <select
                        value={bookingFilterStatus}
                        onChange={(e) => setBookingFilterStatus(e.target.value)}
                        className="p-2 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-luxury-gold cursor-pointer"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending Review</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </header>

                  {/* Bookings Data Table */}
                  <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-white/5 text-white/40 uppercase font-bold text-[9px] tracking-widest">
                            <th className="py-4 px-6">ID / Patron</th>
                            <th className="py-4 px-6">Shoot Collection</th>
                            <th className="py-4 px-6">Assigned Hour / Date</th>
                            <th className="py-4 px-6">Amount (USD)</th>
                            <th className="py-4 px-6">Status</th>
                            <th className="py-4 px-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono text-[11px] text-white/80">
                          {filteredBookings.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-12 px-6 text-center text-white/30 text-xs">
                                No verified session logs match this query status.
                              </td>
                            </tr>
                          ) : (
                            filteredBookings.map((b) => {
                              const [dateStr, timeStr] = b.bookingDate.split("T");
                              return (
                                <tr key={b.id} className="hover:bg-white/[0.01] transition-colors">
                                  <td className="py-4 px-6">
                                    <p className="font-serif font-bold text-white text-sm">{b.clientName}</p>
                                    <p className="text-[9px] text-white/35 mt-0.5">{b.clientEmail || `Ref: ${b.id.slice(0, 10)}...`}</p>
                                  </td>
                                  <td className="py-4 px-6 text-luxury-gold font-sans font-medium text-xs">
                                    {b.serviceTitle}
                                  </td>
                                  <td className="py-4 px-6">
                                    <p className="font-semibold text-white/90">{dateStr}</p>
                                    <p className="text-[10px] text-white/40 mt-0.5">Hour: {timeStr ? timeStr.slice(0, 5) : "09:00"}</p>
                                  </td>
                                  <td className="py-4 px-6 text-white font-semibold">
                                    ${b.totalAmount.toLocaleString()}
                                  </td>
                                  <td className="py-4 px-6">
                                    <span className={`text-[8px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                                      b.status === "confirmed" 
                                        ? "bg-green-500/10 border-green-500/20 text-green-400"
                                        : b.status === "completed"
                                          ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                          : b.status === "cancelled"
                                            ? "bg-red-500/10 border-red-500/20 text-red-500"
                                            : "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
                                    }`}>
                                      {b.status}
                                    </span>
                                  </td>
                                  <td className="py-4 px-6 text-right space-x-1.5 shrink-0">
                                    {/* Action items based on state */}
                                    {b.status === "pending" && (
                                      <>
                                        <button
                                          onClick={() => handleUpdateStatus(b.id, "confirmed")}
                                          className="px-2.5 py-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded text-green-400 text-[10px] uppercase font-bold tracking-widest cursor-pointer transition-colors"
                                          title="Approve / Confirm"
                                        >
                                          Confirm
                                        </button>
                                        <button
                                          onClick={() => handleUpdateStatus(b.id, "cancelled", b.bookingDate, timeStr)}
                                          className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded text-red-400 text-[10px] uppercase font-bold tracking-widest cursor-pointer transition-colors"
                                          title="Decline"
                                        >
                                          Decline
                                        </button>
                                      </>
                                    )}

                                    {b.status === "confirmed" && (
                                      <>
                                        <button
                                        onClick={() => handleUpdateStatus(b.id, "completed")}
                                        className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded text-blue-400 text-[10px] uppercase font-bold tracking-widest cursor-pointer transition-colors"
                                      >
                                        Mark Completed
                                      </button>
                                      <button
                                        onClick={() => handleSendReminder(b.id)}
                                        className="inline-flex items-center px-2.5 py-1.5 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 border border-[#d4af37]/20 rounded text-[#d4af37] text-[10px] uppercase font-bold tracking-widest cursor-pointer transition-colors ml-1.5"
                                        title="Send Shoot Reminder Email"
                                      >
                                        Remind
                                      </button>
                                    </>
                                    )}

                                    {/* Standalone quick delete capability if cancelled */}
                                    {b.status === "cancelled" && (
                                      <span className="text-white/20 italic text-[10px]">Cancelled</span>
                                    )}

                                    {b.status === "completed" && (
                                      <span className="text-green-400 italic text-[10px] flex items-center justify-end gap-1">
                                         <Check className="w-3.5 h-3.5" /> Handed Over
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 3: CLIENT GALLERIES DEPLOYMENT */}
              {/* ============================================================== */}
              {activeTab === "clients" && (
                <div className="space-y-12">
                  <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
                    <div>
                      <h1 className="text-3xl font-display mb-1">Delivered <span className="italic">Portfolios</span></h1>
                      <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Deploy photorealistic galleries to custom accounts</p>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type="text"
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        placeholder="Filter client accounts..."
                        className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-luxury-gold w-48 sm:w-64"
                      />
                    </div>
                  </header>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* List of Client profiles */}
                    <div className="lg:col-span-1 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-luxury-gold">Active Patron Directory</h4>
                      
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                        {filteredClients.length === 0 ? (
                           <p className="text-xs text-white/30 font-mono italic">No clients registered matching this term.</p>
                        ) : (
                          filteredClients.map((client) => {
                            const { bookingsCount, galleriesCount, assetsCount } = getClientBookingsAndGalleryCount(client.id);
                            const isPicked = selectedClientId === client.id;
                            return (
                              <button
                                type="button"
                                key={client.id}
                                onClick={() => {
                                  setSelectedClientId(client.id);
                                  // Auto find booking for selection
                                  const cBooking = bookings.find(b => b.clientId === client.id && b.status === "completed");
                                  setSelectedBookingId(cBooking ? cBooking.id : "STANDALONE_PROJECT");
                                }}
                                className={`w-full p-4 border rounded-xl text-left transition-all flex flex-col gap-2 ${
                                  isPicked
                                    ? "bg-luxury-gold/5 border-luxury-gold text-white"
                                    : "border-white/5 bg-white/[0.01] hover:border-white/10 text-white/80"
                                }`}
                              >
                                <div className="flex justify-between items-start w-full">
                                  <div>
                                    <p className="font-serif font-bold text-sm text-white">{client.fullName}</p>
                                    <p className="text-[10px] text-white/40 font-mono">{client.email}</p>
                                  </div>
                                  {isPicked && <span className="p-1 bg-luxury-gold text-black rounded text-[8px] uppercase tracking-widest font-bold">Selected</span>}
                                </div>

                                <div className="flex gap-4 font-mono text-[9px] border-t border-white/5 pt-2 mt-1 text-white/40 justify-between w-full">
                                  <span>Reserved: <strong className="text-white">{bookingsCount}</strong></span>
                                  <span>Galleries: <strong className="text-white">{galleriesCount}</strong></span>
                                  <span>Paid Assets: <strong className="text-[#d4af37]">{assetsCount}</strong></span>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Highly Interactive Multi Asset Gallery Delivery Uploader */}
                    <div className="lg:col-span-2 space-y-6">
                      <GlassCard hover={false} className="p-6 space-y-6">
                        <div className="border-b border-white/5 pb-4">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-luxury-gold">Asset Deployer Console</h4>
                          <p className="text-[10.5px] text-white/45 mt-0.5">Deploy curated luxury imagery grids to selected client dash.</p>
                        </div>

                        {selectedClientId ? (
                          <div className="space-y-6">
                            
                            {/* Visual Form elements */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              
                              <div>
                                <label className="block text-[9px] uppercase tracking-widest font-bold text-white/40 mb-1.5">Deliverable Title Name</label>
                                <input
                                  type="text"
                                  value={galleryTitle}
                                  onChange={(e) => setGalleryTitle(e.target.value)}
                                  placeholder="e.g. Venice Vows, Rembrandt Series"
                                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-xs font-mono text-white focus:outline-none focus:border-luxury-gold"
                                />
                              </div>

                              <div>
                                <label className="block text-[9px] uppercase tracking-widest font-bold text-white/40 mb-1.5">Link to Shoot Booking (Optional)</label>
                                <select
                                  value={selectedBookingId}
                                  onChange={(e) => setSelectedBookingId(e.target.value)}
                                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs font-mono text-white focus:outline-none focus:border-luxury-gold cursor-pointer"
                                >
                                  <option value="STANDALONE_PROJECT">Standalone Project (No Booking Reference)</option>
                                  {bookings
                                    .filter(b => b.clientId === selectedClientId)
                                    .map(b => (
                                      <option key={b.id} value={b.id}>
                                        {b.serviceTitle} ({b.bookingDate.split("T")[0]})
                                      </option>
                                    ))
                                  }
                                </select>
                              </div>

                            </div>

                            {/* Preset images loader */}
                            <div className="space-y-2">
                              <label className="block text-[9px] uppercase tracking-widest font-bold text-white/40">Seeding Preset Luxury Assets</label>
                              <p className="text-[10px] text-white/30 italic">Click presets to instantly staging fashion profiles.</p>
                              
                              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                {BRAND_PRESET_IMAGES.map((preset, idx) => (
                                  <button
                                    type="button"
                                    key={idx}
                                    onClick={() => addPresetImage(preset)}
                                    className="aspect-square rounded border border-white/10 hover:border-luxury-gold overflow-hidden relative group cursor-pointer"
                                  >
                                    <img src={preset.url} alt="preset" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Plus className="w-4 h-4 text-white" />
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Custom File Upload Simulate URL */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
                              <span className="text-[8px] uppercase tracking-widest font-mono font-bold text-white/40 block">Manually Add Photo URL Path</span>
                              <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                  type="text"
                                  value={customImageUrl}
                                  onChange={(e) => setCustomImageUrl(e.target.value)}
                                  placeholder="Paste https://images.unsplash.com/... or cloud link"
                                  className="flex-1 bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-xs font-mono text-white focus:outline-none focus:border-luxury-gold"
                                />
                                <input
                                  type="text"
                                  value={customImageName}
                                  onChange={(e) => setCustomImageName(e.target.value)}
                                  placeholder="Filename (Optional)"
                                  className="w-full sm:w-40 bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-xs font-mono text-white focus:outline-none focus:border-luxury-gold"
                                />
                                <button
                                  type="button"
                                  onClick={addCustomImage}
                                  className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-bold font-mono uppercase tracking-widest cursor-pointer"
                                >
                                  Insert
                                </button>
                              </div>
                            </div>

                            {/* Staging Pool summary */}
                            <div className="space-y-3">
                              <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-[#d4af37] font-bold border-b border-white/5 pb-2">
                                <span>Staging Pool ({uploadedImages.length} Images staged)</span>
                                {uploadedImages.length > 0 && (
                                  <button onClick={() => setUploadedImages([])} className="text-red-400 border border-red-500/20 px-2 py-0.5 rounded hover:bg-red-500/5 hover:border-red-500/40 text-[8px]">
                                    Clear All
                                  </button>
                                )}
                              </div>

                              {uploadedImages.length === 0 ? (
                                <p className="text-center py-10 border border-dashed border-white/10 rounded-xl text-xs text-white/30 font-mono">
                                  No assets added. Standard custom files or premium fashion items above are empty.
                                </p>
                              ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-h-48 overflow-y-auto pr-1">
                                  {uploadedImages.map((img, index) => (
                                    <div key={index} className="aspect-square bg-white/5 border border-white/10 rounded-lg overflow-hidden relative group">
                                      <img src={img.url} alt="staging" className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                          type="button"
                                          onClick={() => removeStagedImage(index)}
                                          className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full transition-transform hover:scale-110"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                      <span className="absolute bottom-1 right-1 font-mono text-[7px] bg-black/80 px-1 py-0.5 rounded text-white/70 max-w-[80px] truncate">
                                        {img.filename}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Submit Deploy Button */}
                            <div className="pt-4 flex justify-end">
                              <Button
                                onClick={handleDeployGallery}
                                className="px-8 text-[11px] uppercase tracking-widest font-bold font-mono py-2.5"
                              >
                                Deploy Digital Portfolio
                              </Button>
                            </div>

                          </div>
                        ) : (
                          <div className="text-center py-20 text-white/30 text-xs font-mono">
                             <ImageIcon className="w-8 h-8 opacity-25 mx-auto mb-4" />
                             Pick an active client directory profile on the left side to begin composing their digital visual delivery.
                          </div>
                        )}
                      </GlassCard>
                    </div>

                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 4: SERVICES & STUDIO COLLECTIONS CONFIG */}
              {/* ============================================================== */}
              {activeTab === "services" && (
                <div className="space-y-12">
                  <header className="border-b border-white/5 pb-6">
                    <h1 className="text-3xl font-display mb-1">Studio <span className="italic">Collections</span></h1>
                    <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Catalog Pricing & Package Matrix Adjuster</p>
                  </header>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Catalog listing - 2 columns */}
                    <div className="lg:col-span-2 space-y-6">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-luxury-gold">Active Photobook catalog ({services.length} items)</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {services.map((svc) => (
                          <div 
                            key={svc.id} 
                            className="p-6 border border-white/5 bg-white/[0.01] hover:border-white/10 rounded-2xl relative flex flex-col justify-between"
                          >
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <h4 className="font-serif font-bold text-white text-base">{svc.title}</h4>
                                <span className="font-mono text-sm text-[#d4af37] font-bold">${svc.price.toLocaleString()}</span>
                              </div>
                              <div className="flex gap-3 text-[9px] font-mono text-white/45 uppercase tracking-widest">
                                <span>Code: {svc.id}</span>
                                <span>Duration: {svc.durationMinutes} Mins</span>
                              </div>
                              <p className="text-xs text-white/50 leading-relaxed pt-2">
                                {svc.description}
                              </p>
                            </div>

                            <div className="border-t border-white/5 pt-4 mt-6 flex justify-between items-center">
                              <span className="text-[9px] uppercase tracking-widest text-green-400 font-bold">● Operational</span>
                              
                              <button
                                onClick={() => handleDeleteService(svc.id)}
                                className="p-2 border border-red-500/20 hover:border-red-500/40 text-red-400 rounded transition-colors cursor-pointer"
                                title="Delete Catalog Package"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* New photography package editor Form */}
                    <div className="space-y-6">
                      <GlassCard hover={false} className="p-6">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-luxury-gold border-b border-white/5 pb-3 mb-5">Create Package</h4>
                        
                        <form onSubmit={handleCreateService} className="space-y-4 font-mono text-xs">
                          <div>
                            <label className="block text-[9px] uppercase tracking-widest font-bold text-white/40 mb-1">Unique Identifier Code</label>
                            <input
                              type="text"
                              value={newSvcId}
                              onChange={(e) => setNewSvcId(e.target.value)}
                              placeholder="e.g. editorial, stark-fine"
                              className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-luxury-gold uppercase"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase tracking-widest font-bold text-white/40 mb-1">Public Package Title</label>
                            <input
                              type="text"
                              value={newSvcTitle}
                              onChange={(e) => setNewSvcTitle(e.target.value)}
                              placeholder="e.g. Fine Art Series"
                              className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-luxury-gold"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[9px] uppercase tracking-widest font-bold text-white/40 mb-1">Price (USD)</label>
                              <input
                                type="number"
                                value={newSvcPrice}
                                onChange={(e) => setNewSvcPrice(Number(e.target.value))}
                                className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-luxury-gold text-right"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] uppercase tracking-widest font-bold text-white/40 mb-1">Duration (Mins)</label>
                              <input
                                type="number"
                                value={newSvcDuration}
                                onChange={(e) => setNewSvcDuration(Number(e.target.value))}
                                className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-luxury-gold text-right"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase tracking-widest font-bold text-white/40 mb-1">Service Narrative / Description</label>
                            <textarea
                              value={newSvcDesc}
                              rows={4}
                              onChange={(e) => setNewSvcDesc(e.target.value)}
                              placeholder="Introduce the backdrop options, lighting character, delivered files, and print sizes..."
                              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-luxury-gold font-sans leading-relaxed"
                            />
                          </div>

                          <div className="pt-2">
                            <Button
                              type="submit"
                              disabled={editorLoading}
                              className="w-full text-[10px] uppercase font-bold tracking-wider py-2 font-mono"
                            >
                              {editorLoading ? "Configuring Catalog..." : "Add to Live Catalog"}
                            </Button>
                          </div>
                        </form>
                      </GlassCard>
                    </div>

                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 5: CALENDAR SCHEDULE MANAGER */}
              {/* ============================================================== */}
              {activeTab === "calendar" && (
                <div className="space-y-8">
                  <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
                    <div>
                      <h1 className="text-3xl font-display mb-1">Hour <span className="italic">Allocation</span></h1>
                      <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Schedule planning, manual blocking & slots deployment</p>
                    </div>

                    <div className="flex gap-3 items-center">
                      <input
                        type="date"
                        value={selectedDateForSlots}
                        onChange={(e) => setSelectedDateForSlots(e.target.value)}
                        className="p-2 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-luxury-gold cursor-pointer"
                      />

                      <button
                        onClick={handleGenerateSlots}
                        disabled={isGeneratingSlots}
                        className="px-4 py-2 bg-luxury-gold/10 hover:bg-luxury-gold/20 text-luxury-gold border border-luxury-gold/20 rounded-lg text-xs font-bold tracking-widest cursor-pointer font-sans transition-colors"
                      >
                        {isGeneratingSlots ? "Filing..." : "Generate 30D Slots Pool"}
                      </button>
                    </div>
                  </header>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Hour allocation grids */}
                    <div className="lg:col-span-2 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-luxury-gold">Active Slots on {selectedDateForSlots}</h4>
                      
                      {calendarLoading ? (
                        <div className="py-20 text-center font-mono text-xs text-white/30">
                          Fetching timeslot allocations from cloud...
                        </div>
                      ) : calendarSlots.length === 0 ? (
                        <div className="p-12 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                          <Inbox className="w-8 h-8 opacity-25 mx-auto mb-4" />
                          <p className="text-xs text-white/40 font-mono">No available timeslots recorded for {selectedDateForSlots}.</p>
                          <p className="text-[10px] text-white/30 max-w-sm mx-auto mt-2 italic">Click generate 30D slots pool above to auto-create standard 5 hours standard distribution times arrays matching our Venice timezone.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {calendarSlots.map((slot) => {
                            const isManualBlock = slot.bookingId === "MANUAL_STUDIO_BLOCK";
                            return (
                              <div
                                key={slot.id}
                                className={`p-4 border rounded-xl flex items-center justify-between transition-all ${
                                  slot.isBooked
                                    ? isManualBlock
                                      ? "border-red-500/15 bg-red-500/[0.02]"
                                      : "border-luxury-gold/15 bg-luxury-gold/[0.01]"
                                    : "border-white/5 bg-white/[0.01] hover:border-white/10"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <Clock className="w-4 h-4 text-luxury-gold opacity-80" />
                                  <div className="font-mono text-xs">
                                    <p className="text-white font-bold text-sm">{slot.time}</p>
                                    <p className="text-[9px] text-white/30 mt-0.5">
                                      Date: {slot.date}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className={`text-[8.5px] font-mono uppercase tracking-widest py-0.5 px-1.5 rounded-full border ${
                                    slot.isBooked
                                      ? isManualBlock
                                        ? "bg-red-500/10 border-red-500/20 text-red-400"
                                        : "bg-green-500/10 border-green-500/20 text-green-400"
                                      : "bg-white/5 border-white/10 text-white/40"
                                  }`}>
                                    {slot.isBooked ? isManualBlock ? "Blocked" : "Booked" : "Available"}
                                  </span>

                                  {/* Toggle block state */}
                                  <button
                                    onClick={() => handleToggleTimeslotManual(slot.id, slot.isBooked)}
                                    className={`p-1.5 border rounded cursor-pointer transition-colors ${
                                      slot.isBooked
                                        ? "border-white/10 hover:border-white/30 text-white/60"
                                        : "border-red-500/20 hover:border-red-500/40 text-red-400 hover:bg-red-500/5"
                                    }`}
                                    title={slot.isBooked ? "Unblock hour" : "Block manually"}
                                  >
                                    {slot.isBooked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Standalone Schedule Rule guide */}
                    <div className="space-y-6">
                      <GlassCard hover={false} className="p-6">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-luxury-gold border-b border-white/5 pb-3 mb-4">Operations Guide</h4>
                        <div className="font-sans text-xs text-white/60 leading-relaxed space-y-4">
                          <p>
                            Jay Pictures standard availability is segmented into 5 strategic cinematic sessions daily:
                          </p>
                          <ul className="list-disc pl-5 space-y-2 font-mono text-[10.5px]">
                            <li>09:00 — Venice Dawn Glow</li>
                            <li>11:00 — Mid-Morning Studio Luxe</li>
                            <li>14:00 — High-Contrast Directional</li>
                            <li>16:00 — Venetian Golden Hours</li>
                            <li>19:00 — Atmospheric Backdoor Sunset</li>
                          </ul>
                          <p>
                            Admins can manually block slots to reserve them for offline editorial projects, VIP walks, or client pre-consultations without deleting them from the index database.
                          </p>
                        </div>
                      </GlassCard>
                    </div>

                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 6: PAYSTACK PAYMENT RECEIPTS LEDGER */}
              {/* ============================================================== */}
              {activeTab === "payments" && (
                <div className="space-y-8">
                  <header className="border-b border-white/5 pb-6">
                    <h1 className="text-3xl font-display mb-1">Paystack <span className="italic">Ledger</span></h1>
                    <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Comprehensive verified gateway receipt entries</p>
                  </header>

                  {/* Payment entries list table */}
                  <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-white/5 text-white/40 uppercase font-bold text-[9px] tracking-widest">
                            <th className="py-4 px-6">Payment Ledger ID</th>
                            <th className="py-4 px-6">Paystack Reference</th>
                            <th className="py-4 px-6">Amount USD</th>
                            <th className="py-4 px-6">Local Paid Rate</th>
                            <th className="py-4 px-6">Ratio type</th>
                            <th className="py-4 px-6">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono text-[11px] text-white/80">
                          {payments.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-12 px-6 text-center text-white/30 text-xs">
                                No verified payments found inside firestore entries.
                              </td>
                            </tr>
                          ) : (
                            payments.map((p) => {
                              return (
                                <tr key={p.id} className="hover:bg-white/[0.01] transition-colors">
                                  <td className="py-4 px-6 font-bold text-white">
                                    {p.id}
                                  </td>
                                  <td className="py-4 px-6 text-white/50 break-words max-w-[150px]">
                                    {p.paystackReference || <span className="text-red-400">pi_offline_mock</span>}
                                  </td>
                                  <td className="py-4 px-6 font-semibold text-white">
                                    ${p.amount.toLocaleString()} USD
                                  </td>
                                  <td className="py-4 px-6 text-luxury-gold">
                                    {p.paidAmountLocal ? `${p.paidAmountLocal.toLocaleString()} ${p.paidCurrency}` : `$${p.amount.toLocaleString()} USD`}
                                  </td>
                                  <td className="py-4 px-6 uppercase text-[10px]">
                                    {p.amountType === "deposit" ? "50% Deposit" : "100% Full Payment"}
                                  </td>
                                  <td className="py-4 px-6">
                                    <span className={`text-[8px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                                      p.status === "paid" 
                                        ? "bg-green-500/10 border-green-500/20 text-green-400"
                                        : p.status === "failed"
                                          ? "bg-red-500/10 border-red-500/20 text-red-500"
                                          : "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
                                    }`}>
                                      {p.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

        </main>

      </div>
    </div>
  );
}
