import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Product, ProductFilters } from "@/types/product";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function parseSearchList(value: string | null) {
  return value ? value.split(",").filter(Boolean) : [];
}

export function listToSearchParam(values: string[]) {
  return values.length > 0 ? values.join(",") : null;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function productMatchesFilters(product: Product, filters: ProductFilters) {
  const categorySlug = product.category?.slug ?? "";
  const material = product.material ?? "";
  const style = product.style ?? "";
  const search = filters.search.toLowerCase().trim();

  const matchesCategory = filters.categories.length === 0 || filters.categories.includes(categorySlug);
  const matchesStyle = filters.styles.length === 0 || filters.styles.includes(product.style ?? "modern");
  const matchesMaterial = filters.materials.length === 0 || filters.materials.includes(material);
  const matchesPrice = product.price >= filters.minPrice && product.price <= filters.maxPrice;
  const matchesSearch =
    search.length === 0 ||
    product.title.toLowerCase().includes(search) ||
    (product.description ?? "").toLowerCase().includes(search) ||
    material.toLowerCase().includes(search) ||
    style.toLowerCase().includes(search);

  return matchesCategory && matchesStyle && matchesMaterial && matchesPrice && matchesSearch;
}

export function sortProducts(products: Product[], sort: ProductFilters["sort"]) {
  return [...products].sort((left, right) => {
    if (sort === "price_asc") return left.price - right.price;
    if (sort === "price_desc") return right.price - left.price;
    if (sort === "popular") return (right.popularity ?? 0) - (left.popularity ?? 0);
    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
  });
}

export function getInitials(name: string | null | undefined) {
  if (!name) return "M";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
