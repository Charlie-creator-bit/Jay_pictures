import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { db, auth } from "../lib/firebase";
import { handleFirestoreError, OperationType } from "../lib/firestore-error";
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc, 
  updateDoc, 
  query, 
  where, 
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { 
  Camera, 
  Calendar, 
  Clock as ClockIcon, 
  User as UserIcon, 
  CreditCard, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Info,
  Eye,
  EyeOff,
  Lock
} from "lucide-react";
import Button from "../components/ui/Button";
import GlassCard from "../components/ui/GlassCard";

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
}

interface TimeSlot {
  id: string;
  date: string;
  time: string;
  isBooked: boolean;
  bookingId?: string;
}

const getServiceCategory = (id: string, title: string): string => {
  const name = (id + " " + title).toLowerCase();
  if (name.includes("kids-studio") || name.includes("kids studio")) return "kids_studio";
  if (name.includes("kids-outdoor") || name.includes("kids outdoor")) return "kids_outdoor";
  if (name.includes("funeral-2d") || name.includes("funeral 2d") || name.includes("funeral_2d")) return "funeral_2d";
  if (name.includes("funeral-3d") || name.includes("funeral 3d") || name.includes("funeral_3d")) return "funeral_3d";
  if (name.includes("funeral")) return "funeral";
  if (name.includes("corporate-2d") || name.includes("corporate 2d") || name.includes("corporate_2d")) return "corporate_2d";
  if (name.includes("corporate")) return "corporate";
  if (name.includes("wedding-2d") || name.includes("wedding 2-day") || name.includes("two-day")) return "wedding2";
  if (name.includes("wedding") || name.includes("one-day") || name.includes("wedding1")) return "wedding1";
  if (name.includes("outdoor")) return "outdoor";
  return "studio";
};

const SERVICE_CATEGORIES = [
  { id: "studio", name: "Studio" },
  { id: "outdoor", name: "Outdoor" },
  { id: "wedding1", name: "Wedding (1-Day)" },
  { id: "wedding2", name: "Wedding (2-Day)" },
  { id: "kids_studio", name: "Kids Studio" },
  { id: "kids_outdoor", name: "Kids Outdoor" },
  { id: "funeral", name: "Funeral (1-Day)" },
  { id: "funeral_2d", name: "Funeral (2-Day)" },
  { id: "funeral_3d", name: "Funeral (3-Day)" },
  { id: "corporate", name: "Corporate (1-Day)" },
  { id: "corporate_2d", name: "Corporate (2-Day)" }
];

export default function Book() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedServiceId = searchParams.get("service");

  // Flow step state: 1: Service, 2: Date & Time, 3: Details, 4: Payment, 5: Confirmation
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("studio");

  // User selections
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const day = String(tomorrow.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }); // Format: YYYY-MM-DD
  const [selectedTime, setSelectedTime] = useState<string>(""); // Format: HH:MM
  const [slotsForDate, setSlotsForDate] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  // Custom calendar navigational states
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Input states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  // Paystack states
  const [amountType, setAmountType] = useState<"deposit" | "full">("deposit");
  const [paymentCurrency, setPaymentCurrency] = useState<"USD" | "GHS" | "NGN">("USD");

  // Payment mock states
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  // System states
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [createdPaymentId, setCreatedPaymentId] = useState<string | null>(null);

  // Inline auth states for Step 3 if user is anonymous or guest
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [inlineEmail, setInlineEmail] = useState("");
  const [inlinePassword, setInlinePassword] = useState("");
  const [inlineFullName, setInlineFullName] = useState("");
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [inlineLoading, setInlineLoading] = useState(false);
  const [showInlinePassword, setShowInlinePassword] = useState(false);

  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineLoading(true);
    setInlineError(null);
    try {
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      await signInWithEmailAndPassword(auth, inlineEmail, inlinePassword);
    } catch (err: any) {
      let msg = err.message || "Failed to sign in. Please verify your credentials.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        msg = "Invalid email or password. Please verify your credentials and try again.";
      } else if (err.code === "auth/invalid-email") {
        msg = "This is not a valid email address.";
      }
      setInlineError(msg);
    } finally {
      setInlineLoading(false);
    }
  };

  const handleInlineRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineFullName.trim()) {
      setInlineError("Please enter your full name.");
      return;
    }
    setInlineLoading(true);
    setInlineError(null);
    try {
      const { createUserWithEmailAndPassword } = await import("firebase/auth");
      const credential = await createUserWithEmailAndPassword(auth, inlineEmail, inlinePassword);
      
      const userRef = doc(db, "users", credential.user.uid);
      await setDoc(userRef, {
        fullName: inlineFullName.trim(),
        email: inlineEmail.trim(),
        role: "client",
        createdAt: serverTimestamp(),
      });

      setFullName(inlineFullName.trim());
      setEmail(inlineEmail.trim());
    } catch (err: any) {
      let msg = err.message || "Registration failed. Please try again.";
      if (err.code === "auth/email-already-in-use") {
        msg = "This email address is already registered. If you already have an account, please click the 'Sign In' tab above to log in.";
      } else if (err.code === "auth/weak-password") {
        msg = "The password is too weak. Please use a password with at least 6 characters.";
      } else if (err.code === "auth/invalid-email") {
        msg = "This is not a valid email address.";
      }
      setInlineError(msg);
    } finally {
      setInlineLoading(false);
    }
  };

  // Initialize fields if user is signed in
  useEffect(() => {
    if (user && !user.isAnonymous) {
      setEmail(user.email || "");
      // Fetch user profile to pre-fill name and phone
      const fetchProfile = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setFullName(data.fullName || "");
            if (data.phone) {
              setPhone(data.phone || "");
            }
          }
        } catch (err) {
          console.error("Error reading profile:", err);
        }
      };
      fetchProfile();
    }
  }, [user]);

  // Load Services from Firestore
  useEffect(() => {
    const fetchServices = async () => {
      setLoadingServices(true);
      const defaultServices: Service[] = [
        // Studio Sessions
        {
          id: "studio-starter",
            title: "Studio Starter",
            price: 40,
            durationMinutes: 50,
            description: "50 Min Session. Includes 7 Retouched Pictures, 1-2 Outfit changes, and high-resolution digital proof deliveries.",
            isActive: true
          },
          {
            id: "studio-standard",
            title: "Studio Standard",
            price: 53,
            durationMinutes: 60,
            description: "1 Hour Session. Includes 10 Retouched Pictures, 1-3 Outfit changes, and premium cinematic art direction layouts.",
            isActive: true
          },
          {
            id: "studio-premium",
            title: "Studio Premium",
            price: 200,
            durationMinutes: 80,
            description: "1 Hour 20 Min Session. Includes 12 Retouched Pictures, 1-4 Outfit changes, and PROFESSIONAL MAKEUP fully included on set.",
            isActive: true
          },
          // Outdoor Sessions
          {
            id: "outdoor-starter",
            title: "Outdoor Starter",
            price: 47,
            durationMinutes: 50,
            description: "50 Min Session. Includes 6 Retouched Pictures, 1-2 Outfit changes, and outstanding natural-light portraits.",
            isActive: true
          },
          {
            id: "outdoor-standard",
            title: "Outdoor Standard",
            price: 60,
            durationMinutes: 50,
            description: "50 Min Session. Includes 10 Retouched Pictures, 1-3 Outfit changes, and premium professional outdoor creative setups.",
            isActive: true
          },
          {
            id: "outdoor-premium",
            title: "Outdoor Premium",
            price: 73,
            durationMinutes: 50,
            description: "50 Min Session. Includes 12 Retouched Pictures, 1-4 Outfit changes, and premium customized natural location staging.",
            isActive: true
          },
          // Wedding (1-Day)
          {
            id: "wedding-budget",
            title: "One-Day Budget",
            price: 200,
            durationMinutes: 480,
            description: "Wedding One Day Coverage (Budget). Includes All Edited Event Pictures, Video Film (1 Min), Full Video, 1 Frame, 5 Exclusive couple Pictures, and premium Flash Drive delivery.",
            isActive: true
          },
          {
            id: "wedding-basic",
            title: "One-Day Basic",
            price: 260,
            durationMinutes: 600,
            description: "Wedding One Day Coverage (Basic). Includes All Edited Event Pictures, Highlight Film (2 Mins), Full Edited Video, Neatly Recorded Sound, PhotoBook, 12 Exclusive couple Pictures, Flash Drive, and Cloud Storage.",
            isActive: true
          },
          {
            id: "wedding-classic",
            title: "One-Day Classic",
            price: 327,
            durationMinutes: 720,
            description: "Wedding One Day Coverage (Classic). Includes Pre-Wedding shoot, All Edited Event Pictures, 18 Exclusive couple Pictures, Cinematic Video Film (3-4 Mins), Neatly Recorded Sound, Couple Love Story Film, Drone coverage, PhotoBook, Two Frames, Full Edited Video, and Lifetime Cloud Storage.",
            isActive: true
          },
          // Wedding (2-Day)
          {
            id: "wedding-2d-budget",
            title: "Two-Day Budget",
            price: 233,
            durationMinutes: 960,
            description: "Wedding Two Day Coverage (Budget). Cost-effective two-day legacy coverage documenting all core ceremonies. Includes All Edited Event Pictures, Trailer Film (2 Mins), Full Video, 8 Exclusive couple Pictures, Flash Drive folder.",
            isActive: true
          },
          {
            id: "wedding-2d-basic",
            title: "Two-Day Basic",
            price: 327,
            durationMinutes: 1200,
            description: "Wedding Two Day Coverage (Basic). Fully structured dual-day visual production including high-end physical Photobooks and secure digital storage. Includes All Edited Event Pictures, Trailer Film (3 Mins), Neatly Recorded Sound, PhotoBook, 12 Exclusive couple Pictures, Flash Drive, Cloud Storage.",
            isActive: true
          },
          {
            id: "wedding-2d-classic",
            title: "Two-Day Classic",
            price: 460,
            durationMinutes: 1440,
            description: "Wedding Two Day Coverage (Classic). The non-compromise multi-day epic cinematic custom production. Includes Pre-Wedding shoot, All Edited Event Pictures, 20 Exclusive couple Pictures, Cinematic Video Film (3-4 Mins), Recorded Sound, Love Story, Drone, PhotoBook, Two Frames, Full Edited Video, Cloud Storage.",
            isActive: true
          },
          // Kids Studio
          {
            id: "kids-studio-starter",
            title: "Kids-Studio Starter",
            price: 40,
            durationMinutes: 50,
            description: "Kids Studio Session (Starter). Bespoke studio experience crafted for beautiful portraits of your little ones. Includes 7 Retouched Pictures, 1-2 Outfit changes, child friendly backdrops.",
            isActive: true
          },
          {
            id: "kids-studio-gold",
            title: "Kids-Studio Gold",
            price: 47,
            durationMinutes: 50,
            description: "Kids Studio Session (Gold). Our signature, most loved child studio setup with custom playful props. Includes 9 Retouched Pictures, 1-3 Outfit changes.",
            isActive: true
          },
          {
            id: "kids-studio-luxury",
            title: "Kids-Studio Luxury",
            price: 60,
            durationMinutes: 50,
            description: "Kids Studio Session (Luxury). The complete elite luxury package with themed sets and full styling support. Includes 12 Retouched Pictures, 1-4 Outfit changes, themed sets.",
            isActive: true
          },
          // Kids Outdoor
          {
            id: "kids-outdoor-starter",
            title: "Kids-Outdoor Starter",
            price: 60,
            durationMinutes: 50,
            description: "Kids Outdoor Session (Starter). Capturing organic outdoor child play or cozy home sessions with style. Includes 7 Retouched Pictures, 1-2 Outfit changes.",
            isActive: true
          },
          {
            id: "kids-outdoor-gold",
            title: "Kids-Outdoor Gold",
            price: 67,
            durationMinutes: 50,
            description: "Kids Outdoor Session (Gold). Scenic nature backdrops or beautifully staged multi-angle home designs. Includes 9 Retouched Pictures, 1-3 Outfit changes, dynamic focus capture.",
            isActive: true
          },
          {
            id: "kids-outdoor-luxury",
            title: "Kids-Outdoor Luxury",
            price: 80,
            durationMinutes: 50,
            description: "Kids Outdoor Session (Luxury). Advanced custom themed child location production with custom props. Includes 12 Retouched Pictures, 1-4 Outfit changes, custom themed setups.",
            isActive: true
          },
          // Funeral (1-Day)
          {
            id: "funeral-basic",
            title: "Funeral Basic",
            price: 167,
            durationMinutes: 480,
            description: "Funeral One Day Coverage (Basic). Professional single-day coverage of funeral events, ceremonies, and family gatherings. Includes All Edited Event Pictures, Highlight Film (2 Mins), Full Edited Video.",
            isActive: true
          },
          {
            id: "funeral-diamond",
            title: "Funeral Diamond",
            price: 233,
            durationMinutes: 480,
            description: "Funeral One Day Coverage (Diamond). Enhanced sound-monitored single day coverage containing family premium photobooks and portrait pictures. Includes All Edited Event Pictures, Highlight Film (2 Mins), Full Edited Video, Sound, PhotoBook, 12 Exclusive Portrait/Family Pictures.",
            isActive: true
          },
          {
            id: "funeral-classic",
            title: "Funeral Classic",
            price: 327,
            durationMinutes: 480,
            description: "Funeral One Day Coverage (Classic). Complete non-compromise multi-angle cinematic production covering every sequence in detail. Includes All Edited Event Pictures, Cinematic Highlight (3-4 Mins), Recorded Sound, Drone, PhotoBook, Two Frames.",
            isActive: true
          },
          // Funeral (2-Day)
          {
            id: "funeral-2d-basic",
            title: "Funeral-2D Basic",
            price: 213,
            durationMinutes: 960,
            description: "Funeral Two Days Coverage (Basic). Professional two-day coverage of funeral events, ceremonies, and family gatherings. Includes All Edited Event Pictures, Highlight Film (2 Mins), Full Edited Video, Flash Drive.",
            isActive: true
          },
          {
            id: "funeral-2d-diamond",
            title: "Funeral-2D Diamond",
            price: 327,
            durationMinutes: 960,
            description: "Funeral Two Days Coverage (Diamond). Enhanced sound-monitored two days coverage containing family premium photobooks and portrait pictures. Includes All Edited Event Pictures, Highlight Film (2 Mins), Full Edited Video, Sound, Premium PhotoBook, 12 Exclusive Portrait/Family Pictures.",
            isActive: true
          },
          {
            id: "funeral-2d-classic",
            title: "Funeral-2D Classic",
            price: 460,
            durationMinutes: 960,
            description: "Funeral Two Days Coverage (Classic). Complete non-compromise multi-angle cinematic production covering both days of sequence in detail. Includes All Edited Event Pictures, Cinematic Highlight (3-4 Mins), Sound, Drone, PhotoBook, Two Frames, Full Edited Video, Cloud Storage.",
            isActive: true
          },
          // Funeral (3-Day)
          {
            id: "funeral-3d-basic",
            title: "Funeral-3D Basic",
            price: 320,
            durationMinutes: 1440,
            description: "Funeral Three Days Coverage (Basic). Professional three-day coverage of funeral events, ceremonies, and family gatherings. Includes All Edited Event Pictures, Highlight Film (2 Mins), Full Edited Video, Flash Drive.",
            isActive: true
          },
          {
            id: "funeral-3d-diamond",
            title: "Funeral-3D Diamond",
            price: 460,
            durationMinutes: 1440,
            description: "Funeral Three Days Coverage (Diamond). Enhanced sound-monitored three days coverage containing family premium photobooks and portrait pictures. Includes All Edited Event Pictures, Highlight Film (2 Mins), Full Edited Video, Sound, Premium PhotoBook, 12 Exclusive couple Pictures.",
            isActive: true
          },
          {
            id: "funeral-3d-classic",
            title: "Funeral-3D Classic",
            price: 593,
            durationMinutes: 1440,
            description: "Funeral Three Days Coverage (Classic). Complete non-compromise multi-angle cinematic production covering all three days of events in detail. Includes All Edited Event Pictures, Cinematic Highlight (3-4 Mins), Sound, Drone, PhotoBook, Full Edited Video, Cloud Storage.",
            isActive: true
          },
          // Corporate (1-Day)
          {
            id: "corporate-photo",
            title: "Corporate Photo Only",
            price: 67,
            durationMinutes: 480,
            description: "Corporate One Day Coverage (Photo Only). Professional high-resolution photography coverage for single-day corporate meetings, brand activations, and conferences. Includes All Edited Corporate Pictures, High-Resolution Digital Delivery, Professional Editing.",
            isActive: true
          },
          {
            id: "corporate-standard",
            title: "Corporate Photo & Video (1 Pho, 1 Vid)",
            price: 147,
            durationMinutes: 480,
            description: "Corporate One Day Coverage (Photo & Video Lite). Professional high-fidelity single-day coverage with dedicated photo and video capture. Includes All Edited Corporate Pictures, video highlight, full event video, sound capture.",
            isActive: true
          },
          {
            id: "corporate-deluxe-1",
            title: "Corporate Photo & Video (1 Pho, 2 Vid)",
            price: 200,
            durationMinutes: 480,
            description: "Corporate One Day Coverage (Photo & Video Full). Full comprehensive business event production with multi-camera angles and expanded media team. Includes All Edited Corporate Pictures, video highlight, full comprehensive video, sound capture.",
            isActive: true
          },
          // Corporate (2-Day)
          {
            id: "corporate-2d-photo",
            title: "Corporate-2D Photo Only",
            price: 120,
            durationMinutes: 960,
            description: "Corporate Two Days Coverage (Photo Only). Two-day professional photography covering entire corporate forums, summits, or promotional activations. Includes All Edited Corporate Pictures, digital delivery, professional editing.",
            isActive: true
          },
          {
            id: "corporate-2d-standard",
            title: "Corporate-2D Photo & Video Standard",
            price: 193,
            durationMinutes: 960,
            description: "Corporate Two Days Coverage (Photo & Video Standard). Complete multi-media coverage over both consecutive event days for balanced photo and video documentation. Includes All Edited Corporate Pictures, video highlight, full event video.",
            isActive: true
          },
          {
            id: "corporate-2d-deluxe",
            title: "Corporate-2D Photo & Video Deluxe",
            price: 260,
            durationMinutes: 960,
            description: "Corporate Two Days Coverage (Photo & Video Deluxe). Borders corporate scale coverage over two full days with a high-capacity media team and flawless execution. Includes All Edited Corporate Pictures, video highlight, full video coverage, sound capture.",
            isActive: true
          }
        ];

        let serviceList: Service[] = [];
        try {
          const querySnapshot = await getDocs(collection(db, "services"));
          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.isActive !== false) {
              serviceList.push({
                id: docSnap.id,
                title: data.title,
                description: data.description,
                price: data.price,
                durationMinutes: data.durationMinutes,
                isActive: data.isActive,
              });
            }
          });
        } catch (err) {
          console.error("Error fetching services from Firestore:", err);
        }

        // 1. Immediately build the full merged service list to display to the user without blocking
        const existingIds = new Set(serviceList.map(s => s.id));
        const finalServices = [...serviceList];
        
        // Ensure any default service not in the database yet is available in memory
        defaultServices.forEach(svc => {
          if (!existingIds.has(svc.id)) {
            finalServices.push(svc);
          } else {
            // If the price is mismatched (e.g., legacy currency conversion issue), repair it in memory
            const idx = finalServices.findIndex(s => s.id === svc.id);
            if (idx !== -1 && finalServices[idx].price > 150 && svc.price <= 150) {
              finalServices[idx] = svc;
            }
          }
        });

        // Set state and select initial package
        setServices(finalServices);

        if (preSelectedServiceId) {
          const matched = finalServices.find(s => s.id === preSelectedServiceId || s.title.toLowerCase().includes(preSelectedServiceId.toLowerCase()));
          if (matched) {
            setSelectedService(matched);
            const categoryMatched = getServiceCategory(matched.id, matched.title);
            setActiveCategory(categoryMatched);
          }
        }
        
        // Hide loading indicator instantly!
        setLoadingServices(false);

        // 2. Perform any needed Firestore seeding/repair in the background asynchronously
        const missingOrMismatched = defaultServices.filter(svc => {
          if (!existingIds.has(svc.id)) return true;
          const matchedDB = serviceList.find(s => s.id === svc.id);
          return matchedDB && matchedDB.price > 150 && svc.price <= 150;
        });

        if (missingOrMismatched.length > 0) {
          // Process all missing/mismatched documents in parallel without blocking the main thread
          Promise.all(
            missingOrMismatched.map(async (svc) => {
              try {
                await setDoc(doc(db, "services", svc.id), {
                  title: svc.title,
                  price: svc.price,
                  durationMinutes: svc.durationMinutes,
                  description: svc.description,
                  isActive: svc.isActive,
                  createdAt: serverTimestamp(),
                });
              } catch (seedErr) {
                console.warn(`Bypassed seeding for service ${svc.id}:`, seedErr);
              }
            })
          ).catch(err => console.warn("Background seeding error:", err));
        }
    };
    fetchServices();
  }, [preSelectedServiceId, user]);

  // Load Available Time Slots whenever Date changes
  useEffect(() => {
    if (!selectedDate) {
      setSlotsForDate([]);
      return;
    }

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setError(null);
      try {
        const slotsRef = collection(db, "availability");
        const querySnapshot = await getDocs(
          query(slotsRef, where("date", "==", selectedDate))
        );
        
        const slots: TimeSlot[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          slots.push({
            id: docSnap.id,
            date: data.date,
            time: data.time,
            isBooked: data.isBooked,
            bookingId: data.bookingId,
          });
        });

        // Auto-populate default business times if no slot entries exist in the DB
        if (slots.length === 0) {
          const defaultTimes = ["09:00", "11:00", "13:00", "15:00", "17:00", "19:00"];
          defaultTimes.forEach((time) => {
            const slotId = `${selectedDate}_${time.replace(":", "")}`;
            slots.push({
              id: slotId,
              date: selectedDate,
              time,
              isBooked: false,
            });
          });
        }

        // Sort slot times ascending (e.g. 09:00 before 11:00)
        slots.sort((a, b) => a.time.localeCompare(b.time));
        setSlotsForDate(slots);
      } catch (err: any) {
        console.warn("Unable to fetch remote slots, auto-generating default timeslots locally:", err);
        // Robust fallback to let the booking complete safely even offline or under Firestore glitches
        const defaultTimes = ["09:00", "11:00", "13:00", "15:00", "17:00", "19:00"];
        const fallbackSlots: TimeSlot[] = defaultTimes.map((time) => ({
          id: `${selectedDate}_${time.replace(":", "")}`,
          date: selectedDate,
          time,
          isBooked: false,
        }));
        setSlotsForDate(fallbackSlots);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDate]);

  // Custom Calendar Calculation
  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getDayOfWeek = (date: Date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), 1);
    return d.getDay(); // 0 is Sunday, etc.
  };

  const handleMonthChange = (direction: "prev" | "next") => {
    const newMonth = new Date(currentMonth);
    const today = new Date();
    if (direction === "prev") {
      // Avoid navigating to any month earlier than the current month
      if (
        newMonth.getFullYear() < today.getFullYear() ||
        (newMonth.getFullYear() === today.getFullYear() && newMonth.getMonth() <= today.getMonth())
      ) {
        return;
      }
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleDateSelect = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    const fullDate = `${year}-${month}-${dayStr}`;
    
    // Check if picked date is in the past
    const selectedDateTime = new Date(`${fullDate}T23:59:59`);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (selectedDateTime < today) {
      setError("Please select a date in the future.");
      return;
    }

    setError(null);
    setSelectedDate(fullDate);
    setSelectedTime(""); // Reset time when date changes
  };

  // Submit Flow & Secure Transaction Writers
  const handleFinalBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      setError("Please complete all booking selections prior to submission.");
      return;
    }

    // Validate date-time format and ensure booking is in the future
    const pickedDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
    if (isNaN(pickedDateTime.getTime())) {
      setError("The selected date or time format is invalid.");
      return;
    }
    const rightNow = new Date();
    if (pickedDateTime < rightNow) {
      setError("Your selected booking time slot has already passed. Please select a future date and time.");
      return;
    }

    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      setError("Please fill out your contact details (including full name, phone number, and email).");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    let activeUser = user;
    try {
      console.log("[BOOK DEBUG] Starting handleFinalBooking checkout process with states:", {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        selectedDate,
        selectedTime,
        amountType,
        paymentCurrency,
        selectedService: selectedService ? { id: selectedService.id, title: selectedService.title, price: selectedService.price } : null,
        currentUser: user ? { uid: user.uid, email: user.email, isAnonymous: user.isAnonymous } : null
      });

      if (!activeUser) {
        console.log("[BOOK DEBUG] No active user session detected. Automatically proceeding with background anonymous authentication...");
        const { signInAnonymously } = await import("firebase/auth");
        const userCredential = await signInAnonymously(auth);
        activeUser = userCredential.user;
        console.log("[BOOK DEBUG] Background anonymous authentication completed successfully:", {
          uid: activeUser.uid,
          isAnonymous: activeUser.isAnonymous
        });
      }

      if (!activeUser) {
        throw new Error("Unable to initialize guest session. Please refresh and try again.");
      }

      // Find matching slot document ID to verify double booking and perform atomicity write
      const slotId = `${selectedDate}_${selectedTime.replace(":", "")}`;
      const slotRef = doc(db, "availability", slotId);
      
      console.log("[BOOK DEBUG] Reading slot details from availability collection...", { slotId });
      const slotSnap = await getDoc(slotRef);
      if (slotSnap.exists() && slotSnap.data().isBooked) {
        console.warn("[BOOK DEBUG] Collision detected! Slot is already marked booked:", slotSnap.data());
        throw new Error("This slot was booked by another client during your checkout. Please select a different time.");
      }
      console.log("[BOOK DEBUG] Slot available or not yet registered. Proceeding...");

      // Ensure users/{userId} profile exists for database constraint validation
      const userRef = doc(db, "users", activeUser.uid);
      console.log("[BOOK DEBUG] Verifying client profile record presence...", { userPath: `users/${activeUser.uid}` });
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        console.log("[BOOK DEBUG] Client profile doc not found. Creating a new profile record path...");
        try {
          const userPayload = {
            fullName: fullName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            role: "client",
            createdAt: serverTimestamp()
          };
          console.log("[BOOK DEBUG] Submitting users profile creation setDoc payload:", userPayload);
          await setDoc(userRef, userPayload);
          console.log("[BOOK DEBUG] Client profile written successfully.");
        } catch (uErr: any) {
          console.error("[BOOK DEBUG] Failed writing client user profile record:", uErr);
          throw new Error("Could not initialize guest profile for booking: " + (uErr.message || uErr));
        }
      } else if (!activeUser.isAnonymous) {
        console.log("[BOOK DEBUG] Client profile doc exists. Updating details as a registered user...");
        try {
          const userPayload = {
            phone: phone.trim(),
            fullName: fullName.trim()
          };
          console.log("[BOOK DEBUG] Merging users profile setDoc merge:true payload:", userPayload);
          await setDoc(userRef, userPayload, { merge: true });
          console.log("[BOOK DEBUG] Client profile merged/updated successfully.");
        } catch (uErr: any) {
          console.warn("[BOOK DEBUG] Non-blocking warning: Failed saving profile info updates on book submit:", uErr);
        }
      }

      // Generate secure transaction identifiers
      const bookingId = doc(collection(db, "bookings")).id;

      // 1. Write Booking Document FIRST matching raw rule schema invariants
      const bookingRef = doc(db, "bookings", bookingId);
      const bookingData = {
        clientId: activeUser.uid,
        serviceId: selectedService.id,
        bookingDate: `${selectedDate}T${selectedTime}:00Z`,
        status: "pending",
        totalAmount: selectedService.price,
        createdAt: serverTimestamp(), // rule checks request.time
        updatedAt: serverTimestamp(),
      };

      console.log("[BOOK DEBUG] Writing main Booking document path...", {
        bookingId,
        bookingPath: `bookings/${bookingId}`,
        bookingData
      });
      try {
        await setDoc(bookingRef, bookingData);
        console.log("[BOOK DEBUG] Booking document created successfully in Firestore.");
      } catch (err: any) {
        console.error("[BOOK DEBUG] CRITICAL: setDoc on bookings collection failed with error:", err);
        handleFirestoreError(err, OperationType.WRITE, `bookings/${bookingId}`);
      }

      // 2. Perform the matching slot reservation update in availability
      console.log("[BOOK DEBUG] Securing availability slot state...", { slotId, slotPath: `availability/${slotId}` });
      try {
        if (!slotSnap.exists()) {
          const virtualSlotPayload = {
            date: selectedDate,
            time: selectedTime,
            isBooked: true,
            bookingId: bookingId
          };
          console.log("[BOOK DEBUG] Case A: Creating new availability slot directly custom setDoc payload:", virtualSlotPayload);
          await setDoc(slotRef, virtualSlotPayload);
        } else {
          const updateSlotPayload = {
            isBooked: true,
            bookingId: bookingId
          };
          console.log("[BOOK DEBUG] Case B: Updating existing availability slot custom updateDoc payload:", updateSlotPayload);
          await updateDoc(slotRef, updateSlotPayload);
        }
        console.log("[BOOK DEBUG] Availability slot written/secured successfully.");
      } catch (err: any) {
        console.error("[BOOK DEBUG] CRITICAL: Updating availability slot failed with error:", err);
        handleFirestoreError(err, OperationType.WRITE, `availability/${slotId}`);
      }

      // 3. Create a pending payment record inside the payments collection to record the transaction
      const paymentId = doc(collection(db, "payments")).id;
      const paymentRef = doc(db, "payments", paymentId);
      const paymentData = {
        bookingId: bookingId,
        clientId: activeUser.uid,
        amount: selectedService.price,
        currency: "USD",
        status: "pending",
        createdAt: serverTimestamp(),
      };

      console.log("[BOOK DEBUG] Submitting payments record setDoc payload:", paymentData);
      try {
        await setDoc(paymentRef, paymentData);
        console.log("[BOOK DEBUG] Payment document created successfully in Firestore.");
      } catch (err: any) {
        console.error("[BOOK DEBUG] Failed saving payment document:", err);
      }

      // 4. Fire client-triggered admin-targeted notification
      const notificationId = doc(collection(db, "notifications")).id;
      const notificationRef = doc(db, "notifications", notificationId);
      const notificationData = {
        recipientId: "admin",
        title: "New Booking Created",
        message: `${fullName} booked a slot for ${selectedService.title}. Booking request is pending confirmation.`,
        isRead: false,
        type: "booking_new",
        createdAt: serverTimestamp(),
      };

      console.log("[BOOK DEBUG] Registering client-to-admin notification item...", {
        notificationId,
        notificationPath: `notifications/${notificationId}`,
        notificationData
      });
      try {
        await setDoc(notificationRef, notificationData);
        console.log("[BOOK DEBUG] Admin notification written successfully to Firestore.");
      } catch (err: any) {
        console.error("[BOOK DEBUG] Non-blocking warning: Failed creating notification item:", err);
      }

      console.log("[BOOK DEBUG] All checkout pre-requisites completed successfully. Transitioning to confirmation final state.");
      setCreatedBookingId(bookingId);
      setCreatedPaymentId(paymentId);
      setIsSubmitting(false);
      setStep(5);

    } catch (err: any) {
      console.error("[BOOK DEBUG] CRITICAL: handleFinalBooking execution caught error:", err);
      setError(err.message || "An error occurred while compiling your booking records.");
      setIsSubmitting(false);
    }
  };

  // Helper arrays for calendar
  const currentMonthDays = daysInMonth(currentMonth);
  const firstDayOfWeek = getDayOfWeek(currentMonth);
  const calendarGrid = [];
  
  // Fill empty leading boxes
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarGrid.push(null);
  }
  // Fill month dates
  for (let i = 1; i <= currentMonthDays; i++) {
    calendarGrid.push(i);
  }

  // Format selectedService feature display list helper
  const getServiceFeatures = (title: string) => {
    switch (title.toLowerCase()) {
      case "editorial collection":
      case "editorial":
        return ["4 Hour Studio Session", "Creative Art Direction", "10 High-End Retouched Images", "Private Online Gallery", "Commercial Usage License"];
      case "cinematic collection":
      case "cinematic":
        return ["Full Day Location Shoot", "Full Styling Team", "25 Master-Retouched Prints", "Cinematic BTS Film", "Archival Photo Album"];
      default:
        return ["Multi-Day Destination Shoot", "Complete Production Team", "Unlimited Retouched Images", "Hand-crafted Leather Album", "Personal Exhibition Service"];
    }
  };

  return (
    <div className="min-h-screen bg-luxury-black text-white p-12 pt-32 selection:bg-luxury-gold/30 selection:text-white">
      <div className="container mx-auto max-w-4xl">
        
        {/* Header Breadcrumbs */}
        <header className="mb-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-white/5 pb-8">
          <div>
            <h1 className="text-4xl font-display mb-2">Reserve <span className="italic">Session</span></h1>
            <p className="text-white/40 uppercase tracking-widest text-[10px] font-bold">Jay Pictures — Heritage Studio Bookings</p>
          </div>
          
          {/* Progress Indicators */}
          {step < 5 && (
            <div className="flex items-center gap-2 text-xs">
              <span className={`px-3 py-1 rounded-full ${step === 1 ? "bg-luxury-gold text-black font-semibold" : "bg-white/5 text-white/50"}`}>1. Package</span>
              <span className="text-white/20">/</span>
              <span className={`px-3 py-1 rounded-full ${step === 2 ? "bg-luxury-gold text-black font-semibold" : "bg-white/5 text-white/50"}`}>2. Calendar</span>
              <span className="text-white/20">/</span>
              <span className={`px-3 py-1 rounded-full ${step === 3 ? "bg-luxury-gold text-black font-semibold" : "bg-white/5 text-white/50"}`}>3. Vision</span>
              <span className="text-white/20">/</span>
              <span className={`px-3 py-1 rounded-full ${step === 4 ? "bg-luxury-gold text-black font-semibold" : "bg-white/5 text-white/50"}`}>4. Checkout</span>
            </div>
          )}
        </header>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-500 text-sm mb-8">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          
          {/* Step 1: Services Selection */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-display text-[#d4af37]">Choose photography scope</h3>
              </div>

              {/* Comprehensive Category Tabs */}
              <div className="py-2 border-b border-white/5">
                <p className="text-[10px] uppercase font-mono tracking-widest text-[#d4af37] mb-3">Browse Creative Categories</p>
                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/15 scrollbar-track-transparent">
                  {SERVICE_CATEGORIES.map((cat) => {
                    const count = services.filter(s => getServiceCategory(s.id, s.title) === cat.id).length;
                    const isActive = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setActiveCategory(cat.id);
                          // Clear selection only if the current selection is NOT in this new category
                          if (selectedService && getServiceCategory(selectedService.id, selectedService.title) !== cat.id) {
                            setSelectedService(null);
                          }
                        }}
                        className={`px-4 py-2 rounded-full text-[10px] font-mono uppercase font-bold tracking-widest whitespace-nowrap transition-all border shrink-0 ${
                          isActive
                            ? "bg-luxury-gold text-black border-luxury-gold font-extrabold shadow-lg shadow-luxury-gold/10"
                            : "bg-white/5 text-white/60 hover:text-white border-white/5"
                        }`}
                      >
                        {cat.name} {count > 0 ? `(${count})` : "(0)"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {loadingServices ? (
                <div className="text-center py-20 text-white/40 text-sm">
                  Querying the archives for dynamic packages...
                </div>
              ) : services.length === 0 ? (
                <div className="p-8 text-center border border-white/5 bg-white/[0.02] rounded-xl">
                  <Info className="w-8 h-8 text-luxury-gold mx-auto mb-4" />
                  <h4 className="text-lg font-serif mb-2">No Packages Available</h4>
                  <p className="text-white/40 text-xs max-w-md mx-auto">
                    We are currently preparing our packages index. Please check back in a moment or contact Jay Pictures support.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {services
                    .filter((s) => getServiceCategory(s.id, s.title) === activeCategory)
                    .map((svc) => (
                      <GlassCard 
                        key={svc.id}
                        onClick={() => setSelectedService(svc)}
                        className={`cursor-pointer p-6 border transition-all flex flex-col justify-between ${
                          selectedService?.id === svc.id 
                            ? "border-luxury-gold bg-luxury-gold/5" 
                            : "border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div>
                          <h4 className="text-lg font-serif text-white hover:text-luxury-gold mb-1">{svc.title}</h4>
                          <div className="text-xl font-display text-[#d4af37] mb-4">
                            GH₵{(svc.price * 15).toLocaleString()}
                            <span className="text-[10px] text-white/30 block font-mono mt-1 font-normal uppercase tracking-wider">
                              ~${Math.round(svc.price).toLocaleString()} USD / ₦{Math.round(svc.price * 1400).toLocaleString()} NGN
                            </span>
                          </div>
                          <p className="text-xs text-white/50 leading-relaxed mb-6 h-20 overflow-hidden line-clamp-4">{svc.description}</p>
                          
                          <div className="text-[10px] uppercase tracking-widest text-white/30 mb-4 border-t border-white/5 pt-4">Included deliverables</div>
                          <ul className="space-y-2 mb-6">
                            {getServiceFeatures(svc.title).slice(0, 3).map((feat, i) => (
                              <li key={i} className="text-[10px] text-white/60 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-luxury-gold shrink-0" />
                                <span className="line-clamp-2">{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <button 
                          title="Book Now"
                          label="book_now"
                          className={`w-full py-2.5 rounded-lg text-[9px] uppercase tracking-widest font-extrabold transition-all border mt-auto ${
                            selectedService?.id === svc.id 
                              ? "bg-luxury-gold text-black border-luxury-gold" 
                              : "bg-white/5 hover:bg-white/10 text-white border-white/5"
                          }`}
                        >
                          {selectedService?.id === svc.id ? "Selected Package" : "Select Package"}
                        </button>
                      </GlassCard>
                    ))}
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-white/5">
                <Button 
                  disabled={!selectedService}
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold"
                >
                  Continue to Calendar <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Calendar & Slot Picker */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                
                {/* Custom Inline Calendar */}
                <div className="md:col-span-3 space-y-4">
                  <header className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold tracking-widest uppercase text-luxury-gold">
                      {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </span>
                    <div className="flex items-center gap-2">
                      <button title="Change Month" label="prev_month" onClick={() => handleMonthChange("prev")} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button title="Change Month" label="next_month" onClick={() => handleMonthChange("next")} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </header>

                  <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
                    <div className="grid grid-cols-7 text-center text-white/40 uppercase text-[9px] tracking-widest font-bold mb-4">
                      <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {calendarGrid.map((day, idx) => {
                        if (day === null) {
                          return <div key={`empty-${idx}`} />;
                        }

                        const year = currentMonth.getFullYear();
                        const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
                        const dateStr = `${year}-${month}-${String(day).padStart(2, "0")}`;
                        const isSelected = selectedDate === dateStr;
                        
                        const dateObj = new Date(`${dateStr}T23:59:59`);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const isPast = dateObj < today;
                        
                        return (
                          <button
                            key={idx}
                            disabled={isPast}
                            onClick={() => handleDateSelect(day)}
                            className={`relative aspect-square sm:p-2 rounded-lg text-xs font-semibold flex flex-col items-center justify-center transition-all ${
                              isPast
                                ? "text-white/15 cursor-not-allowed opacity-40 bg-transparent"
                                : isSelected 
                                  ? "bg-luxury-gold text-black font-bold border border-luxury-gold shadow-md shadow-luxury-gold/10" 
                                  : "hover:bg-white/5 text-white/80 border border-transparent cursor-pointer"
                            }`}
                          >
                            <span>{day}</span>
                            {!isPast && (
                              <span className={`w-1 h-1 rounded-full mt-0.5 transition-colors duration-200 ${
                                isSelected ? "bg-black" : "bg-luxury-gold"
                              }`} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Available Hours Section */}
                <div className="md:col-span-2 space-y-4 text-left">
                  <h4 className="text-sm font-semibold tracking-widest uppercase text-luxury-gold">Available hours</h4>
                  
                  {!selectedDate ? (
                    <div className="flex flex-col items-center justify-center py-12 border border-white/5 bg-white/[0.01] rounded-xl text-center text-white/30 text-xs">
                      <Calendar className="w-8 h-8 mb-3 opacity-35" />
                      Please choose date on visual calendar
                    </div>
                  ) : loadingSlots ? (
                    <div className="text-center py-12 text-white/40 text-xs">
                      Fetching database timeslots...
                    </div>
                  ) : slotsForDate.length === 0 ? (
                    <div className="p-6 border border-white/5 bg-white/[0.02] rounded-xl space-y-2">
                      <HelpCircle className="w-6 h-6 text-luxury-gold" />
                      <p className="text-xs text-white/70 leading-relaxed">
                        No availability entries registered for this date.
                      </p>
                      <p className="text-[10px] text-white/40 leading-relaxed">
                        Please try choosing another date or contact our team to select a custom slot.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2.5 max-h-[280px] overflow-y-auto pr-1">
                      {slotsForDate.map((slot) => {
                        const isPicked = selectedTime === slot.time;
                        return (
                          <button
                            key={slot.id}
                            disabled={slot.isBooked}
                            onClick={() => setSelectedTime(slot.time)}
                            className={`flex justify-between items-center py-3 px-4 border rounded-xl font-mono text-xs transition-colors ${
                              slot.isBooked 
                                ? "bg-white/[0.02] border-white/5 text-white/20 cursor-not-allowed"
                                : isPicked 
                                  ? "bg-luxury-gold border-luxury-gold text-black font-semibold"
                                  : "bg-white/5 border-white/10 text-white hover:border-luxury-gold/50"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <ClockIcon className="w-3.5 h-3.5" />
                              {slot.time}
                            </span>
                            <span className="text-[9px] tracking-widest uppercase">
                              {slot.isBooked ? "Reserved" : "Available"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t border-white/5">
                <Button variant="outline" onClick={() => setStep(1)} className="text-[10px] uppercase tracking-widest font-bold">
                  Go Back
                </Button>
                <Button 
                  disabled={!selectedDate || !selectedTime}
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold"
                >
                  Continue to details <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Details & Special Requests */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {!user || user.isAnonymous ? (
                <div className="max-w-md mx-auto space-y-6">
                  <div className="text-center space-y-2">
                    <Sparkles className="w-8 h-8 text-luxury-gold mx-auto animate-pulse" />
                    <h3 className="text-xl font-display text-white">Sign In or Create Account</h3>
                    <p className="text-white/40 text-xs leading-relaxed max-w-sm mx-auto">
                      JAY PICTURES requires an active client account to secure reservations. This allows you to check status, download custom digital galleries, and avoids having to enter registration information again.
                    </p>
                  </div>

                  <div className="bg-[#0b0b0b] border border-white/5 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
                    <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-4">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthTab("login");
                          setInlineError(null);
                        }}
                        className={`py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                          authTab === "login" ? "text-luxury-gold border-b-2 border-luxury-gold" : "text-white/40 hover:text-white"
                        }`}
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthTab("register");
                          setInlineError(null);
                        }}
                        className={`py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                          authTab === "register" ? "text-luxury-gold border-b-2 border-luxury-gold" : "text-white/40 hover:text-white"
                        }`}
                      >
                        Create Account
                      </button>
                    </div>

                    {inlineError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs leading-relaxed text-center">
                        {inlineError}
                      </div>
                    )}

                    {authTab === "login" ? (
                      <form onSubmit={handleInlineLogin} className="space-y-4">
                        <div className="space-y-1">
                          <label className="block text-[9px] uppercase tracking-widest font-bold text-luxury-gold">Email Address</label>
                          <input
                            type="email"
                            required
                            value={inlineEmail}
                            onChange={(e) => setInlineEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white text-xs focus:outline-none focus:border-luxury-gold transition-colors"
                            placeholder="jane@example.com"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="block text-[9px] uppercase tracking-widest font-bold text-luxury-gold">Password</label>
                            <Link 
                              to="/forgot-password" 
                              target="_blank"
                              className="text-[9px] text-[#d4af37] font-sans hover:underline"
                            >
                              Forgot Password?
                            </Link>
                          </div>
                          <div className="relative">
                            <input
                              type={showInlinePassword ? "text" : "password"}
                              required
                              value={inlinePassword}
                              onChange={(e) => setInlinePassword(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-4 pr-10 text-white text-xs focus:outline-none focus:border-luxury-gold transition-colors"
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              onClick={() => setShowInlinePassword(!showInlinePassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-luxury-gold transition-colors focus:outline-none z-10"
                              title={showInlinePassword ? "Hide password" : "Show password"}
                              id="book-login-password-toggle"
                            >
                              {showInlinePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          disabled={inlineLoading}
                          className="w-full py-3 text-[10px] uppercase font-bold tracking-widest mt-2"
                        >
                          {inlineLoading ? "Signing In..." : "Sign In & Continue"}
                        </Button>
                      </form>
                    ) : (
                      <form onSubmit={handleInlineRegister} className="space-y-4">
                        <div className="space-y-1">
                          <label className="block text-[9px] uppercase tracking-widest font-bold text-luxury-gold">Full Name</label>
                          <input
                            type="text"
                            required
                            value={inlineFullName}
                            onChange={(e) => setInlineFullName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white text-xs focus:outline-none focus:border-luxury-gold transition-colors"
                            placeholder="Jane Cooper"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[9px] uppercase tracking-widest font-bold text-luxury-gold">Email Address</label>
                          <input
                            type="email"
                            required
                            value={inlineEmail}
                            onChange={(e) => setInlineEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white text-xs focus:outline-none focus:border-luxury-gold transition-colors"
                            placeholder="jane@example.com"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[9px] uppercase tracking-widest font-bold text-luxury-gold">Password (min 6 characters)</label>
                          <div className="relative">
                            <input
                              type={showInlinePassword ? "text" : "password"}
                              required
                              minLength={6}
                              value={inlinePassword}
                              onChange={(e) => setInlinePassword(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-4 pr-10 text-white text-xs focus:outline-none focus:border-luxury-gold transition-colors"
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              onClick={() => setShowInlinePassword(!showInlinePassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-luxury-gold transition-colors focus:outline-none z-10"
                              title={showInlinePassword ? "Hide password" : "Show password"}
                              id="book-register-password-toggle"
                            >
                              {showInlinePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          disabled={inlineLoading}
                          className="w-full py-3 text-[10px] uppercase font-bold tracking-widest mt-2"
                        >
                          {inlineLoading ? "Creating Account..." : "Create Account & Continue"}
                        </Button>
                      </form>
                    )}
                  </div>

                  <div className="flex justify-center">
                    <Button variant="outline" onClick={() => setStep(2)} className="text-[10px] uppercase tracking-widest font-bold">
                      Go Back
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-display text-[#d4af37]">Creative vision</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-luxury-gold mb-2">My Full Name</label>
                      <div className="relative">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                        <input
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:border-luxury-gold transition-colors"
                          placeholder="Jane Cooper"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-luxury-gold mb-2">My Phone Number</label>
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-luxury-gold transition-colors"
                        placeholder="+1 (555) 012-3456"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-luxury-gold mb-2">My Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={user && !user.isAnonymous && !!user.email}
                        className={`w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-luxury-gold transition-colors ${
                          user && !user.isAnonymous && user.email ? "bg-white/2 border-white/5 text-white/50 cursor-not-allowed" : ""
                        }`}
                        placeholder="jane@example.com"
                      />
                      <p className="text-[9px] text-white/30 tracking-wide mt-1.5">Where we will coordinate your booking confirmation and session deliverables.</p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-luxury-gold mb-2">Session Vision & Style Notes</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-luxury-gold transition-colors resize-none"
                        placeholder="Describe locations, color theme concepts, outfits, or stylistic requests..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-6 border-t border-white/5">
                    <Button variant="outline" onClick={() => setStep(2)} className="text-[10px] uppercase tracking-widest font-bold">
                      Go Back
                    </Button>
                    <Button 
                      disabled={!fullName.trim() || !phone.trim() || !email.trim()}
                      onClick={() => setStep(4)}
                      className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold"
                    >
                      Continue to review <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Step 4: Checkout & Booking Review */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 md:grid-cols-5 gap-8"
            >
              
              {/* Review details sheet */}
              <div className="md:col-span-3 space-y-6">
                <div>
                  <h3 className="text-xl font-display text-[#d4af37] mb-2">Review Booking Details</h3>
                  <p className="text-white/40 text-xs">Verify your registered details to lock in your session reservation.</p>
                </div>

                {/* Info summary display */}
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-4 font-sans">
                  <span className="text-[10px] uppercase tracking-widest text-[#d4af37] font-bold block">1. Customer Information</span>
                  <div className="space-y-2 text-sm text-white/80">
                    <p><span className="text-white/40 font-mono text-[11px] inline-block w-24">Full Name:</span> {fullName}</p>
                    <p><span className="text-white/40 font-mono text-[11px] inline-block w-24">Email Path:</span> {email}</p>
                    <p><span className="text-white/40 font-mono text-[11px] inline-block w-24">Phone Line:</span> {phone}</p>
                    {notes.trim() && (
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <span className="text-white/40 font-mono text-[11px] block mb-1">Session Vision:</span>
                        <p className="text-xs bg-white/5 p-3 rounded-lg text-white/70 italic leading-relaxed">{notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Terms and conditions agreement note */}
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3 font-mono text-[10.5px]">
                  <p className="text-[#d4af37] font-bold uppercase tracking-wider">Booking Heritage Policies</p>
                  <ul className="space-y-1.5 text-white/50 text-left list-decimal list-inside leading-relaxed">
                    <li>Events outside Accra require client-arranged transportation or accommodation coordination.</li>
                    <li>Payment settlements are coordinated directly offline with the visual director.</li>
                    <li>Any rescheduling requests must be submitted at least 48 hours prior to the session.</li>
                  </ul>
                  <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      required 
                      defaultChecked 
                      className="mt-0.5 rounded border-white/20 bg-black text-[#d4af37] checked:bg-[#d4af37]"
                    />
                    <span className="text-white/70 leading-normal font-sans text-[11px]">I agree strictly to the Terms &amp; Conditions stated above.</span>
                  </label>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep(3)} className="text-[10px] uppercase tracking-widest font-bold">
                    Go Back
                  </Button>
                  <Button 
                    disabled={isSubmitting || !selectedService}
                    onClick={handleFinalBooking}
                    className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold px-8 cursor-pointer"
                  >
                    {isSubmitting ? "Processing Reservation..." : "Confirm Reservation"}
                  </Button>
                </div>
              </div>

              {/* Booking Summary */}
              <div className="md:col-span-2">
                <GlassCard className="p-6 border border-white/10" hover={false}>
                  <h4 className="text-xs uppercase tracking-widest font-bold text-luxury-gold mb-4 border-b border-white/5 pb-2">Session Summary</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-white/40 block">Shoot Package</span>
                      <span className="text-sm font-serif font-bold text-white block">{selectedService?.title}</span>
                      <span className="text-xs text-[#d4af37] font-mono mt-0.5 block">
                        Base Price: GH₵{((selectedService?.price || 0) * 15).toLocaleString()} (~${selectedService?.price} USD)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-3">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-white/40 block">Date</span>
                        <span className="text-xs font-mono text-white">{selectedDate}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-white/40 block">Time</span>
                        <span className="text-xs font-mono text-white">{selectedTime}</span>
                      </div>
                    </div>

                    <div className="border-t border-[#d4af37]/20 pt-4 space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs uppercase tracking-widest text-[#d4af37]">Total Value</span>
                        <span className="text-lg font-display font-bold text-white">
                          ${selectedService?.price.toLocaleString()} USD
                        </span>
                      </div>
                      <p className="text-[11px] text-white/40 italic leading-snug">
                        * No upfront online deposit is required to secure this booking. Standard billing will be arranged directly.
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </div>

            </motion.div>
          )}

          {/* Step 5: Successful Booking Confirmation */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 space-y-8"
            >
              <div className="inline-flex p-4 bg-luxury-gold/5 border border-luxury-gold/20 rounded-full text-luxury-gold animate-bounce">
                <CheckCircle className="w-12 h-12" />
              </div>

              <div className="space-y-3">
                <h3 className="text-3xl font-display">Receipt <span className="italic">Delivered</span></h3>
                <p className="text-white/40 text-sm max-w-md mx-auto">
                  Your photographic session booking has been safely registered in our secure archives. Our master stylist team is compiling files.
                </p>
              </div>

              <div className="max-w-md mx-auto border border-white/10 p-6 bg-white/[0.01] rounded-2xl text-left font-mono text-xs space-y-3">
                <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-white/30 border-b border-white/5 pb-2">
                  <span>Ledger receipt file</span>
                  <span>CONFIRMED</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Receipt ID:</span>
                  <span className="text-white font-semibold">{createdPaymentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Booking ID:</span>
                  <span className="text-white font-semibold">{createdBookingId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Service scope:</span>
                  <span className="text-white font-semibold">{selectedService?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Date / Time:</span>
                  <span className="text-white font-semibold">{selectedDate} — {selectedTime}</span>
                </div>
                <div className="flex justify-between border-t border-white/5 pt-2">
                  <span className="text-luxury-gold font-bold">Amt Charge:</span>
                  <span className="text-luxury-gold font-bold">${selectedService?.price.toLocaleString()} USD</span>
                </div>
              </div>

              <div className="pt-6 flex justify-center gap-4">
                <Button variant="outline" onClick={() => navigate("/")} className="text-[10px] uppercase tracking-widest font-bold">
                  Return to Home
                </Button>
                {user && !user.isAnonymous && (
                  <Button onClick={() => navigate("/dashboard")} className="text-[10px] uppercase tracking-widest font-bold">
                    Go to my Dashboard
                  </Button>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </div>
  );
}
