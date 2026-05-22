import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Plus, Upload, Trash2, Sliders, Image as ImageIcon, Camera, Check, AlertCircle } from "lucide-react";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { db, storage } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import GalleryModal from "./ui/GalleryModal.tsx";

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

export default function Portfolio() {
  const { role } = useAuth();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
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
  }, []);

  // Merge presets with Firestore dynamic items
  const combinedItems = [...dbItems, ...PRESET_PORTFOLIO_ITEMS];

  // Filter items matching active category
  const filteredItems = activeCategory === "All"
    ? combinedItems
    : combinedItems.filter(item => item.category.toLowerCase() === activeCategory.toLowerCase());

  const categories = ["All", "Weddings", "Portraits", "Events", "Fashion"];

  // Image Modal navigation arrays
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

  // Drag and Drop handles
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

  // Dynamic public curation submission to Firebase Storage & Firestore
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
      // 1. Storage Reference node designation
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
          // Upload complete! Get the dynamic download link
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

          // 2. Add document metadata log in Firestore folder
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
          fetchPortfolioItems(); // Refresh layout immediately
        }
      );

    } catch (err: any) {
      console.error(err);
      setErrorMsg("Upload pipeline crash: " + err.message);
      setUploadProgress(null);
    }
  };

  // Delete dynamic item
  const handleDeleteItem = async (e: React.MouseEvent, item: PortfolioItem) => {
    e.stopPropagation(); // Avoid triggering lightbox modal
    if (item.isPreset) return;
    if (!window.confirm("Do you want to permanently erase this dynamic image from public exhibition portfolio?")) return;

    try {
      // Delete document from Firestore
      await deleteDoc(doc(db, "portfolio", item.id));

      // Attempt to clean storage file (if referenced) We fetch and check storagePath if logged
      // But for robustness we'll update our state first
      setDbItems(prev => prev.filter(i => i.id !== item.id));
      setSuccessMsg("Creative item removed.");
    } catch (err: any) {
      setErrorMsg("Erase warning: " + err.message);
    }
  };

  return (
    <section id="portfolio" className="py-24 border-b border-white/5 bg-luxury-black text-white relative">
      <div className="container mx-auto px-6 sm:px-12">
        
        {/* Header Block with responsive alignment */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-2"
          >
            <div className="text-[10px] uppercase tracking-[0.25em] text-luxury-gold font-mono font-bold">Creative Curations</div>
            <h2 className="text-4xl md:text-5xl font-display text-white">
              Exposed <span className="italic font-serif text-[#d4af37]">Heirlooms</span>
            </h2>
            <p className="text-xs text-white/40 max-w-sm font-sans">
              Timeless moments frozen in high contrast, raw textures, and classical golden silhouettes.
            </p>
          </motion.div>

          {/* Action Curation Anchor for Workspace Administrators */}
          {role === "admin" && (
            <button
              onClick={() => setUploadOpen(!uploadOpen)}
              className="flex items-center gap-2 px-4 py-2 border border-[#d4af37]/30 hover:border-[#d4af37] bg-[#d4af37]/5 hover:bg-[#d4af37]/10 text-[#d4af37] text-[10px] uppercase font-mono tracking-wider font-bold rounded-lg transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              {uploadOpen ? "Close Admin Console" : "Add Image (Admin Storage)"}
            </button>
          )}
        </div>

        {/* Dynamic Admin Upload drawer with drag and drop */}
        <AnimatePresence>
          {role === "admin" && uploadOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden mb-12 border-b border-white/10"
            >
              <div className="p-6 bg-white/[0.01] border border-white/10 rounded-2xl mb-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Visual Drag zone */}
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
                      <p className="text-xs font-mono text-white/90 font-bold">{selectedFile.name}</p>
                      <p className="text-[10px] text-white/40">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Tap to swap</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 text-white/30 mx-auto group-hover:text-luxury-gold transition-colors" />
                      <p className="text-xs font-mono font-bold text-white">Drag & drop visual file here</p>
                      <p className="text-[10px] text-white/40">or browse computer catalogs (Supports high-res PNG, JPEG)</p>
                    </div>
                  )}
                </div>

                {/* Form configuration settings */}
                <form onSubmit={handleUploadSubmit} className="space-y-4 font-mono text-xs">
                  <div className="space-y-1">
                    <label className="text-white/42 block font-extrabold uppercase text-[9px] tracking-wider text-luxury-gold">Asset Name/Title</label>
                    <input 
                      type="text"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="e.g. Silk Silhouette"
                      className="w-full p-2.5 bg-black/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-luxury-gold text-xs"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-white/42 block font-extrabold uppercase text-[9px] tracking-wider text-luxury-gold">Category Segment</label>
                      <select
                        value={uploadCategory}
                        onChange={(e: any) => setUploadCategory(e.target.value)}
                        className="w-full p-2.5 bg-black/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-luxury-gold text-xs"
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
                        className="w-full py-2.5 bg-luxury-gold text-black uppercase font-bold text-[10px] tracking-widest rounded-lg cursor-pointer hover:bg-opacity-90 transition-all font-mono"
                      >
                        {uploadProgress !== null ? `Synchronizing...` : "Publish Live"}
                      </button>
                    </div>
                  </div>

                  {uploadProgress !== null && (
                    <div className="space-y-1 pt-2">
                      <div className="flex justify-between text-[9px] text-white/50">
                        <span>Uploading live to Cloud Storage Bucket...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-luxury-gold transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Informational messages */}
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

        {/* Categories selector widget */}
        <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-4 mb-12 scrollbar-none font-mono">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 sm:px-6 py-2 rounded-full text-[10px] uppercase font-bold tracking-widest transition-all cursor-pointer whitespace-nowrap border ${
                activeCategory.toLowerCase() === cat.toLowerCase()
                  ? "bg-luxury-gold/10 border-luxury-gold text-luxury-gold font-extrabold shadow-lg shadow-luxury-gold/5"
                  : "bg-black/40 border-white/5 text-white/50 hover:text-white hover:border-white/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Portfolio Masonry Grid Layout Column-Based */}
        {filteredItems.length === 0 ? (
          <div className="h-60 flex flex-col items-center justify-center gap-2 text-white/30 text-xs font-mono border border-white/5 bg-white/[0.01] rounded-2xl">
            <ImageIcon className="w-8 h-8 opacity-25" />
            No photoreal works exist matching this category currently.
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 [column-fill:_balance]">
            {filteredItems.map((item, idx) => (
              <motion.div
                key={item.id}
                layoutId={`card-container-${item.id}`}
                viewport={{ once: true }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => setSelectedIdx(idx)}
                className="group relative overflow-hidden break-inside-avoid rounded-2xl border border-white/5 bg-[#0a0a0a] cursor-pointer shadow-xl"
              >
                {/* Visual Image Render */}
                <div className="relative overflow-hidden w-full h-full">
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-auto object-cover grayscale transition-all duration-750 group-hover:grayscale-0 group-hover:scale-102 group-hover:opacity-90"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Premium Subtle dark overlay vignette and typography on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-5">
                    <span className="text-[8px] uppercase tracking-widest text-luxury-gold font-mono font-bold mb-1">
                      {item.category}
                    </span>
                    <h4 className="text-sm font-serif font-bold text-white line-clamp-1">
                      {item.title}
                    </h4>

                    {/* Delete dynamic trigger if admin */}
                    {role === "admin" && !item.isPreset && (
                      <button
                        onClick={(e) => handleDeleteItem(e, item)}
                        className="absolute top-4 right-4 p-2 bg-black/80 hover:bg-red-500/20 text-white/50 hover:text-red-400 rounded-lg backdrop-blur cursor-pointer z-10 transition-colors"
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

      {/* Dynamic upgraded Lightbox renderer modal */}
      <GalleryModal
        isOpen={selectedIdx !== null}
        onClose={() => setSelectedIdx(null)}
        images={imageURIs}
        currentIndex={selectedIdx ?? 0}
        onNext={handleNext}
        onPrev={handlePrev}
        title={selectedIdx !== null ? filteredItems[selectedIdx].title : ""}
      />
    </section>
  );
}
