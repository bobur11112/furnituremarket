import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Frame, Palette, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ProductGrid } from "@/components/product/ProductGrid";
import { useProducts } from "@/hooks/useProducts";
import { getSupabaseErrorMessage } from "@/lib/supabase";
import { catalogMaxPrice } from "@/types/product";
import { useLocale } from "@/contexts/LocaleContext";

const featuredFilters = { categories: [], styles: [], materials: [], minPrice: 0, maxPrice: catalogMaxPrice, sort: "popular" as const, search: "" };

export function HomePage() {
  const { t } = useLocale();
  const productsQuery = useProducts(featuredFilters);
  const featuredProducts = (productsQuery.data ?? []).slice(0, 3);
  const heroImage = featuredProducts[0]?.images[0] || "https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=1800&q=88";

  return (
    <PageWrapper>
      <section className="relative min-h-[76vh] overflow-hidden">
        <img src={heroImage} alt="BIGART" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/15" />
        <div className="container relative flex min-h-[76vh] items-center pb-20 pt-16">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">{t("heroEyebrow")}</p>
            <h1 className="mt-5 text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">BIGART</h1>
            <p className="mt-5 max-w-xl text-xl font-medium leading-8 text-white">{t("heroTitle")}</p>
            <p className="mt-3 max-w-xl text-base leading-7 text-white/75">{t("heroBody")}</p>
            <Button size="lg" asChild className="mt-8"><Link to="/catalog">{t("browseCatalog")}<ArrowRight className="h-4 w-4" /></Link></Button>
          </motion.div>
        </div>
      </section>
      <section className="border-b border-border bg-card">
        <div className="container grid gap-px md:grid-cols-3">
          {[
            { icon: Palette, title: t("featureOriginalTitle"), body: t("featureOriginalBody") },
            { icon: Frame, title: t("featureInteriorTitle"), body: t("featureInteriorBody") },
            { icon: Truck, title: t("featureDeliveryTitle"), body: t("featureDeliveryBody") },
          ].map((item) => <div key={item.title} className="border-border px-5 py-7 md:border-r last:border-r-0"><item.icon className="h-6 w-6 text-primary" /><h2 className="mt-4 text-lg font-semibold">{item.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p></div>)}
        </div>
      </section>
      <section className="container py-20">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div><p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">{t("collectionEyebrow")}</p><h2 className="mt-2 font-display text-4xl font-bold">{t("collectionTitle")}</h2></div>
          <Button variant="outline" asChild><Link to="/catalog">{t("viewAll")}</Link></Button>
        </div>
        <ProductGrid products={featuredProducts} isLoading={productsQuery.isLoading} errorMessage={productsQuery.error ? getSupabaseErrorMessage(productsQuery.error) : undefined} />
      </section>
    </PageWrapper>
  );
}
