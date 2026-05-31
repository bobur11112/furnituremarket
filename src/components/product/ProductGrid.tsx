import { motion } from "framer-motion";
import { AlertCircle, Frame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@/types/product";
import { ProductCard } from "./ProductCard";
import { useLocale } from "@/contexts/LocaleContext";

const containerVariants = {
  animate: { transition: { staggerChildren: 0.07 } },
};

type ProductGridProps = {
  products: Product[];
  isLoading?: boolean;
  errorMessage?: string;
  onClearFilters?: () => void;
};

export function ProductGrid({ products, isLoading = false, errorMessage, onClearFilters }: ProductGridProps) {
  const { t } = useLocale();
  if (isLoading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-border bg-card p-3">
            <Skeleton className="aspect-[4/5] w-full" />
            <Skeleton className="mt-4 h-5 w-3/4" />
            <Skeleton className="mt-3 h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="grid min-h-72 place-items-center rounded-lg border border-destructive/40 bg-card p-8 text-center">
        <div className="max-w-md">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" aria-hidden="true" />
          <h2 className="mt-4 text-2xl font-semibold">{t("catalogUnavailable")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{errorMessage}</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="grid min-h-96 place-items-center rounded-lg border border-dashed border-border bg-card/60 p-8 text-center">
        <div className="max-w-sm">
          <Frame className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />
          <h2 className="mt-4 text-2xl font-semibold">{t("noArtworks")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("widenFilters")}</p>
          {onClearFilters ? (
            <Button className="mt-5" onClick={onClearFilters}>
              {t("clearFilters")}
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </motion.div>
  );
}
