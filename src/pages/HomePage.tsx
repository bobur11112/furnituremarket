import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Truck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ProductGrid } from "@/components/product/ProductGrid";
import { useProducts } from "@/hooks/useProducts";
import { getSupabaseErrorMessage } from "@/lib/supabase";
import { catalogMaxPrice } from "@/types/product";

const featuredFilters = {
  categories: [],
  styles: [],
  materials: [],
  minPrice: 0,
  maxPrice: catalogMaxPrice,
  sort: "popular" as const,
  search: "",
};

export function HomePage() {
  const productsQuery = useProducts(featuredFilters);
  const featuredProducts = (productsQuery.data ?? []).slice(0, 3);

  return (
    <PageWrapper>
      <section className="relative min-h-[76vh] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1800&q=85"
          alt="Luxury living room with curated furniture"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/10" />
        <div className="container relative flex min-h-[76vh] items-center pb-20 pt-16">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">Luxury furniture marketplace</p>
            <h1 className="mt-5 font-display text-5xl font-bold leading-tight text-balance sm:text-6xl lg:text-7xl">Möbel</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
              Discover sculptural seating, heirloom tables, quiet storage, and atmospheric lighting from verified sellers.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link to="/catalog">
                  Browse catalog
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="container -mt-14 grid gap-4 pb-16 md:grid-cols-3">
        {[
          { icon: BadgeCheck, title: "Verified ateliers", body: "Every seller is reviewed before listings go live." },
          { icon: Truck, title: "Insured delivery", body: "White-glove logistics with transparent order tracking." },
          { icon: Users, title: "Buyer concierge", body: "Shortlist pieces, compare materials, and build rooms faster." },
        ].map((item) => (
          <Card key={item.title} className="relative bg-card/95 backdrop-blur">
            <CardContent className="p-5">
              <item.icon className="h-7 w-7 text-primary" aria-hidden="true" />
              <h2 className="mt-4 text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="container pb-20">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Featured collection</p>
            <h2 className="mt-2 font-display text-4xl font-bold">Room-defining pieces</h2>
          </div>
          <Button variant="outline" asChild>
            <Link to="/catalog">View all products</Link>
          </Button>
        </div>
        <ProductGrid
          products={featuredProducts}
          isLoading={productsQuery.isLoading}
          errorMessage={productsQuery.error ? getSupabaseErrorMessage(productsQuery.error) : undefined}
        />
      </section>
    </PageWrapper>
  );
}
