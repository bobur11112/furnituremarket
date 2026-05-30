import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types/product";

export function ProductBadge({ product }: { product: Product }) {
  const badge = product.stock_count === 0 ? "Sold Out" : product.badge;
  if (!badge) return null;

  return <Badge variant={badge === "Sold Out" ? "destructive" : badge === "Sale" ? "secondary" : "default"}>{badge}</Badge>;
}
