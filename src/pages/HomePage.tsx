import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Frame, Instagram, Palette, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGrid } from "@/components/product/ProductGrid";
import { useProducts } from "@/hooks/useProducts";
import { getSupabaseErrorMessage } from "@/lib/supabase";
import { catalogMaxPrice } from "@/types/product";
import { useLocale } from "@/contexts/LocaleContext";

const instagramUrl = "https://www.instagram.com/bigart_uz";
const featuredFilters = { categories: [], styles: [], materials: [], minPrice: 0, maxPrice: catalogMaxPrice, sort: "popular" as const, search: "" };

export function HomePage() {
  const { t } = useLocale();
  const productsQuery = useProducts(featuredFilters);
  const featuredProducts = (productsQuery.data ?? []).slice(0, 4);

  return (
    <PageWrapper>
      <section className="relative isolate min-h-[35rem] overflow-hidden sm:min-h-[39rem] lg:min-h-[43rem]">
        <img src="/images/bigart-hero.png" alt="Картина BIGART в современном интерьере" className="absolute inset-0 h-full w-full object-cover object-[62%_center] sm:object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0e0d0b]/90 via-[#0e0d0b]/52 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0d0b]/45 via-transparent to-[#0e0d0b]/10" />
        <div className="container relative flex min-h-[35rem] items-center py-14 sm:min-h-[39rem] lg:min-h-[43rem]">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-[42rem]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary sm:text-sm">{t("heroEyebrow")}</p>
            <h1 className="mt-5 text-5xl font-bold tracking-[0.12em] text-white sm:text-7xl lg:text-8xl">BIGART</h1>
            <p className="mt-5 max-w-xl text-2xl font-semibold leading-tight text-white sm:text-3xl">{t("heroTitle")}</p>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/80 sm:text-lg">{t("heroBody")}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild className="h-12 px-7 text-base shadow-glow"><Link to="/catalog">{t("browseCatalog")}<ArrowRight className="h-4 w-4" /></Link></Button>
              <Button size="lg" variant="outline" asChild className="h-12 border-white/25 bg-black/15 px-7 text-base text-white backdrop-blur-sm hover:border-primary hover:bg-black/35"><a href={instagramUrl} target="_blank" rel="noreferrer"><Instagram className="h-4 w-4" />{t("writeInstagram")}</a></Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="container py-16 sm:py-20">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary sm:text-sm">{t("collectionEyebrow")}</p>
            <h2 className="mt-2 font-display text-4xl font-bold sm:text-5xl">{t("collectionTitle")}</h2>
            <p className="mt-3 max-w-xl leading-7 text-muted-foreground">{t("collectionBody")}</p>
          </div>
          <Button variant="outline" asChild className="self-start md:self-auto"><Link to="/catalog">{t("viewAll")}<ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
        {productsQuery.isLoading || productsQuery.error || featuredProducts.length === 0 ? (
          <ProductGrid products={featuredProducts} isLoading={productsQuery.isLoading} errorMessage={productsQuery.error ? getSupabaseErrorMessage(productsQuery.error) : undefined} />
        ) : (
          <motion.div initial="initial" animate="animate" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </motion.div>
        )}
      </section>

      <section id="about" className="scroll-mt-24 border-y border-white/10 bg-[#15120f]">
        <div className="container grid gap-px md:grid-cols-3">
          {[
            { icon: Palette, title: t("featureOriginalTitle"), body: t("featureOriginalBody") },
            { icon: Frame, title: t("featureInteriorTitle"), body: t("featureInteriorBody") },
            { icon: Truck, title: t("featureDeliveryTitle"), body: t("featureDeliveryBody") },
          ].map((item) => (
            <motion.div key={item.title} whileHover={{ y: -4 }} className="group border-white/10 px-6 py-9 transition-colors hover:bg-white/[0.025] md:border-r md:px-8 md:py-11 last:border-r-0">
              <item.icon className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
              <h2 className="mt-5 text-xl font-semibold">{item.title}</h2>
              <p className="mt-3 max-w-sm text-sm leading-7 text-muted-foreground">{item.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container grid gap-8 py-16 sm:py-20 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:gap-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary sm:text-sm">{t("aboutEyebrow")}</p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl font-bold leading-tight sm:text-5xl">{t("aboutTitle")}</h2>
          <p className="mt-5 max-w-2xl leading-8 text-muted-foreground">{t("aboutBody")}</p>
        </div>
        <div id="delivery" className="scroll-mt-24 border-l border-primary/70 pl-6 sm:pl-8">
          <Truck className="h-8 w-8 text-primary" />
          <h3 className="mt-5 text-2xl font-semibold leading-tight">{t("deliveryTitle")}</h3>
          <p className="mt-3 leading-7 text-muted-foreground">{t("deliveryBody")}</p>
          <Button variant="outline" asChild className="mt-6"><a href={instagramUrl} target="_blank" rel="noreferrer"><Instagram className="h-4 w-4" />{t("writeInstagram")}</a></Button>
        </div>
      </section>
    </PageWrapper>
  );
}
