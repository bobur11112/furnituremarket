import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { formatPrice } from "@/lib/utils";
import { catalogMaxPrice, type Category, type FurnitureStyle, type ProductFilters as ProductFiltersType, type ProductSort } from "@/types/product";
import { getCategoryName, getStyleName, useLocale } from "@/contexts/LocaleContext";

const styles: FurnitureStyle[] = ["modern", "classic", "scandinavian", "industrial", "minimalist"];

type ProductFiltersProps = {
  filters: ProductFiltersType;
  categories: Category[];
  materials: string[];
  onChange: (filters: ProductFiltersType) => void;
  onClear: () => void;
};

function toggleValue<T extends string>(values: T[], value: T) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function FilterContent({ filters, categories, materials, onChange, onClear }: ProductFiltersProps) {
  const { locale, t } = useLocale();
  const sortOptions: Array<{ value: ProductSort; label: string }> = [
    { value: "newest", label: t("newest") }, { value: "popular", label: t("popular") },
    { value: "price_asc", label: t("priceAsc") }, { value: "price_desc", label: t("priceDesc") },
  ];
  return (
    <div className="grid gap-7">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("filters")}</h2>
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="h-4 w-4" />
          {t("clearAll")}
        </Button>
      </div>

      <div className="grid gap-3">
        <Label htmlFor="sort">{t("sort")}</Label>
        <select
          id="sort"
          value={filters.sort}
          onChange={(event) => onChange({ ...filters, sort: event.target.value as ProductSort })}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <Label>{t("priceRange")}</Label>
          <span className="text-xs text-muted-foreground">
            {formatPrice(filters.minPrice)} - {formatPrice(filters.maxPrice)}
          </span>
        </div>
        <Slider
          min={0}
          max={catalogMaxPrice}
          step={1000}
          value={[filters.minPrice, filters.maxPrice]}
          onValueChange={(value) => {
            const [minPrice = 0, maxPrice = catalogMaxPrice] = value;
            onChange({ ...filters, minPrice, maxPrice });
          }}
          aria-label="Price range"
        />
      </div>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">{t("category")}</legend>
        {categories.map((category) => (
          <div key={category.id} className="flex items-center gap-3">
            <Checkbox
              id={`category-${category.slug}`}
              checked={filters.categories.includes(category.slug)}
              onCheckedChange={() => onChange({ ...filters, categories: toggleValue(filters.categories, category.slug) })}
            />
            <Label htmlFor={`category-${category.slug}`} className="text-muted-foreground">
              {getCategoryName(category.slug, category.name, locale)}
            </Label>
          </div>
        ))}
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">{t("style")}</legend>
        {styles.map((style) => (
          <div key={style} className="flex items-center gap-3">
            <Checkbox
              id={`style-${style}`}
              checked={filters.styles.includes(style)}
              onCheckedChange={() => onChange({ ...filters, styles: toggleValue(filters.styles, style) })}
            />
            <Label htmlFor={`style-${style}`} className="text-muted-foreground">
              {getStyleName(style, locale)}
            </Label>
          </div>
        ))}
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">{t("technique")}</legend>
        {materials.map((material) => (
          <div key={material} className="flex items-center gap-3">
            <Checkbox
              id={`material-${material}`}
              checked={filters.materials.includes(material)}
              onCheckedChange={() => onChange({ ...filters, materials: toggleValue(filters.materials, material) })}
            />
            <Label htmlFor={`material-${material}`} className="text-muted-foreground">
              {material}
            </Label>
          </div>
        ))}
      </fieldset>
    </div>
  );
}

export function ProductFilters(props: ProductFiltersProps) {
  const { t } = useLocale();
  return (
    <>
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-24 rounded-lg border border-border bg-card p-5">
          <FilterContent {...props} />
        </div>
      </aside>

      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">
              <Filter className="h-4 w-4" />
              {t("filters")}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{t("refineCatalog")}</SheetTitle>
              <SheetDescription>{t("refineDescription")}</SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent {...props} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
