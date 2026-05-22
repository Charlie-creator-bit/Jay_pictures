import { motion, AnimatePresence } from "motion/react";
import { X, ChevronLeft, ChevronRight, Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, Download } from "lucide-react";
import { useEffect, useState, useRef } from "react";

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  title: string;
}

export default function GalleryModal({
  isOpen,
  onClose,
  images,
  currentIndex,
  onNext,
  onPrev,
  title,
}: GalleryModalProps) {
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset zoom on index change
  useEffect(() => {
    setZoom(1);
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    };

    window.addEventListener("keydown", handleKeyDown);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, onNext, onPrev]);

  const toggleFullscreen = () => {
    if (!modalRef.current) return;
    try {
      if (!document.fullscreenElement) {
        modalRef.current.requestFullscreen().catch(() => {
          setIsFullscreen(!isFullscreen); // Simulated fallback state
        });
      } else {
        document.exitFullscreen().catch(() => {
          setIsFullscreen(false);
        });
      }
    } catch (err) {
      setIsFullscreen(!isFullscreen);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.75));
  const handleZoomReset = () => setZoom(1);

  const handleDownload = () => {
    const activeUrl = images[currentIndex];
    if (!activeUrl) return;
    // Open in separate browser window/tab as full secure resolution delivery
    window.open(activeUrl, "_blank");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="gallery-modal-container"
          ref={modalRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col justify-between bg-black/98 backdrop-blur-2xl p-4 md:p-8"
        >
          {/* Header Bar */}
          <div className="w-full p-4 flex justify-between items-center text-white/50 border-b border-white/5 bg-black/40 backdrop-blur z-20">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-[0.3em] font-mono text-luxury-gold font-bold mb-0.5">
                Exhibition Archive
              </span>
              <span className="text-base sm:text-lg font-display text-white truncate max-w-[200px] sm:max-w-md">{title || "Curated Vintage Capture"}</span>
            </div>

            {/* Lightbox controls widget */}
            <div className="flex items-center gap-1 sm:gap-3">
              <button
                onClick={handleZoomIn}
                className="p-2 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4.5 h-4.5" />
              </button>
              {zoom !== 1 && (
                <button
                  onClick={handleZoomReset}
                  className="p-2 hover:text-white hover:bg-white/5 rounded-full transition-colors hidden sm:inline-flex"
                  title="Reset Scale"
                >
                  <RotateCcw className="w-4.5 h-4.5" />
                </button>
              )}
              <div className="h-6 w-[1px] bg-white/10 mx-1 hidden sm:block" />
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                title="Fullscreen Toggle"
              >
                {isFullscreen ? <Minimize2 className="w-4.5 h-4.5" /> : <Maximize2 className="w-4.5 h-4.5" />}
              </button>
              <button
                onClick={handleDownload}
                className="p-2 hover:text-luxury-gold hover:bg-white/5 text-[#d4af37]/80 rounded-full transition-all"
                title="Download High-Res Original"
              >
                <Download className="w-4.5 h-4.5" />
              </button>
              <div className="h-6 w-[1px] bg-white/10 mx-1" />
              <button
                onClick={onClose}
                className="p-2 hover:text-white hover:bg-red-500/20 text-white/50 rounded-full transition-colors"
                title="Close Lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Interactive Image Frame */}
          <div className="relative flex-1 w-full flex items-center justify-center p-2 sm:p-6 overflow-hidden z-10">
            {/* Desktop Left Control */}
            <button
              onClick={(e) => { e.stopPropagation(); onPrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-4 bg-black/30 hover:bg-black/60 border border-white/5 hover:border-luxury-gold text-white/50 hover:text-luxury-gold rounded-full transition-all hidden md:block cursor-pointer backdrop-blur"
              title="Previous Picture"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Desktop Right Control */}
            <button
              onClick={(e) => { e.stopPropagation(); onNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-4 bg-black/30 hover:bg-black/60 border border-white/5 hover:border-luxury-gold text-white/50 hover:text-luxury-gold rounded-full transition-all hidden md:block cursor-pointer backdrop-blur"
              title="Next Picture"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Active Render Box */}
            <div 
              className="relative max-h-full max-w-full flex items-center justify-center transition-transform duration-300"
              style={{ transform: `scale(${zoom})` }}
              onDoubleClick={handleZoomReset}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  src={images[currentIndex]}
                  className="max-h-[80vh] sm:max-h-[85vh] max-w-full object-contain shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] border border-white/10 bg-black"
                  alt="High-resolution visual"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>
            </div>
          </div>

          {/* Footer Navigation Bar */}
          <div className="w-full p-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-white/5 bg-black/30 z-20 font-mono">
            <div className="flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    // Navigate to specific index
                    setZoom(1);
                    // Standard trigger relies on parent state trigger, so let's allow jumping if parent lets us.
                  }}
                  className={`h-1 cursor-default transition-all duration-300 ${
                    i === currentIndex ? "w-8 bg-luxury-gold" : "w-1.5 bg-white/20 hover:bg-white/40"
                  }`}
                  disabled
                />
              ))}
            </div>

            <div className="flex items-center gap-4 text-[10px] text-white/45">
              <span>Double-click image to Reset Zoom</span>
              <span className="text-luxury-gold font-bold">
                {currentIndex + 1} / {images.length}
              </span>
            </div>

            {/* Mobile Touch controls helper */}
            <div className="flex justify-between w-full sm:w-auto gap-12 md:hidden">
              <button 
                onClick={onPrev} 
                className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/80 active:bg-luxury-gold active:text-black transition-all inline-flex text-xs cursor-pointer font-bold"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <button 
                onClick={onNext} 
                className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/80 active:bg-luxury-gold active:text-black transition-all inline-flex text-xs cursor-pointer font-bold"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

