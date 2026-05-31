import { ProductUploadForm } from "@/components/seller/ProductUploadForm";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useLocale } from "@/contexts/LocaleContext";

export function AddProductPage() {
  const { locale } = useLocale();
  return (
    <PageWrapper className="container py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">BIGART Admin</p>
        <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">{locale === "ru" ? "Добавить картину" : "Rasm qo'shish"}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          {locale === "ru" ? "Загрузите изображения, укажите размеры и опубликуйте картину в каталоге." : "Rasmlarni yuklang, o'lchamlarni kiriting va asarni katalogda nashr qiling."}
        </p>
      </div>
      <ProductUploadForm />
    </PageWrapper>
  );
}
