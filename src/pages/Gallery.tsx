import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowRight, Plus, Upload, Trash2, Sliders, Image as ImageIcon, Camera, Check, 
  AlertCircle, Search, LayoutGrid, Grid3X3, Filter, RefreshCw, Sparkles, Download, Info
} from "lucide-react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { db, storage } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import GalleryModal from "../components/ui/GalleryModal.tsx";
import Button from "../components/ui/Button.tsx";

interface PortfolioItem {
  id: string;
  title: string;
  category: "Weddings" | "Portraits" | "Events" | "Fashion" | string;
  image: string;
  isPreset?: boolean;
}

const PRESET_PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    id: "preset-wedding-1",
    title: "Vows in Venice",
    category: "Weddings",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200",
    isPreset: true
  },
  {
    id: "preset-fashion-1",
    title: "Nocturnal Noir Studio",
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1200",
    isPreset: true
  },
  {
    id: "preset-portrait-1",
    title: "The Silent Brush",
    category: "Portraits",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1200",
    isPreset: true
  },
  {
    id: "preset-event-1",
    title: "Neon Concert Vibrations",
    category: "Events",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1200",
    isPreset: true
  },
  {
    id: "preset-wedding-2",
    title: "Golden Hour Embrace",
    category: "Weddings",
    image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=1200",
    isPreset: true
  },
  {
    id: "preset-portrait-2",
    title: "Shadow Play of the Muse",
    category: "Portraits",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=1200",
    isPreset: true
  },
  {
    id: "preset-fashion-2",
    title: "Editorial Golden Drapes",
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1200",
    isPreset: true
  },
  {
    id: "preset-event-2",
    title: "The Grand Performance",
    category: "Events",
    image: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&q=80&w=1200",
    isPreset: true
  },
  {
    id: "preset-portrait-3",
    title: "Sands of the Nomad",
    category: "Portraits",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=1200",
    isPreset: true
  },
  {
    id: "preset-wedding-3",
    title: "Ethereal Cathedral Vows",
    category: "Weddings",
    image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1200",
    isPreset: true
  },
  {
    id: "preset-fashion-3",
    title: "Stark Modernist Profile",
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=1200",
    isPreset: true
  },
  {
    id: "preset-event-3",
    title: "Gilded Ballroom Reception",
    category: "Events",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=1200",
    isPreset: true
  }
];

export default function Gallery() {
  const { role } = useAuth();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [layoutMode, setLayoutMode] = useState<"masonry" | "bento">("masonry");
  const [dbItems, setDbItems] = useState<PortfolioItem[]>([]);
  const [loadingDb, setLoadingDb] = useState(false);

  // Uploader configurations
  const [uploadOpen, setUploadOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState<"Weddings" | "Portraits" | "Events" | "Fashion">("Weddings");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPortfolioItems = async () => {
    setLoadingDb(true);
    try {
      const q = query(collection(db, "portfolio"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const items: PortfolioItem[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          title: data.title || "Curated Piece",
          category: data.category || "Portraits",
          image: data.image || ""
        });
      });
      setDbItems(items);
    } catch (err) {
      console.warn("Could not query dynamic portfolio. Fallback models active:", err);
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    fetchPortfolioItems();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const combinedItems = [...dbItems, ...PRESET_PORTFOLIO_ITEMS];

  // Primary filtering (matching active category + search queries)
  const filteredItems = combinedItems.filter(item => {
    const matchesCategory = activeCategory === "All" || item.category.toLowerCase() === activeCategory.toLowerCase();
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = ["All", "Weddings", "Portraits", "Events", "Fashion"];
  const imageURIs = filteredItems.map(item => item.image);

  const handleNext = () => {
    if (selectedIdx !== null) {
      setSelectedIdx((selectedIdx + 1) % filteredItems.length);
    }
  };

  const handlePrev = () => {
    if (selectedIdx !== null) {
      setSelectedIdx((selectedIdx - 1 + filteredItems.length) % filteredItems.length);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg("Please select a photo file to continue.");
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");
    setUploadProgress(0);

    try {
      const storagePath = `portfolio/${Date.now()}_${selectedFile.name}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(pct);
        },
        (error) => {
          console.error("Storage upload failure:", error);
          setErrorMsg("Could not upload to Firebase Storage: " + error.message);
          setUploadProgress(null);
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

          await addDoc(collection(db, "portfolio"), {
            title: uploadTitle || selectedFile.name.split(".")[0],
            category: uploadCategory,
            image: downloadUrl,
            storagePath: storagePath,
            createdAt: new Date()
          });

          setSuccessMsg("Masterpiece uploaded live to gallery database!");
          setUploadTitle("");
          setSelectedFile(null);
          setUploadProgress(null);
          fetchPortfolioItems();
        }
      );

    } catch (err: any) {
      console.error(err);
      setErrorMsg("Upload pipeline crash: " + err.message);
      setUploadProgress(null);
    }
  };

  const handleDeleteItem = async (e: React.MouseEvent, item: PortfolioItem) => {
    e.stopPropagation();
    if (item.isPreset) return;
    if (!window.confirm("Do you want to permanently erase this dynamic image from public exhibition portfolio?")) return;

    try {
      await deleteDoc(doc(db, "portfolio", item.id));
      setDbItems(prev => prev.filter(i => i.id !== item.id));
      setSuccessMsg("Creative item removed.");
    } catch (err: any) {
      setErrorMsg("Erase warning: " + err.message);
    }
  };

  // Bento layout index mapping helper
  const getBentoClasses = (index: number) => {
    const indexInCycle = index % 6;
    switch (indexInCycle) {
      case 0: // Tall grid item
        return "md:row-span-2 md:col-span-2 h-[450px] sm:h-[600px]";
      case 1: // Small landscape
        return "h-[220px] sm:h-[280px]";
      case 2: // Medium portrait
        return "md:row-span-2 h-[350px] sm:h-[600px]";
      case 3: // Standard box
        return "h-[220px] sm:h-[280px]";
      case 4: // Wide landscape
        return "md:col-span-2 h-[220px] sm:h-[280px]";
      case 5: // Standard square
        return "h-[220px] sm:h-[280px]";
      default:
        return "h-[280px]";
    }
  };

  return (
    <div className="min-h-screen bg-luxury-black text-white pt-28 pb-20 relative overflow-hidden">
      <div className="container mx-auto px-6 sm:px-12 relative z-10">
        
        {/* Intro Hero Header */}
        <div className="max-w-4xl mx-auto text-center mb-16 space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-luxury-gold/10 border border-luxury-gold/30 rounded-full text-[9px] uppercase tracking-[0.2em] text-luxury-gold font-mono"
          >
            <Sparkles className="w-3 h-3 text-luxury-gold" />
            <span>Exquisite Photography Exhibition</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl font-display text-white"
          >
            The Gallery of <span className="italic font-serif text-[#d4af37]">Jay Pictures</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-sm text-white/50 max-w-xl mx-auto font-sans leading-relaxed"
          >
            Experience a masterfully collected vault of luxury captures. Browse weddings, fine-art portraits, major concerts, and visual editorial essays.
          </motion.p>
        </div>

        {/* Dynamic Admin Upload Trigger */}
        {role === "admin" && (
          <div className="max-w-5xl mx-auto mb-10 flex justify-end">
            <button
              onClick={() => setUploadOpen(!uploadOpen)}
              className="flex items-center gap-2 px-5 py-2.5 border border-[#d4af37]/40 hover:border-[#d4af37] bg-[#d4af37]/5 hover:bg-[#d4af37]/15 text-[#d4af37] text-[10px] uppercase font-mono tracking-wider font-bold rounded-xl transition-all cursor-pointer shadow-lg"
            >
              <Camera className="w-4 h-4" />
              {uploadOpen ? "Close Admin Console" : "Add Gallery Asset (Admin)"}
            </button>
          </div>
        )}

        {/* Dynamic Upload Box for administrators */}
        <AnimatePresence>
          {role === "admin" && uploadOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="overflow-hidden mb-12 max-w-5xl mx-auto"
            >
              <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-8 shadow-2xl backdrop-blur-md">
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col justify-center items-center gap-3 transition-colors ${
                    dragActive ? "border-luxury-gold bg-luxury-gold/5" : "border-white/10 hover:border-luxury-gold"
                  }`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ cursor: "pointer" }}
                >
                  <input 
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />

                  {selectedFile ? (
                    <div className="space-y-2">
                      <Check className="w-8 h-8 text-green-400 mx-auto" />
                      <p className="text-xs font-mono text-white/95 font-bold">{selectedFile.name}</p>
                      <p className="text-[10px] text-white/40">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Tap to replace</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 text-white/30 mx-auto" />
                      <p className="text-xs font-mono font-bold text-white">Drag & drop visual file here</p>
                      <p className="text-[10px] text-white/40">or browse files from computer storage</p>
                    </div>
                  )}
                </div>

                <form onSubmit={handleUploadSubmit} className="space-y-4 font-mono text-xs">
                  <div className="space-y-1">
                    <label className="text-luxury-gold font-bold uppercase text-[9px] tracking-wider block">Image Title</label>
                    <input 
                      type="text"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="e.g. Ivory Romance"
                      className="w-full p-3 bg-black/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-luxury-gold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-luxury-gold font-bold uppercase text-[9px] tracking-wider block">Category Segment</label>
                      <select
                        value={uploadCategory}
                        onChange={(e: any) => setUploadCategory(e.target.value)}
                        className="w-full p-3 bg-black/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-luxury-gold"
                      >
                        <option value="Weddings">Weddings</option>
                        <option value="Portraits">Portraits</option>
                        <option value="Events">Events</option>
                        <option value="Fashion">Fashion</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        disabled={uploadProgress !== null}
                        className="w-full py-3 bg-luxury-gold text-black uppercase font-bold text-[10px] tracking-widest rounded-lg cursor-pointer hover:bg-opacity-90 transition-all"
                      >
                        {uploadProgress !== null ? "Uploading..." : "Publish Live Record"}
                      </button>
                    </div>
                  </div>

                  {uploadProgress !== null && (
                    <div className="space-y-1 pt-2">
                      <div className="flex justify-between text-[9px] text-white/50">
                        <span>Writing to Firebase Cloud Storage Node...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-luxury-gold transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  )}

                  {errorMsg && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] rounded-lg flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>{successMsg}</span>
                    </div>
                  )}
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Interface Navigation: Search and View Layout Switches */}
        <div className="max-w-6xl mx-auto mb-12 flex flex-col md:flex-row gap-6 justify-between items-center bg-white/[0.01] border border-white/5 p-4 rounded-2xl backdrop-blur">
          
          {/* Tag Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none font-mono">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-[10px] uppercase font-bold tracking-widest transition-all cursor-pointer whitespace-nowrap border ${
                  activeCategory.toLowerCase() === cat.toLowerCase()
                    ? "bg-luxury-gold/10 border-luxury-gold text-luxury-gold font-extrabold"
                    : "bg-black/40 border-white/5 text-white/50 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Controller Group: Search & Mode Selectors */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            
            {/* Elegant Search Engine Input */}
            <div className="relative w-full sm:w-64 font-mono text-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search archive..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/5 rounded-full text-white placeholder-white/30 focus:outline-none focus:border-luxury-gold transition-colors text-[11px]"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-[10px]"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Layout Switch Layout */}
            <div className="flex items-center gap-1.5 bg-black/60 p-1 border border-white/5 rounded-full">
              <button
                onClick={() => setLayoutMode("masonry")}
                className={`p-2 rounded-full transition-all ${
                  layoutMode === "masonry" ? "bg-luxury-gold text-black" : "text-white/40 hover:text-white"
                }`}
                title="Masonry Mode"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLayoutMode("bento")}
                className={`p-2 rounded-full transition-all ${
                  layoutMode === "bento" ? "bg-luxury-gold text-black" : "text-white/40 hover:text-white"
                }`}
                title="Bento Editorial Mode"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

        {/* Gallery Dynamic Exhibition Section */}
        {filteredItems.length === 0 ? (
          <div className="h-80 max-w-6xl mx-auto flex flex-col items-center justify-center gap-3 text-white/30 text-xs font-mono border border-white/5 bg-white/[0.01] rounded-2xl shadow-inner">
            <ImageIcon className="w-10 h-10 opacity-20" />
            <p className="font-semibold">No visual works exist matching current metrics.</p>
            <p className="text-[10px] text-white/20">Try expanding your search query or selecting a different archive tag.</p>
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}
                className="mt-2 px-3 py-1 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 active:scale-95 transition-all text-[10px] uppercase font-bold tracking-wider"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : layoutMode === "masonry" ? (
          /* MASONRY FLOW COLUMN CONFIGURATION */
          <div className="max-w-6xl mx-auto columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 [column-fill:_balance]">
            {filteredItems.map((item, idx) => (
              <motion.div
                key={item.id}
                layoutId={`gallery-card-${item.id}`}
                viewport={{ once: true }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => setSelectedIdx(idx)}
                className="group relative overflow-hidden break-inside-avoid rounded-2xl border border-white/5 bg-[#0a0a0a] cursor-pointer shadow-xl transition-all hover:border-luxury-gold/20"
              >
                <div className="relative overflow-hidden w-full h-full">
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-auto object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-102"
                    referrerPolicy="no-referrer"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-5">
                    <span className="text-[8px] uppercase tracking-[0.25em] text-luxury-gold font-mono font-bold mb-1 block">
                      {item.category}
                    </span>
                    <h4 className="text-sm font-serif font-bold text-white line-clamp-1">
                      {item.title}
                    </h4>

                    {/* Delete dynamic trigger if admin & is not preset item */}
                    {role === "admin" && !item.isPreset && (
                      <button
                        onClick={(e) => handleDeleteItem(e, item)}
                        className="absolute top-4 right-4 p-2 bg-black/80 hover:bg-red-500/20 text-white/50 hover:text-red-400 rounded-lg backdrop-blur cursor-pointer z-10 transition-colors border border-white/5"
                        title="Remove work"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* EDITORIAL DESIGN BENTO COLUMN-GRID CONFIGURATION */
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-max">
            {filteredItems.map((item, idx) => (
              <motion.div
                key={item.id}
                layoutId={`gallery-card-${item.id}`}
                viewport={{ once: true }}
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                onClick={() => setSelectedIdx(idx)}
                className={`group relative overflow-hidden rounded-3xl border border-white/5 bg-[#0a0a0a] cursor-pointer shadow-xl transition-all hover:border-luxury-gold/20 ${getBentoClasses(idx)}`}
              >
                <div className="absolute inset-0 w-full h-full">
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-102"
                    referrerPolicy="no-referrer"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6 z-10">
                    <span className="text-[8px] uppercase tracking-[0.25em] text-luxury-gold font-mono font-bold mb-1 block">
                      {item.category}
                    </span>
                    <h4 className="text-lg font-serif font-bold text-white line-clamp-1">
                      {item.title}
                    </h4>

                    {role === "admin" && !item.isPreset && (
                      <button
                        onClick={(e) => handleDeleteItem(e, item)}
                        className="absolute top-6 right-6 p-2 bg-black/80 hover:bg-red-500/20 text-white/50 hover:text-red-400 rounded-lg backdrop-blur cursor-pointer z-20 transition-colors border border-white/5"
                        title="Remove work"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>

      {/* Upgraded Gallery Lightbox Modal Component */}
      <GalleryModal
        isOpen={selectedIdx !== null}
        onClose={() => setSelectedIdx(null)}
        images={imageURIs}
        currentIndex={selectedIdx ?? 0}
        onNext={handleNext}
        onPrev={handlePrev}
        title={selectedIdx !== null ? filteredItems[selectedIdx].title : ""}
      />
    </div>
  );
}
