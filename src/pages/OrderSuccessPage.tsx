import { CheckCircle2, Clipboard, ExternalLink } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useLocale } from "@/contexts/LocaleContext";
import { usePublicOrderTracking } from "@/hooks/useOrders";

const copy = {
  ru: { title: "Заказ принят", body: "Мы позвоним вам для подтверждения деталей. Сохраните код заказа и ссылку отслеживания.", code: "Код заказа", link: "Ссылка для отслеживания", copy: "Скопировать ссылку", copied: "Ссылка скопирована", track: "Открыть отслеживание", catalog: "Вернуться в каталог", error: "Не удалось загрузить данные заказа" },
  uz: { title: "Buyurtma qabul qilindi", body: "Tafsilotlarni tasdiqlash uchun sizga qo'ng'iroq qilamiz. Buyurtma kodi va kuzatuv havolasini saqlang.", code: "Buyurtma kodi", link: "Kuzatuv havolasi", copy: "Havolani nusxalash", copied: "Havola nusxalandi", track: "Kuzatuvni ochish", catalog: "Katalogga qaytish", error: "Buyurtma ma'lumotlarini yuklab bo'lmadi" },
} as const;

export function OrderSuccessPage() {
  const { trackingToken } = useParams();
  const { locale } = useLocale();
  const text = copy[locale];
  const orderQuery = usePublicOrderTracking(trackingToken);
  const trackingPath = `/order/track/${trackingToken ?? ""}`;
  const trackingUrl = `${window.location.origin}${trackingPath}`;

  async function copyLink() {
    await navigator.clipboard.writeText(trackingUrl);
    toast({ title: text.copied });
  }

  if (orderQuery.isLoading) return <PageWrapper className="container max-w-2xl py-12"><Skeleton className="h-80 w-full" /></PageWrapper>;
  if (!orderQuery.data) return <PageWrapper className="container grid min-h-[70vh] place-items-center py-10 text-center"><div><h1 className="text-3xl font-semibold">{text.error}</h1><Button className="mt-5" asChild><Link to="/catalog">{text.catalog}</Link></Button></div></PageWrapper>;

  return (
    <PageWrapper className="container grid min-h-[75vh] max-w-2xl place-items-center py-10">
      <Card className="w-full"><CardContent className="p-6 sm:p-8">
        <CheckCircle2 className="h-12 w-12 text-primary" />
        <h1 className="mt-5 font-display text-4xl font-bold">{text.title}</h1>
        <p className="mt-3 text-muted-foreground">{text.body}</p>
        <div className="mt-7 grid gap-4 rounded-md border border-border bg-secondary/30 p-4">
          <div><p className="text-xs font-semibold uppercase text-muted-foreground">{text.code}</p><p className="mt-1 text-2xl font-bold text-primary">{orderQuery.data.orderCode}</p></div>
          <div><p className="text-xs font-semibold uppercase text-muted-foreground">{text.link}</p><p className="mt-1 break-all text-sm">{trackingUrl}</p></div>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => void copyLink()}><Clipboard className="h-4 w-4" />{text.copy}</Button>
          <Button variant="outline" asChild><Link to={trackingPath}><ExternalLink className="h-4 w-4" />{text.track}</Link></Button>
          <Button variant="ghost" asChild><Link to="/catalog">{text.catalog}</Link></Button>
        </div>
      </CardContent></Card>
    </PageWrapper>
  );
}
