import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types/product";
import { ProductBadge } from "./ProductBadge";
import { getCategoryName, useLocale } from "@/contexts/LocaleContext";

export const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { locale, t } = useLocale();
  const isSoldOut = product.stock_count === 0;

  return (
    <motion.article
      variants={cardVariants}
      whileHover={{ y: -4, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
      className="group overflow-hidden rounded-lg border border-border bg-card"
    >
      <Link to={`/product/${product.id}`} className="block" aria-label={`View ${product.title}`}>
        <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
          <img
            src={product.images[0]}
            alt={product.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute left-3 top-3">
            <ProductBadge product={product} />
          </div>
          <Button
            type="button"
            size="icon"
            disabled={isSoldOut}
            aria-label={`Add ${product.title} to cart`}
            className="absolute bottom-3 right-3 opacity-0 shadow-card transition-opacity group-hover:opacity-100 focus:opacity-100"
            onClick={(event) => {
              event.preventDefault();
              addItem(product);
              toast({ title: t("addedToCart"), description: t("readyForCheckout") });
            }}
          >
            <ShoppingBag className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="line-clamp-2 font-semibold text-foreground">{product.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{getCategoryName(product.category?.slug, product.category?.name, locale)}</p>
            </div>
            <p className="whitespace-nowrap font-semibold text-primary">{formatPrice(product.price)}</p>
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        </div>
      </Link>
    </motion.article>
  );
}
