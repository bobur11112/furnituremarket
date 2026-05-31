import { ProductUploadForm } from "@/components/seller/ProductUploadForm";
import { PageWrapper } from "@/components/layout/PageWrapper";

export function AddProductPage() {
  return (
    <PageWrapper className="container py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">BIGART Admin</p>
        <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">Добавить картину</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Upload editorial imagery, precise dimensions, and publish directly to the marketplace.
        </p>
      </div>
      <ProductUploadForm />
    </PageWrapper>
  );
}
