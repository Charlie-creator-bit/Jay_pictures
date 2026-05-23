import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../lib/firebase";
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
import { useNavigate, useSearchParams } from "react-router-dom";
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
  Info
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

export default function Book() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedServiceId = searchParams.get("service");

  // Flow step state: 1: Service, 2: Date & Time, 3: Details, 4: Payment, 5: Confirmation
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  // User selections
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(""); // Format: YYYY-MM-DD
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

  // Initialize fields if user is signed in
  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      // Fetch user profile to pre-fill name
      const fetchProfile = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setFullName(userDoc.data().fullName || "");
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
      try {
        const querySnapshot = await getDocs(collection(db, "services"));
        const serviceList: Service[] = [];
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

        setServices(serviceList);

        // Pre-select package if matching parameter found
        if (preSelectedServiceId) {
          const matched = serviceList.find(s => s.id === preSelectedServiceId || s.title.toLowerCase().includes(preSelectedServiceId.toLowerCase()));
          if (matched) {
            setSelectedService(matched);
          }
        }
      } catch (err) {
        console.error("Error fetching services:", err);
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, [preSelectedServiceId]);

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

        // Sort slot times ascending (e.g. 09:00 before 11:00)
        slots.sort((a, b) => a.time.localeCompare(b.time));
        setSlotsForDate(slots);
      } catch (err: any) {
        console.error("Error querying slots:", err);
        setError("Could not retrieve timeslots for selected date.");
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
    if (direction === "prev") {
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
    if (!user) {
      setError("An active session is required. Preparing guest session, please retry in a second...");
      return;
    }
    if (!selectedService || !selectedDate || !selectedTime) {
      setError("Please complete all booking selections prior to submission.");
      return;
    }
    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      setError("Please fill out your contact details (including full name, phone number, and email).");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Find matching slot document ID to verify double booking and perform atomicity write
      const slotId = `${selectedDate}_${selectedTime.replace(":", "")}`;
      const slotRef = doc(db, "availability", slotId);
      
      // Secondary server check to prevent double bookings
      const slotSnap = await getDoc(slotRef);
      if (!slotSnap.exists()) {
        throw new Error("Chosen slot does not exist in the studio scheduling calendar. Please coordinate with the admin.");
      }
      if (slotSnap.data().isBooked) {
        throw new Error("This slot was booked by another client during your checkout. Please select a different time.");
      }

      // Ensure users/{userId} profile exists for database constraint validation
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        try {
          await setDoc(userRef, {
            fullName: fullName.trim(),
            email: email.trim(),
            role: "client",
            createdAt: serverTimestamp()
          });
        } catch (uErr: any) {
          console.error("Failed creating users profile record:", uErr);
          throw new Error("Could not initialize guest profile for booking: " + (uErr.message || uErr));
        }
      }

      // Generate secure transaction identifiers
      const bookingId = doc(collection(db, "bookings")).id;

      // 1. Write Booking Document FIRST matching raw rule schema invariants
      const bookingRef = doc(db, "bookings", bookingId);
      const bookingData = {
        clientId: user.uid,
        serviceId: selectedService.id,
        bookingDate: `${selectedDate}T${selectedTime}:00Z`,
        status: "pending",
        totalAmount: selectedService.price,
        createdAt: serverTimestamp(), // rule checks request.time
        updatedAt: serverTimestamp(),
      };

      try {
        await setDoc(bookingRef, bookingData);
      } catch (err: any) {
        handleFirestoreError(err, OperationType.WRITE, `bookings/${bookingId}`);
      }

      // 2. Perform the matching slot reservation update in availability
      try {
        await updateDoc(slotRef, {
          isBooked: true,
          bookingId: bookingId
        });
      } catch (err: any) {
        handleFirestoreError(err, OperationType.WRITE, `availability/${slotId}`);
      }

      // 3. Contact backend to initialize Paystack transaction secure URL
      const response = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId,
          email: email.trim(),
          amountType,
          currency: paymentCurrency,
        }),
      });

      const initData = await response.json();
      if (!response.ok || !initData.authorization_url) {
        throw new Error(initData.error || "Failed on payment initialization.");
      }

      // 4. Fire client-triggered admin-targeted notification
      const notificationId = doc(collection(db, "notifications")).id;
      const notificationRef = doc(db, "notifications", notificationId);
      const notificationData = {
        recipientId: "admin",
        title: "Booking Initialized",
        message: `${fullName} initialized a ${amountType} transaction (${paymentCurrency}) for ${selectedService.title}.`,
        isRead: false,
        type: "booking_new",
        createdAt: serverTimestamp(),
      };

      try {
        await setDoc(notificationRef, notificationData);
      } catch (err: any) {
        handleFirestoreError(err, OperationType.WRITE, `notifications/${notificationId}`);
      }

      // Redirect directly to Paystack payment gateway
      window.location.href = initData.authorization_url;

    } catch (err: any) {
      console.error("Booking error:", err);
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

              {loadingServices ? (
                <div className="text-center py-20 text-white/40 text-sm">
                  Querying the archives for dynamic packages...
                </div>
              ) : services.length === 0 ? (
                <div className="p-8 text-center border border-white/5 bg-white/[0.02] rounded-xl">
                  <Info className="w-8 h-8 text-luxury-gold mx-auto mb-4" />
                  <h4 className="text-lg font-serif mb-2">No Databases Packages Available</h4>
                  <p className="text-white/40 text-xs max-w-md mx-auto mb-6">
                    In compliance with Firestore design boundaries, services must exist in the database collections prior to booking.
                  </p>
                  <Button variant="outline" onClick={() => navigate("/login")}>
                    Log In as Admin to preseed them
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {services.map((svc) => (
                    <GlassCard 
                      key={svc.id}
                      onClick={() => setSelectedService(svc)}
                      className={`cursor-pointer p-6 border transition-all ${
                        selectedService?.id === svc.id 
                          ? "border-luxury-gold bg-luxury-gold/5" 
                          : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      <h4 className="text-lg font-serif text-white hover:text-luxury-gold mb-1">{svc.title}</h4>
                      <div className="text-xl font-display text-luxury-gold mb-4">${svc.price.toLocaleString()}+</div>
                      <p className="text-xs text-white/50 leading-relaxed mb-6 h-20 overflow-hidden line-clamp-4">{svc.description}</p>
                      
                      <div className="text-[10px] uppercase tracking-widest text-white/30 mb-4 border-t border-white/5 pt-4">Included deliverables</div>
                      <ul className="space-y-2 mb-6">
                        {getServiceFeatures(svc.title).slice(0, 3).map((feat, i) => (
                          <li key={i} className="text-[10px] text-white/60 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-luxury-gold shrink-0" />
                            {feat}
                          </li>
                        ))}
                      </ul>

                      <button 
                        title="Book Now"
                        label="book_now"
                        className={`w-full py-2 rounded-lg text-[9px] uppercase tracking-widest font-bold transition-all ${
                          selectedService?.id === svc.id 
                            ? "bg-luxury-gold text-black" 
                            : "bg-white/5 hover:bg-white/10 text-white"
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
                        
                        return (
                          <button
                            key={idx}
                            onClick={() => handleDateSelect(day)}
                            className={`aspect-square sm:p-2 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                              isSelected 
                                ? "bg-luxury-gold text-black font-bold border border-luxury-gold" 
                                : "hover:bg-white/5 text-white/80 border border-transparent"
                            }`}
                          >
                            {day}
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
                    <div className="p-6 border border-[#d4af37]/10 bg-[#d4af37]/5 rounded-xl space-y-3">
                      <HelpCircle className="w-6 h-6 text-luxury-gold" />
                      <p className="text-xs text-white/70 leading-relaxed">
                        No availability entries registered for this date.
                      </p>
                      <p className="text-[10px] text-white/40 leading-relaxed">
                        In compliance with security regulations, custom sessions must be booked inside slots initialized by the administrator.
                      </p>
                      
                      <button 
                        onClick={() => navigate("/admin")}
                        className="py-2 px-4 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] uppercase tracking-widest font-bold border border-white/10 transition-colors w-full"
                      >
                        Visit Studio admin to open dates
                      </button>
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
                  disabled={!fullName.trim() || !phone.trim() || !email.trim() || !user}
                  onClick={() => setStep(4)}
                  className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold"
                >
                  Continue to checkout <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Checkout & Ledger Payment */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 md:grid-cols-5 gap-8"
            >
              
              {/* Payment settings sheet */}
              <div className="md:col-span-3 space-y-6">
                <div>
                  <h3 className="text-xl font-display text-[#d4af37] mb-2">Secure Checkout</h3>
                  <p className="text-white/40 text-xs">Choose deposit amount and local channel currency linked to Paystack ledger.</p>
                </div>

                {/* Amount type toggle */}
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-4">
                  <span className="text-[10px] uppercase tracking-widest text-[#d4af37] font-bold block">1. Payment Pledge Split</span>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setAmountType("deposit")}
                      disabled={isSubmitting}
                      className={`p-4 border rounded-xl text-left transition-all ${
                        amountType === "deposit"
                          ? "border-luxury-gold bg-luxury-gold/5 text-white"
                          : "border-white/10 hover:border-white/20 text-white/60 bg-transparent"
                      }`}
                    >
                      <p className="text-xs font-bold uppercase tracking-wider">50% Deposit</p>
                      <p className="text-[10.5px] text-white/50 focus:text-white mt-1">Pay half now to lock slot, balance due pre-shoot.</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAmountType("full")}
                      disabled={isSubmitting}
                      className={`p-4 border rounded-xl text-left transition-all ${
                        amountType === "full"
                          ? "border-luxury-gold bg-luxury-gold/5 text-white"
                          : "border-white/10 hover:border-white/20 text-white/60 bg-transparent"
                      }`}
                    >
                      <p className="text-xs font-bold uppercase tracking-wider">Full Payment</p>
                      <p className="text-[10.5px] text-white/50 focus:text-white mt-1">Settle 100% of the session package today.</p>
                    </button>
                  </div>
                </div>

                {/* Local Currency Selector */}
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-4">
                  <span className="text-[10px] uppercase tracking-widest text-[#d4af37] font-bold block">2. Gateway Currency Channel</span>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentCurrency("USD")}
                      disabled={isSubmitting}
                      className={`p-3 border rounded-xl text-center transition-all ${
                        paymentCurrency === "USD"
                          ? "border-luxury-gold bg-luxury-gold/5 text-white"
                          : "border-white/10 hover:border-white/20 text-white/60 bg-transparent"
                      }`}
                    >
                      <p className="text-sm font-bold tracking-widest">USD ($)</p>
                      <p className="text-[9px] text-white/40 mt-1">Visa / Mastercard</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentCurrency("GHS")}
                      disabled={isSubmitting}
                      className={`p-3 border rounded-xl text-center transition-all ${
                        paymentCurrency === "GHS"
                          ? "border-luxury-gold bg-luxury-gold/5 text-white"
                          : "border-white/10 hover:border-white/20 text-white/60 bg-transparent"
                      }`}
                    >
                      <p className="text-sm font-bold tracking-widest">GHS (₵)</p>
                      <p className="text-[9px] text-white/40 mt-1">MTN MoMo & Cards</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentCurrency("NGN")}
                      disabled={isSubmitting}
                      className={`p-3 border rounded-xl text-center transition-all ${
                        paymentCurrency === "NGN"
                          ? "border-luxury-gold bg-luxury-gold/5 text-white"
                          : "border-white/10 hover:border-white/20 text-white/60 bg-transparent"
                      }`}
                    >
                      <p className="text-sm font-bold tracking-widest">NGN (₦)</p>
                      <p className="text-[9px] text-white/40 mt-1">Cards / Bank Pay</p>
                    </button>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep(3)} className="text-[10px] uppercase tracking-widest font-bold">
                    Go Back
                  </Button>
                  <Button 
                    disabled={isSubmitting || !selectedService}
                    onClick={handleFinalBooking}
                    className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold px-8"
                  >
                    {isSubmitting ? "Redirecting to Paystack Secure Portal..." : "Proceed to Payment"}
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
                      <span className="text-sm font-serif font-bold text-white">{selectedService?.title}</span>
                      <span className="text-xs block text-white/40">Base Price: ${selectedService?.price.toLocaleString()}</span>
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

                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-white/40 block">Client name</span>
                      <span className="text-xs text-white">{fullName}</span>
                    </div>

                    <div className="border-t border-white/5 pt-3">
                      <span className="text-[10px] uppercase tracking-wider text-white/40 block">Selected Ratio</span>
                      <span className="text-xs text-white capitalize">{amountType} Payment ({(amountType === "deposit" ? 0.5 : 1.0) * 100}%)</span>
                    </div>

                    <div className="border-t border-[#d4af37]/20 pt-4 space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs uppercase tracking-widest text-[#d4af37]">Final Total USD</span>
                        <span className="text-lg font-display font-bold text-white">
                          ${((selectedService?.price || 0) * (amountType === "deposit" ? 0.5 : 1.0)).toLocaleString()}
                        </span>
                      </div>

                      {paymentCurrency !== "USD" && (
                        <div className="flex justify-between items-baseline border-t border-white/5 pt-2">
                          <span className="text-xs uppercase tracking-widest text-[#d4af37]">Paystack Ledger</span>
                          <span className="text-lg font-mono font-bold text-white">
                            {paymentCurrency === "GHS" 
                              ? `₵${(((selectedService?.price || 0) * (amountType === "deposit" ? 0.5 : 1.0)) * 15).toLocaleString()} GHS`
                              : `₦${(((selectedService?.price || 0) * (amountType === "deposit" ? 0.5 : 1.0)) * 1400).toLocaleString()} NGN`
                            }
                          </span>
                        </div>
                      )}
                      
                      <div className="text-[9px] text-white/30 italic mt-1 leading-relaxed">
                        {paymentCurrency === "GHS" && "* Calculated using our standard rate of 1 USD = 15 GHS for local MoMo processing channels."}
                        {paymentCurrency === "NGN" && "* Calculated using our standard rate of 1 USD = 1,400 NGN for local Bank transfer networks."}
                      </div>
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
