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
import { getCategoryName, useLocale } from "@/contexts/LocaleContext";

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
  const { locale } = useLocale();
  const text = locale === "ru" ? {
    products: "Всего картин", orders: "Всего заказов", revenue: "Выручка", loadFailed: "Не удалось загрузить картины", empty: "Картин пока нет", emptyBody: "Добавьте первую картину в каталог.", product: "Картина", price: "Цена", stock: "Количество", status: "Статус", actions: "Действия", published: "Опубликовано", draft: "Черновик", edit: "Редактировать картину", editBody: "Измените информацию, публикацию, количество и изображения.", title: "Название", description: "Описание", category: "Категория", style: "Стиль", material: "Материалы и техника", color: "Цветовая гамма", width: "Ширина", height: "Высота", depth: "Толщина", publishedCatalog: "Опубликовано в каталоге", images: "Изображения", addImages: "Добавить JPG, PNG или WebP", save: "Сохранить изменения", updated: "Картина обновлена", deleted: "Картина удалена", hidden: "Картина скрыта", imagesRequired: "Добавьте изображение", tooMany: "Слишком много изображений", check: "Проверьте данные картины",
  } : {
    products: "Jami rasmlar", orders: "Jami buyurtmalar", revenue: "Tushum", loadFailed: "Rasmlarni yuklab bo'lmadi", empty: "Hozircha rasmlar yo'q", emptyBody: "Katalogga birinchi rasmni qo'shing.", product: "Rasm", price: "Narx", stock: "Soni", status: "Holat", actions: "Amallar", published: "Nashr qilingan", draft: "Qoralama", edit: "Rasmni tahrirlash", editBody: "Ma'lumot, nashr, soni va rasmlarni o'zgartiring.", title: "Nomi", description: "Tavsif", category: "Toifa", style: "Uslub", material: "Material va texnika", color: "Ranglar", width: "Kenglik", height: "Balandlik", depth: "Qalinlik", publishedCatalog: "Katalogda nashr qilingan", images: "Rasmlar", addImages: "JPG, PNG yoki WebP qo'shish", save: "O'zgarishlarni saqlash", updated: "Rasm yangilandi", deleted: "Rasm o'chirildi", hidden: "Rasm yashirildi", imagesRequired: "Rasm qo'shing", tooMany: "Rasmlar juda ko'p", check: "Rasm ma'lumotlarini tekshiring",
  };
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
      toast({ title: text.imagesRequired, description: text.addImages, variant: "destructive" });
      return;
    }
    if (draft.images.length + newFiles.length > 6) {
      toast({ title: text.tooMany, description: "Max: 6", variant: "destructive" });
      return;
    }
    const validation = productSchema.safeParse(draft);
    if (!validation.success) {
      toast({ title: text.check, description: validation.error.issues[0]?.message ?? text.check, variant: "destructive" });
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
        toast({ title: text.updated, description: draft.title });
      });
      toast({ title: text.updated, description: draft.title });
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
      toast({ title: text.deleted, description: product.title });
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
      toast({ title: product.is_published ? text.hidden : text.published, description: product.title });
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
        <StatCard icon={Package} label={text.products} value={stats ? String(stats.totalProducts) : "..."} />
        <StatCard icon={BarChart3} label={text.orders} value={stats ? String(stats.totalOrders) : "..."} />
        <StatCard icon={DollarSign} label={text.revenue} value={stats ? formatPrice(stats.totalRevenue) : "..."} />
      </div>

      <Card>
        <CardContent className="p-0">
          {queryError ? (
            <div className="p-6">
              <h2 className="text-xl font-semibold">{text.loadFailed}</h2>
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
              <h2 className="mt-4 text-xl font-semibold">{text.empty}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{text.emptyBody}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{text.product}</TableHead><TableHead>{text.price}</TableHead><TableHead>{text.stock}</TableHead><TableHead>{text.status}</TableHead><TableHead className="text-right">{text.actions}</TableHead>
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
                          <p className="text-xs text-muted-foreground">{getCategoryName(product.category?.slug, product.category?.name, locale)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatPrice(product.price)}</TableCell>
                    <TableCell>{product.stock_count}</TableCell>
                    <TableCell>
                      <Badge variant={product.is_published ? "default" : "muted"}>
                        {product.is_published ? text.published : text.draft}
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
            <SheetTitle>{text.edit}</SheetTitle>
            <SheetDescription>{text.editBody}</SheetDescription>
          </SheetHeader>
          {draft ? (
            <div className="mt-6 grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">{text.title}</Label>
                <Input id="edit-title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">{text.description}</Label>
                <Textarea id="edit-description" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="edit-price">{text.price}</Label>
                  <Input id="edit-price" type="number" min="1" value={draft.price} onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-stock">{text.stock}</Label>
                  <Input id="edit-stock" type="number" min="0" value={draft.stock_count} onChange={(event) => setDraft({ ...draft, stock_count: Number(event.target.value) })} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="edit-category">{text.category}</Label>
                  <select id="edit-category" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={draft.category_id} onChange={(event) => setDraft({ ...draft, category_id: event.target.value })}>
                    {categoriesQuery.data?.map((category) => <option key={category.id} value={category.id}>{getCategoryName(category.slug, category.name, locale)}</option>)}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-style">{text.style}</Label>
                  <select id="edit-style" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={draft.style} onChange={(event) => setDraft({ ...draft, style: event.target.value as FurnitureStyle })}>
                    <option value="modern">{locale === "ru" ? "Современный" : "Zamonaviy"}</option>
                    <option value="classic">{locale === "ru" ? "Классический" : "Klassik"}</option>
                    <option value="scandinavian">{locale === "ru" ? "Минимализм" : "Minimalizm"}</option>
                    <option value="industrial">{locale === "ru" ? "Лофт" : "Loft"}</option>
                    <option value="minimalist">{locale === "ru" ? "Лаконичный" : "Minimalistik"}</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="edit-material">{text.material}</Label>
                  <Input id="edit-material" value={draft.material} onChange={(event) => setDraft({ ...draft, material: event.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-color">{text.color}</Label>
                  <Input id="edit-color" value={draft.color} onChange={(event) => setDraft({ ...draft, color: event.target.value })} />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {(["width", "height", "depth"] as const).map((dimension) => (
                  <div className="grid gap-2" key={dimension}>
                    <Label htmlFor={`edit-${dimension}`}>{text[dimension]}</Label>
                    <Input id={`edit-${dimension}`} type="number" min="1" value={draft.dimensions[dimension]} onChange={(event) => setDraft({ ...draft, dimensions: { ...draft.dimensions, [dimension]: Number(event.target.value) } })} />
                  </div>
                ))}
              </div>
              <label className="flex items-center gap-3 rounded-md border border-border p-3 text-sm font-medium">
                <input type="checkbox" checked={draft.is_published} onChange={(event) => setDraft({ ...draft, is_published: event.target.checked })} />
                {text.publishedCatalog}
              </label>
              <div className="grid gap-3">
                <Label>{text.images}</Label>
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
                  {text.addImages}
                  <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setNewFiles((files) => [...files, ...Array.from(event.target.files ?? [])].slice(0, 6))} />
                </label>
              </div>
              <Button disabled={updateMutation.isPending} onClick={() => void saveEdit()}>
                {text.save}
              </Button>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
