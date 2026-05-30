import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categories as demoCategories, demoSeller, products as demoProducts } from "@/lib/mockData";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { productMatchesFilters, sortProducts } from "@/lib/utils";
import type { Category, FurnitureStyle, Product, ProductCreateInput, ProductFilters } from "@/types/product";

const defaultFilters: ProductFilters = {
  categories: [],
  styles: [],
  materials: [],
  minPrice: 0,
  maxPrice: 10000,
  sort: "newest",
  search: "",
};

function isFurnitureStyle(value: string | null): value is FurnitureStyle {
  return value === "modern" || value === "classic" || value === "scandinavian" || value === "industrial" || value === "minimalist";
}

async function delay(ms = 280) {
  await new Promise((resolve) => window.setTimeout(resolve, ms));
}

function attachRelations(product: Product, categories: Category[]) {
  const category = categories.find((item) => item.id === product.category_id) ?? product.category;
  return {
    ...product,
    category,
    seller: product.seller ?? {
      id: demoSeller.id,
      full_name: demoSeller.full_name,
      avatar_url: demoSeller.avatar_url,
      role: demoSeller.role,
    },
  };
}

async function fetchCategories() {
  if (!isSupabaseConfigured) {
    await delay(120);
    return demoCategories;
  }

  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) throw error;
  return data;
}

async function fetchPublishedProducts() {
  if (!isSupabaseConfigured) {
    await delay();
    return demoProducts;
  }

  const [categoryResult, productResult] = await Promise.all([
    supabase.from("categories").select("*"),
    supabase.from("products").select("*").eq("is_published", true),
  ]);

  if (categoryResult.error) throw categoryResult.error;
  if (productResult.error) throw productResult.error;

  const sourceCategories = categoryResult.data;
  return productResult.data.map<Product>((row) =>
    attachRelations(
      {
        ...row,
        price: Number(row.price),
        stock_count: Number(row.stock_count),
        images: row.images ?? [],
        style: isFurnitureStyle(row.style) ? row.style : null,
        badge: row.stock_count === 0 ? "Sold Out" : undefined,
      },
      sourceCategories,
    ),
  );
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
  if (!isSupabaseConfigured) {
    await delay(180);
    return demoProducts.find((product) => product.id === id) ?? null;
  }

  const [categoryResult, productResult] = await Promise.all([
    supabase.from("categories").select("*"),
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
  ]);

  if (categoryResult.error) throw categoryResult.error;
  if (productResult.error) throw productResult.error;
  if (!productResult.data) return null;

  const row = productResult.data;
  return attachRelations(
    {
      ...row,
      price: Number(row.price),
      stock_count: Number(row.stock_count),
      images: row.images ?? [],
      style: isFurnitureStyle(row.style) ? row.style : null,
      badge: row.stock_count === 0 ? "Sold Out" : undefined,
    },
    categoryResult.data,
  );
}

export async function uploadProductImages(files: File[]) {
  if (!isSupabaseConfigured) {
    await delay(350);
    return files.map((file) => URL.createObjectURL(file));
  }

  const uploads = await Promise.all(
    files.map(async (file) => {
      const extension = file.name.split(".").pop() ?? "jpg";
      const path = `${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      return data.publicUrl;
    }),
  );

  return uploads;
}

export async function createProduct(input: ProductCreateInput) {
  if (!isSupabaseConfigured) {
    await delay(300);
    const category = demoCategories.find((item) => item.id === input.category_id);
    return {
      id: crypto.randomUUID(),
      ...input,
      created_at: new Date().toISOString(),
      category,
      seller: {
        id: input.seller_id,
        full_name: "Demo Seller",
        avatar_url: null,
        role: "seller" as const,
      },
    } satisfies Product;
  }

  const { data, error } = await supabase.from("products").insert(input).select("*").single();
  if (error) throw error;

  return {
    ...data,
    price: Number(data.price),
    stock_count: Number(data.stock_count),
    images: data.images ?? [],
    style: isFurnitureStyle(data.style) ? data.style : null,
  } satisfies Product;
}

export async function deleteProduct(productId: string) {
  if (!isSupabaseConfigured) {
    await delay(180);
    return productId;
  }

  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) throw error;
  return productId;
}

export async function toggleProductPublished(product: Product) {
  if (!isSupabaseConfigured) {
    await delay(180);
    return { ...product, is_published: !product.is_published };
  }

  const { data, error } = await supabase
    .from("products")
    .update({ is_published: !product.is_published })
    .eq("id", product.id)
    .select("*")
    .single();
  if (error) throw error;

  return {
    ...data,
    price: Number(data.price),
    stock_count: Number(data.stock_count),
    images: data.images ?? [],
    style: isFurnitureStyle(data.style) ? data.style : null,
  } satisfies Product;
}

export async function updateProduct(product: Product) {
  if (!isSupabaseConfigured) {
    await delay(220);
    return product;
  }

  const { data, error } = await supabase
    .from("products")
    .update({
      title: product.title,
      description: product.description,
      price: product.price,
      stock_count: product.stock_count,
      material: product.material,
      color: product.color,
      style: product.style,
      dimensions: product.dimensions,
      is_published: product.is_published,
    })
    .eq("id", product.id)
    .select("*")
    .single();
  if (error) throw error;

  return {
    ...product,
    ...data,
    price: Number(data.price),
    stock_count: Number(data.stock_count),
    images: data.images ?? product.images,
    style: isFurnitureStyle(data.style) ? data.style : null,
  } satisfies Product;
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
}

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => fetchProducts(filters),
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id ?? ""),
    enabled: Boolean(id),
  });
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
  return useQuery({
    queryKey: ["seller-products", sellerId],
    queryFn: async () => {
      const source = isSupabaseConfigured
        ? await (async () => {
            const { data, error } = await supabase.from("products").select("*").eq("seller_id", sellerId ?? "");
            if (error) throw error;
            return data.map<Product>((row) => ({
              ...row,
              price: Number(row.price),
              stock_count: Number(row.stock_count),
              images: row.images ?? [],
              style: isFurnitureStyle(row.style) ? row.style : null,
            }));
          })()
        : demoProducts;
      return source.filter((product) => !sellerId || product.seller_id === sellerId || sellerId === "demo-seller");
    },
    enabled: Boolean(sellerId),
  });
}

export function useSellerStats(sellerId: string | undefined) {
  return useQuery({
    queryKey: ["seller-stats", sellerId],
    queryFn: async () => {
      const products = await fetchProducts({});
      const sellerProducts = products.filter((product) => !sellerId || product.seller_id === sellerId || sellerId === "demo-seller");
      const revenue = sellerProducts.reduce((sum, product) => sum + product.price * Math.min(product.popularity ?? 1, 14), 0);
      return {
        totalProducts: sellerProducts.length,
        totalOrders: Math.max(4, Math.round(sellerProducts.length * 2.5)),
        totalRevenue: revenue,
      };
    },
    enabled: Boolean(sellerId),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProduct,
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["seller-products", product.seller_id] });
    },
    onMutate: async (newProduct) => {
      await queryClient.cancelQueries({ queryKey: ["products"] });
      const previousProducts = queryClient.getQueryData<Product[]>(["products", defaultFilters]);
      const optimisticProduct: Product = {
        id: crypto.randomUUID(),
        ...newProduct,
        category: demoCategories.find((category) => category.id === newProduct.category_id),
        seller: {
          id: newProduct.seller_id,
          full_name: "Uploading seller",
          avatar_url: null,
          role: "seller",
        },
        created_at: new Date().toISOString(),
      };
      queryClient.setQueriesData<Product[]>({ queryKey: ["products"] }, (old = []) => [optimisticProduct, ...old]);
      return { previousProducts };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(["products", defaultFilters], context.previousProducts);
      }
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["seller-products"] });
    },
  });
}

export function useToggleProductPublished() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleProductPublished,
    onMutate: async (product) => {
      await queryClient.cancelQueries({ queryKey: ["seller-products"] });
      queryClient.setQueriesData<Product[]>({ queryKey: ["seller-products"] }, (old = []) =>
        old.map((item) => (item.id === product.id ? { ...item, is_published: !item.is_published } : item)),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["seller-products"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProduct,
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["seller-products", product.seller_id] });
      queryClient.invalidateQueries({ queryKey: ["product", product.id] });
    },
  });
}
