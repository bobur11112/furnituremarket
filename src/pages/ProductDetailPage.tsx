import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, PackageCheck, Ruler, ShoppingBag, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductImageGallery } from "@/components/product/ProductImageGallery";
import { useCart } from "@/hooks/useCart";
import { useProduct, useRelatedProducts } from "@/hooks/useProducts";
import { formatPrice, getInitials } from "@/lib/utils";
import { getSupabaseErrorMessage } from "@/lib/supabase";

export function ProductDetailPage() {
  const { id } = useParams();
  const productQuery = useProduct(id);
  const product = productQuery.data;
  const relatedQuery = useRelatedProducts(product);
  const { addItem } = useCart();

  if (productQuery.isLoading) {
    return (
      <PageWrapper className="container py-10">
        <Skeleton className="h-[32rem] w-full" />
      </PageWrapper>
    );
  }

  if (!product) {
    return (
      <PageWrapper className="container grid min-h-[70vh] place-items-center py-10 text-center">
        <div>
          <h1 className="text-3xl font-semibold">{productQuery.isError ? "Catalog is unavailable" : "Product not found"}</h1>
          {productQuery.error ? <p className="mt-2 text-sm text-destructive">{getSupabaseErrorMessage(productQuery.error)}</p> : null}
          <Button className="mt-5" asChild>
            <Link to="/catalog">Back to catalog</Link>
          </Button>
        </div>
      </PageWrapper>
    );
  }

  const dimensions = product.dimensions
    ? `${product.dimensions.width} x ${product.dimensions.height} x ${product.dimensions.depth} ${product.dimensions.unit}`
    : "Made to measure";

  return (
    <PageWrapper className="container py-10">
      <Button variant="ghost" asChild className="mb-6">
        <Link to="/catalog">
          <ArrowLeft className="h-4 w-4" />
          Back to catalog
        </Link>
      </Button>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <ProductImageGallery images={product.images} title={product.title} />
        <section className="grid content-start gap-6">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge>{product.category?.name ?? "Furniture"}</Badge>
              {product.style ? <Badge variant="outline">{product.style}</Badge> : null}
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">{product.title}</h1>
            <p className="mt-4 text-3xl font-semibold text-primary">{formatPrice(product.price)}</p>
            <p className="mt-5 leading-7 text-muted-foreground">{product.description}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Ruler className="h-5 w-5 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-sm text-muted-foreground">Dimensions</p>
                  <p className="font-medium">{dimensions}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <PackageCheck className="h-5 w-5 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-sm text-muted-foreground">Stock</p>
                  <p className="font-medium">{product.stock_count > 0 ? `${product.stock_count} available` : "Sold out"}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <dl className="grid gap-3 rounded-lg border border-border bg-card p-5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Material</dt>
              <dd className="font-medium">{product.material ?? "Mixed"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Color</dt>
              <dd className="font-medium">{product.color ?? "Natural"}</dd>
            </div>
          </dl>

          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              size="lg"
              disabled={product.stock_count === 0}
              className="w-full"
              onClick={() => {
                addItem(product);
                toast({ title: "Added to cart", description: `${product.title} is ready for checkout.` });
              }}
            >
              <ShoppingBag className="h-5 w-5" />
              Add to cart
            </Button>
          </motion.div>

          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                {getInitials(product.seller?.full_name)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-primary" aria-hidden="true" />
                  <p className="font-semibold">{product.seller?.full_name ?? "Verified seller"}</p>
                </div>
                <p className="text-sm text-muted-foreground">Responds within 1 business day</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <section className="mt-16">
        <h2 className="mb-6 font-display text-3xl font-bold">Related pieces</h2>
        <ProductGrid products={relatedQuery.data ?? []} isLoading={relatedQuery.isLoading} />
      </section>
    </PageWrapper>
  );
}
