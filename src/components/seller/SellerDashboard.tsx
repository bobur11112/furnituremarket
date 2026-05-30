import { useEffect, useMemo, useState } from "react";
import { BarChart3, DollarSign, Eye, EyeOff, ImagePlus, Package, Pencil, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import {
  deleteUploadedProductImages,
  uploadProductImages,
  useCategories,
  useDeleteProduct,
  useSellerProducts,
  useSellerStats,
  useToggleProductPublished,
  useUpdateProduct,
} from "@/hooks/useProducts";
import { formatPrice } from "@/lib/utils";
import { productSchema } from "@/schemas/product.schema";
import type { FurnitureStyle, Product, ProductDimensions } from "@/types/product";

type EditDraft = {
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

function StatCard({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
        <Icon className="h-8 w-8 text-primary" aria-hidden="true" />
      </CardContent>
    </Card>
  );
}

function productToDraft(product: Product): EditDraft {
  return {
    title: product.title,
    description: product.description ?? "",
    price: product.price,
    stock_count: product.stock_count,
    category_id: product.category_id,
    material: product.material ?? "",
    color: product.color ?? "",
    style: product.style ?? "modern",
    dimensions: product.dimensions ?? { width: 1, height: 1, depth: 1, unit: "cm" },
    images: product.images,
    is_published: product.is_published,
  };
}

export function SellerDashboard() {
  const { user } = useAuth();
  const productsQuery = useSellerProducts(user?.id);
  const statsQuery = useSellerStats(user?.id);
  const categoriesQuery = useCategories();
  const deleteMutation = useDeleteProduct();
  const toggleMutation = useToggleProductPublished();
  const updateMutation = useUpdateProduct();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  const products = productsQuery.data ?? [];
  const stats = statsQuery.data;
  const newFilePreviews = useMemo(
    () => newFiles.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [newFiles],
  );

  useEffect(
    () => () => {
      newFilePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    },
    [newFilePreviews],
  );

  function closeEditor() {
    setEditingProduct(null);
    setDraft(null);
    setNewFiles([]);
  }

  function openEditor(product: Product) {
    setEditingProduct(product);
    setDraft(productToDraft(product));
    setNewFiles([]);
  }

  async function saveEdit() {
    if (!editingProduct || !draft) return;
    if (draft.images.length + newFiles.length === 0) {
      toast({ title: "Images required", description: "Keep or upload at least one product image.", variant: "destructive" });
      return;
    }
    if (draft.images.length + newFiles.length > 6) {
      toast({ title: "Too many images", description: "Keep up to 6 images per product.", variant: "destructive" });
      return;
    }
    const validation = productSchema.safeParse(draft);
    if (!validation.success) {
      toast({ title: "Check product details", description: validation.error.issues[0]?.message ?? "Some fields are invalid.", variant: "destructive" });
      return;
    }

    let uploadedUrls: string[] = [];
    let productSaved = false;
    try {
      uploadedUrls = await uploadProductImages(newFiles);
      const images = [...draft.images, ...uploadedUrls];
      await updateMutation.mutateAsync({ ...editingProduct, ...draft, images });
      productSaved = true;
      const removedUrls = editingProduct.images.filter((imageUrl) => !images.includes(imageUrl));
      await deleteUploadedProductImages(removedUrls).catch(() => {
        toast({ title: "Product updated", description: "Some old image files could not be removed from storage." });
      });
      toast({ title: "Product updated", description: draft.title });
      closeEditor();
    } catch (error) {
      if (!productSaved && uploadedUrls.length > 0) await deleteUploadedProductImages(uploadedUrls).catch(() => undefined);
      toast({
        title: "Product update failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleDelete(product: Product) {
    try {
      await deleteMutation.mutateAsync(product);
      toast({ title: "Product deleted", description: product.title });
    } catch (error) {
      toast({
        title: "Product deletion failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleToggle(product: Product) {
    try {
      await toggleMutation.mutateAsync(product);
      toast({ title: product.is_published ? "Product hidden" : "Product published", description: product.title });
    } catch (error) {
      toast({
        title: "Status update failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  const queryError = productsQuery.error ?? statsQuery.error;

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Package} label="Total products" value={stats ? String(stats.totalProducts) : "..."} />
        <StatCard icon={BarChart3} label="Total orders" value={stats ? String(stats.totalOrders) : "..."} />
        <StatCard icon={DollarSign} label="Total revenue" value={stats ? formatPrice(stats.totalRevenue) : "..."} />
      </div>

      <Card>
        <CardContent className="p-0">
          {queryError ? (
            <div className="p-6">
              <h2 className="text-xl font-semibold">Could not load products</h2>
              <p className="mt-2 text-sm text-destructive">
                {queryError instanceof Error ? queryError.message : "Check Supabase configuration and database policies."}
              </p>
            </div>
          ) : productsQuery.isLoading ? (
            <div className="grid gap-3 p-5">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-semibold">No products yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">Add your first listing to begin selling.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img src={product.images[0]} alt={product.title} className="h-12 w-12 rounded-md object-cover" />
                        <div>
                          <p className="font-medium">{product.title}</p>
                          <p className="text-xs text-muted-foreground">{product.category?.name ?? product.style}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatPrice(product.price)}</TableCell>
                    <TableCell>{product.stock_count}</TableCell>
                    <TableCell>
                      <Badge variant={product.is_published ? "default" : "muted"}>
                        {product.is_published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditor(product)} aria-label={`Edit ${product.title}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={toggleMutation.isPending}
                          onClick={() => void handleToggle(product)}
                          aria-label={`${product.is_published ? "Unpublish" : "Publish"} ${product.title}`}
                        >
                          {product.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deleteMutation.isPending}
                          onClick={() => void handleDelete(product)}
                          aria-label={`Delete ${product.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Sheet open={Boolean(editingProduct && draft)} onOpenChange={(open) => (!open ? closeEditor() : undefined)}>
        <SheetContent className="overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Edit product</SheetTitle>
            <SheetDescription>Update catalog details, visibility, inventory, and images.</SheetDescription>
          </SheetHeader>
          {draft ? (
            <div className="mt-6 grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input id="edit-title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea id="edit-description" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="edit-price">Price</Label>
                  <Input id="edit-price" type="number" min="1" value={draft.price} onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-stock">Stock</Label>
                  <Input id="edit-stock" type="number" min="0" value={draft.stock_count} onChange={(event) => setDraft({ ...draft, stock_count: Number(event.target.value) })} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <select id="edit-category" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={draft.category_id} onChange={(event) => setDraft({ ...draft, category_id: event.target.value })}>
                    {categoriesQuery.data?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-style">Style</Label>
                  <select id="edit-style" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={draft.style} onChange={(event) => setDraft({ ...draft, style: event.target.value as FurnitureStyle })}>
                    <option value="modern">Modern</option>
                    <option value="classic">Classic</option>
                    <option value="scandinavian">Scandinavian</option>
                    <option value="industrial">Industrial</option>
                    <option value="minimalist">Minimalist</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="edit-material">Material</Label>
                  <Input id="edit-material" value={draft.material} onChange={(event) => setDraft({ ...draft, material: event.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-color">Color</Label>
                  <Input id="edit-color" value={draft.color} onChange={(event) => setDraft({ ...draft, color: event.target.value })} />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {(["width", "height", "depth"] as const).map((dimension) => (
                  <div className="grid gap-2" key={dimension}>
                    <Label htmlFor={`edit-${dimension}`}>{dimension}</Label>
                    <Input id={`edit-${dimension}`} type="number" min="1" value={draft.dimensions[dimension]} onChange={(event) => setDraft({ ...draft, dimensions: { ...draft.dimensions, [dimension]: Number(event.target.value) } })} />
                  </div>
                ))}
              </div>
              <label className="flex items-center gap-3 rounded-md border border-border p-3 text-sm font-medium">
                <input type="checkbox" checked={draft.is_published} onChange={(event) => setDraft({ ...draft, is_published: event.target.checked })} />
                Published in catalog
              </label>
              <div className="grid gap-3">
                <Label>Images</Label>
                <div className="grid grid-cols-3 gap-3">
                  {draft.images.map((imageUrl) => (
                    <div className="relative aspect-square overflow-hidden rounded-md border border-border" key={imageUrl}>
                      <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                      <button type="button" className="absolute right-1 top-1 rounded-full bg-background/90 p-1" onClick={() => setDraft({ ...draft, images: draft.images.filter((url) => url !== imageUrl) })} aria-label="Remove image">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {newFilePreviews.map((preview) => (
                    <div className="relative aspect-square overflow-hidden rounded-md border border-primary" key={preview.url}>
                      <img src={preview.url} alt={preview.file.name} className="h-full w-full object-cover" />
                      <button type="button" className="absolute right-1 top-1 rounded-full bg-background/90 p-1" onClick={() => setNewFiles((files) => files.filter((file) => file !== preview.file))} aria-label={`Remove ${preview.file.name}`}>
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
                  <ImagePlus className="h-4 w-4 text-primary" />
                  Add JPG, PNG, or WebP images
                  <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setNewFiles((files) => [...files, ...Array.from(event.target.files ?? [])].slice(0, 6))} />
                </label>
              </div>
              <Button disabled={updateMutation.isPending} onClick={() => void saveEdit()}>
                Save changes
              </Button>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
