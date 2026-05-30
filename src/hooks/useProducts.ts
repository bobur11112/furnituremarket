import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { requireSupabaseConfigured, supabase, type Database } from "@/lib/supabase";
import { productMatchesFilters, sortProducts } from "@/lib/utils";
import { catalogMaxPrice, type Category, type FurnitureStyle, type Product, type ProductCreateInput, type ProductFilters } from "@/types/product";

const defaultFilters: ProductFilters = {
  categories: [],
  styles: [],
  materials: [],
  minPrice: 0,
  maxPrice: catalogMaxPrice,
  sort: "newest",
  search: "",
};

const productImagesBucket = "product-images";
const maxImageSize = 5 * 1024 * 1024;
const allowedImageExtensions = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type ProductWithCategoryRow = ProductRow & { categories?: Category | Category[] | null };

function isFurnitureStyle(value: string | null): value is FurnitureStyle {
  return value === "modern" || value === "classic" || value === "scandinavian" || value === "industrial" || value === "minimalist";
}

function normalizeProduct(row: ProductWithCategoryRow, categories: Category[] = []): Product {
  const relation = Array.isArray(row.categories) ? row.categories[0] : row.categories;
  return {
    ...row,
    price: Number(row.price),
    stock_count: Number(row.stock_count),
    images: row.images ?? [],
    style: isFurnitureStyle(row.style) ? row.style : null,
    category: relation ?? categories.find((category) => category.id === row.category_id),
    badge: row.stock_count === 0 ? "Sold Out" : undefined,
  };
}

function storagePathFromPublicUrl(imageUrl: string) {
  try {
    const marker = `/storage/v1/object/public/${productImagesBucket}/`;
    const pathname = new URL(imageUrl).pathname;
    const markerIndex = pathname.indexOf(marker);
    return markerIndex === -1 ? null : decodeURIComponent(pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}

export async function deleteUploadedProductImages(imageUrls: string[]) {
  requireSupabaseConfigured();
  const paths = [...new Set(imageUrls.map(storagePathFromPublicUrl).filter((path): path is string => Boolean(path)))];
  if (paths.length === 0) return;

  const { error } = await supabase.storage.from(productImagesBucket).remove(paths);
  if (error) throw error;
}

export async function fetchCategories() {
  requireSupabaseConfigured();
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) throw error;
  return data;
}

async function fetchPublishedProducts() {
  requireSupabaseConfigured();
  const { data, error } = await supabase
    .from("products")
    .select("*, categories(*)")
    .is("deleted_at", null)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as ProductWithCategoryRow[]).map((row) => normalizeProduct(row));
}

export async function fetchManagedProducts() {
  requireSupabaseConfigured();
  const { data, error } = await supabase
    .from("products")
    .select("*, categories(*)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as ProductWithCategoryRow[]).map((row) => normalizeProduct(row));
}

export async function fetchProducts(filters: Partial<ProductFilters> = {}) {
  const mergedFilters = { ...defaultFilters, ...filters };
  const products = await fetchPublishedProducts();
  return sortProducts(
    products.filter((product) => productMatchesFilters(product, mergedFilters)),
    mergedFilters.sort,
  );
}

export async function fetchProduct(id: string) {
  requireSupabaseConfigured();
  const { data, error } = await supabase
    .from("products")
    .select("*, categories(*)")
    .eq("id", id)
    .is("deleted_at", null)
    .eq("is_published", true)
    .maybeSingle();

  if (error) throw error;
  return data ? normalizeProduct(data as ProductWithCategoryRow) : null;
}

export async function uploadProductImages(files: File[]) {
  requireSupabaseConfigured();
  if (files.length === 0) return [];
  if (files.length > 6) throw new Error("Upload up to 6 images at a time.");

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("Admin sign in is required to upload images.");

  const uploadedPaths: string[] = [];
  try {
    for (const file of files) {
      const extension = allowedImageExtensions.get(file.type);
      if (!extension) throw new Error(`${file.name}: use JPG, PNG, or WebP.`);
      if (file.size > maxImageSize) throw new Error(`${file.name}: image must be 5 MB or smaller.`);

      const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from(productImagesBucket).upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });
      if (error) throw error;
      uploadedPaths.push(path);
    }
  } catch (error) {
    if (uploadedPaths.length > 0) await supabase.storage.from(productImagesBucket).remove(uploadedPaths).catch(() => undefined);
    throw error;
  }

  return uploadedPaths.map((path) => supabase.storage.from(productImagesBucket).getPublicUrl(path).data.publicUrl);
}

export async function createProduct(input: ProductCreateInput) {
  requireSupabaseConfigured();
  const { data, error } = await supabase.from("products").insert(input).select("*, categories(*)").single();
  if (error) throw error;
  return normalizeProduct(data as ProductWithCategoryRow);
}

export async function deleteProduct(product: Product) {
  requireSupabaseConfigured();
  const { error } = await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString(), is_published: false })
    .eq("id", product.id);
  if (error) throw error;

  await deleteUploadedProductImages(product.images).catch(() => undefined);
  return product.id;
}

export async function toggleProductPublished(product: Product) {
  requireSupabaseConfigured();
  const { data, error } = await supabase
    .from("products")
    .update({ is_published: !product.is_published })
    .eq("id", product.id)
    .select("*, categories(*)")
    .single();
  if (error) throw error;
  return normalizeProduct(data as ProductWithCategoryRow);
}

export async function updateProduct(product: Product) {
  requireSupabaseConfigured();
  const { data, error } = await supabase
    .from("products")
    .update({
      category_id: product.category_id,
      title: product.title,
      description: product.description,
      price: product.price,
      stock_count: product.stock_count,
      images: product.images,
      material: product.material,
      color: product.color,
      style: product.style,
      dimensions: product.dimensions,
      is_published: product.is_published,
    })
    .eq("id", product.id)
    .select("*, categories(*)")
    .single();
  if (error) throw error;
  return normalizeProduct(data as ProductWithCategoryRow);
}

export function useCategories() {
  return useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
}

export function useProducts(filters: ProductFilters) {
  return useQuery({ queryKey: ["products", filters], queryFn: () => fetchProducts(filters), refetchInterval: 5_000 });
}

export function useProduct(id: string | undefined) {
  return useQuery({ queryKey: ["product", id], queryFn: () => fetchProduct(id ?? ""), enabled: Boolean(id) });
}

export function useRelatedProducts(product: Product | null | undefined) {
  return useQuery({
    queryKey: ["related-products", product?.id, product?.category_id],
    queryFn: async () => {
      if (!product) return [];
      const source = await fetchProducts({ categories: product.category?.slug ? [product.category.slug] : [] });
      return source.filter((item) => item.id !== product.id).slice(0, 3);
    },
    enabled: Boolean(product),
  });
}

export function useSellerProducts(sellerId: string | undefined) {
  return useQuery({ queryKey: ["seller-products", sellerId], queryFn: fetchManagedProducts, enabled: Boolean(sellerId) });
}

export function useSellerStats(sellerId: string | undefined) {
  return useQuery({
    queryKey: ["seller-stats", sellerId],
    queryFn: async () => {
      requireSupabaseConfigured();
      const [products, ordersResult] = await Promise.all([
        fetchManagedProducts(),
        supabase.from("orders").select("total_price"),
      ]);
      if (ordersResult.error) throw ordersResult.error;

      return {
        totalProducts: products.length,
        totalOrders: ordersResult.data.length,
        totalRevenue: ordersResult.data.reduce((sum, order) => sum + Number(order.total_price), 0),
      };
    },
    enabled: Boolean(sellerId),
  });
}

function invalidateProductQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["products"] });
  queryClient.invalidateQueries({ queryKey: ["seller-products"] });
  queryClient.invalidateQueries({ queryKey: ["seller-stats"] });
  queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: createProduct, onSuccess: () => invalidateProductQueries(queryClient) });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: deleteProduct, onSuccess: () => invalidateProductQueries(queryClient) });
}

export function useToggleProductPublished() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: toggleProductPublished, onSuccess: () => invalidateProductQueries(queryClient) });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProduct,
    onSuccess: (product) => {
      invalidateProductQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: ["product", product.id] });
    },
  });
}
