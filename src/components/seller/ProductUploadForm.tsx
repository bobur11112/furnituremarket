import { useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ImagePlus, Loader2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import { deleteUploadedProductImages, uploadProductImages, useCategories, useCreateProduct } from "@/hooks/useProducts";
import { productSchema, type ProductFormValues } from "@/schemas/product.schema";
import { cn } from "@/lib/utils";
import { getCategoryName, useLocale } from "@/contexts/LocaleContext";

const defaultValues: ProductFormValues = {
  title: "",
  description: "",
  price: 0,
  stock_count: 1,
  category_id: "",
  material: "",
  color: "",
  style: "modern",
  dimensions: {
    width: 1,
    height: 1,
    depth: 1,
    unit: "cm",
  },
};

export function ProductUploadForm() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const text = locale === "ru" ? {
    title: "Название картины", description: "Описание", price: "Цена, сум", stock: "Количество", category: "Категория", style: "Стиль", material: "Материалы и техника", color: "Цветовая гамма", width: "Ширина", height: "Высота", depth: "Толщина", unit: "Единица", upload: "Загрузите изображения картины", uploadBody: "JPG, PNG или WebP. До 6 изображений.", preview: "Здесь появится предпросмотр изображений.", publish: "Опубликовать картину", published: "Картина опубликована", publishedBody: "добавлена в каталог.", rejected: "Изображение не принято", rejectedBody: "Используйте до 6 изображений JPG, PNG или WebP размером не более 5 МБ.", signIn: "Требуется вход", signInBody: "Войдите в аккаунт администратора.", imagesRequired: "Добавьте изображение", imagesRequiredBody: "Нужно загрузить хотя бы одно изображение картины.", dimensions: "Все размеры должны быть положительными.",
  } : {
    title: "Rasm nomi", description: "Tavsif", price: "Narx, so'm", stock: "Soni", category: "Toifa", style: "Uslub", material: "Material va texnika", color: "Ranglar", width: "Kenglik", height: "Balandlik", depth: "Qalinlik", unit: "Birlik", upload: "Rasm fayllarini yuklang", uploadBody: "JPG, PNG yoki WebP. 6 tagacha rasm.", preview: "Rasmlarning ko'rinishi shu yerda chiqadi.", publish: "Rasmni nashr qilish", published: "Rasm nashr qilindi", publishedBody: "katalogga qo'shildi.", rejected: "Rasm qabul qilinmadi", rejectedBody: "5 MB gacha bo'lgan 6 tagacha JPG, PNG yoki WebP rasm ishlating.", signIn: "Kirish talab qilinadi", signInBody: "Administrator akkauntiga kiring.", imagesRequired: "Rasm qo'shing", imagesRequiredBody: "Kamida bitta rasm yuklash kerak.", dimensions: "Barcha o'lchamlar musbat bo'lishi kerak.",
  };
  const categoriesQuery = useCategories();
  const createProductMutation = useCreateProduct();
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const previews = useMemo(
    () =>
      files.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [files],
  );

  useEffect(
    () => () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    },
    [previews],
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues,
  });

  useEffect(() => {
    const firstCategory = categoriesQuery.data?.[0];
    if (firstCategory) setValue("category_id", firstCategory.id);
  }, [categoriesQuery.data, setValue]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 6,
    maxSize: 5 * 1024 * 1024,
    onDrop: (acceptedFiles) => setFiles((current) => [...current, ...acceptedFiles].slice(0, 6)),
    onDropRejected: () => {
      toast({ title: text.rejected, description: text.rejectedBody, variant: "destructive" });
    },
  });

  async function onSubmit(values: ProductFormValues) {
    if (!user) {
      toast({ title: text.signIn, description: text.signInBody, variant: "destructive" });
      return;
    }

    if (files.length === 0) {
      toast({ title: text.imagesRequired, description: text.imagesRequiredBody, variant: "destructive" });
      return;
    }

    let imageUrls: string[] = [];
    try {
      setUploadProgress(18);
      imageUrls = await uploadProductImages(files);
      setUploadProgress(72);
      await createProductMutation.mutateAsync({
        ...values,
        seller_id: user.id,
        images: imageUrls,
        is_published: true,
      });
      setUploadProgress(100);
      toast({ title: text.published, description: `${values.title} ${text.publishedBody}` });
      reset(defaultValues);
      setFiles([]);
      window.setTimeout(() => setUploadProgress(0), 800);
    } catch (error) {
      if (imageUrls.length > 0) await deleteUploadedProductImages(imageUrls).catch(() => undefined);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
      setUploadProgress(0);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-[1fr_24rem]">
      <div className="grid gap-6">
        <Card>
          <CardContent className="grid gap-5 p-5">
            <div className="grid gap-2">
              <Label htmlFor="title">{text.title}</Label>
              <Input id="title" {...register("title")} />
              {errors.title ? <p className="text-sm text-destructive">{errors.title.message}</p> : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">{text.description}</Label>
              <Textarea id="description" {...register("description")} />
              {errors.description ? <p className="text-sm text-destructive">{errors.description.message}</p> : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="price">{text.price}</Label>
                <Input id="price" type="number" min="0" step="1" {...register("price", { valueAsNumber: true })} />
                {errors.price ? <p className="text-sm text-destructive">{errors.price.message}</p> : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stock">{text.stock}</Label>
                <Input id="stock" type="number" min="0" step="1" {...register("stock_count", { valueAsNumber: true })} />
                {errors.stock_count ? <p className="text-sm text-destructive">{errors.stock_count.message}</p> : null}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="category">{text.category}</Label>
                <select
                  id="category"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  {...register("category_id")}
                >
                  {categoriesQuery.data?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {getCategoryName(category.slug, category.name, locale)}
                    </option>
                  ))}
                </select>
                {errors.category_id ? <p className="text-sm text-destructive">{errors.category_id.message}</p> : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="style">{text.style}</Label>
                <select
                  id="style"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  {...register("style")}
                >
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
                <Label htmlFor="material">{text.material}</Label>
                <Input id="material" {...register("material")} />
                {errors.material ? <p className="text-sm text-destructive">{errors.material.message}</p> : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="color">{text.color}</Label>
                <Input id="color" {...register("color")} />
                {errors.color ? <p className="text-sm text-destructive">{errors.color.message}</p> : null}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="grid gap-2">
                <Label htmlFor="width">{text.width}</Label>
                <Input id="width" type="number" {...register("dimensions.width", { valueAsNumber: true })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="height">{text.height}</Label>
                <Input id="height" type="number" {...register("dimensions.height", { valueAsNumber: true })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="depth">{text.depth}</Label>
                <Input id="depth" type="number" {...register("dimensions.depth", { valueAsNumber: true })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit">{text.unit}</Label>
                <select
                  id="unit"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  {...register("dimensions.unit")}
                >
                  <option value="cm">cm</option>
                  <option value="inch">inch</option>
                </select>
              </div>
            </div>
            {errors.dimensions ? <p className="text-sm text-destructive">{text.dimensions}</p> : null}
          </CardContent>
        </Card>
      </div>

      <aside className="grid gap-5 self-start">
        <Card>
          <CardContent className="grid gap-4 p-5">
            <div
              {...getRootProps()}
              className={cn(
                "grid min-h-52 cursor-pointer place-items-center rounded-lg border border-dashed border-border bg-background p-6 text-center transition-colors",
                isDragActive && "border-primary bg-primary/10",
              )}
            >
              <input {...getInputProps()} aria-label="Upload product images" />
              <div>
                <UploadCloud className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
                <p className="mt-3 font-medium">{text.upload}</p>
                <p className="mt-1 text-sm text-muted-foreground">{text.uploadBody}</p>
              </div>
            </div>
            {previews.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {previews.map((preview) => (
                  <div key={preview.url} className="relative aspect-square overflow-hidden rounded-md border border-border">
                    <img src={preview.url} alt={preview.file.name} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFiles((current) => current.filter((file) => file !== preview.file))}
                      className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-foreground"
                      aria-label={`Remove ${preview.file.name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-md bg-secondary p-3 text-sm text-muted-foreground">
                <ImagePlus className="h-4 w-4" aria-hidden="true" />
                {text.preview}
              </div>
            )}
            {uploadProgress > 0 ? (
              <div className="h-2 overflow-hidden rounded-full bg-secondary" aria-label="Upload progress">
                <div className="h-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            ) : null}
            <Button type="submit" disabled={isSubmitting || createProductMutation.isPending}>
              {isSubmitting || createProductMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {text.publish}
            </Button>
          </CardContent>
        </Card>
      </aside>
    </form>
  );
}
