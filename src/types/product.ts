export type FurnitureStyle = "modern" | "classic" | "scandinavian" | "industrial" | "minimalist";

export const catalogMaxPrice = 100_000_000;

export type DimensionUnit = "cm" | "inch";

export type ProductDimensions = {
  width: number;
  height: number;
  depth: number;
  unit: DimensionUnit;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
};

export type SellerSummary = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "seller" | "admin" | "buyer";
};

export type ProductBadge = "New" | "Sale" | "Sold Out";

export type Product = {
  id: string;
  seller_id: string;
  category_id: string;
  title: string;
  description: string | null;
  price: number;
  stock_count: number;
  images: string[];
  dimensions: ProductDimensions | null;
  material: string | null;
  color: string | null;
  style: FurnitureStyle | null;
  is_published: boolean;
  created_at: string;
  deleted_at: string | null;
  category?: Category;
  seller?: SellerSummary;
  badge?: ProductBadge;
  popularity?: number;
};

export type ProductSort = "newest" | "price_asc" | "price_desc" | "popular";

export type ProductFilters = {
  categories: string[];
  styles: FurnitureStyle[];
  materials: string[];
  minPrice: number;
  maxPrice: number;
  sort: ProductSort;
  search: string;
};

export type ProductCreateInput = {
  seller_id: string;
  title: string;
  description: string;
  price: number;
  stock_count: number;
  category_id: string;
  material: string;
  color: string;
  style: FurnitureStyle;
  dimensions: ProductDimensions;
  images: string[];
  is_published: boolean;
};
