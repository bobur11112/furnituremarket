import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProductImageGalleryProps = {
  images: string[];
  title: string;
};

export function ProductImageGallery({ images, title }: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const activeImage = images[activeIndex] ?? images[0];

  return (
    <div className="grid gap-4">
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="aspect-[4/3] overflow-hidden rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label={`Open ${title} image gallery`}
      >
        <img src={activeImage} alt={title} className="h-full w-full object-cover" />
      </button>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {images.map((image, index) => (
          <button
            key={image}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={cn(
              "h-20 w-24 shrink-0 overflow-hidden rounded-md border bg-card focus:outline-none focus:ring-2 focus:ring-ring",
              activeIndex === index ? "border-primary" : "border-border",
            )}
            aria-label={`View image ${index + 1} of ${title}`}
          >
            <img src={image} alt={`${title} ${index + 1}`} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {lightboxOpen ? (
          <motion.div
            className="fixed inset-0 z-[80] grid place-items-center bg-black/85 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative max-h-[86vh] max-w-5xl overflow-hidden rounded-lg border border-border bg-card"
            >
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-3 top-3 z-10"
                onClick={() => setLightboxOpen(false)}
                aria-label="Close image gallery"
              >
                <X className="h-4 w-4" />
              </Button>
              <img src={activeImage} alt={title} className="max-h-[86vh] w-full object-contain" />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
