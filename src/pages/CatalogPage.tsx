import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ProductFilters } from "@/components/product/ProductFilters";
import { ProductGrid } from "@/components/product/ProductGrid";
import { useCategories, useProducts } from "@/hooks/useProducts";
import { listToSearchParam, parseSearchList } from "@/lib/utils";
import { getSupabaseErrorMessage } from "@/lib/supabase";
import { catalogMaxPrice, type FurnitureStyle, type ProductFilters as ProductFiltersType } from "@/types/product";

const validStyles: FurnitureStyle[] = ["modern", "classic", "scandinavian", "industrial", "minimalist"];
const materials = ["Boucle", "Travertine", "Oak", "Alabaster", "Leather", "Marble"];

function parseStyles(value: string | null) {
  return parseSearchList(value).filter((style): style is FurnitureStyle => validStyles.includes(style as FurnitureStyle));
}

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoriesQuery = useCategories();

  const filters = useMemo<ProductFiltersType>(
    () => ({
      categories: parseSearchList(searchParams.get("categories")),
      styles: parseStyles(searchParams.get("styles")),
      materials: parseSearchList(searchParams.get("materials")),
      minPrice: Number(searchParams.get("min") ?? 0),
      maxPrice: Number(searchParams.get("max") ?? catalogMaxPrice),
      sort: (searchParams.get("sort") as ProductFiltersType["sort"] | null) ?? "newest",
      search: searchParams.get("q") ?? "",
    }),
    [searchParams],
  );

  const productsQuery = useProducts(filters);
  const queryError = productsQuery.error ?? categoriesQuery.error;

  function updateFilters(nextFilters: ProductFiltersType) {
    const next = new URLSearchParams();
    const categories = listToSearchParam(nextFilters.categories);
    const styles = listToSearchParam(nextFilters.styles);
    const selectedMaterials = listToSearchParam(nextFilters.materials);
    if (categories) next.set("categories", categories);
    if (styles) next.set("styles", styles);
    if (selectedMaterials) next.set("materials", selectedMaterials);
    if (nextFilters.minPrice > 0) next.set("min", String(nextFilters.minPrice));
    if (nextFilters.maxPrice < catalogMaxPrice) next.set("max", String(nextFilters.maxPrice));
    if (nextFilters.sort !== "newest") next.set("sort", nextFilters.sort);
    if (nextFilters.search.trim()) next.set("q", nextFilters.search.trim());
    setSearchParams(next, { replace: true });
  }

  return (
    <PageWrapper className="container py-10">
      <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Catalog</p>
          <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">Curated furniture</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Filter by material, silhouette, and price to build a room with intention.
          </p>
        </div>
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(event) => updateFilters({ ...filters, search: event.target.value })}
            placeholder="Search chairs, oak, marble..."
            className="pl-9"
            aria-label="Search catalog"
          />
        </div>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:gap-8">
        <ProductFilters
          filters={filters}
          categories={categoriesQuery.data ?? []}
          materials={materials}
          onChange={updateFilters}
          onClear={() => setSearchParams({}, { replace: true })}
        />
        <section className="min-w-0 flex-1">
          <div className="mb-5 flex justify-between">
            <p className="text-sm text-muted-foreground">{productsQuery.data?.length ?? 0} pieces available</p>
          </div>
          <ProductGrid
            products={productsQuery.data ?? []}
            isLoading={productsQuery.isLoading || categoriesQuery.isLoading}
            errorMessage={queryError ? getSupabaseErrorMessage(queryError) : undefined}
            onClearFilters={() => setSearchParams({}, { replace: true })}
          />
        </section>
      </div>
    </PageWrapper>
  );
}
