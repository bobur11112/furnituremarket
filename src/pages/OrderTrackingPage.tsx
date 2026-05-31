import { Check, Circle, PackageSearch } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useLocale } from "@/contexts/LocaleContext";
import { usePublicOrderTracking } from "@/hooks/useOrders";
import { getSupabaseErrorMessage } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import type { OrderStatus } from "@/types/order";

const statusOrder: OrderStatus[] = ["pending_confirmation", "confirmed", "processing", "packaging", "shipped", "delivered"];

const copy = {
  ru: {
    eyebrow: "Отслеживание заказа", title: "Ваш заказ", body: "Здесь можно проверить актуальный статус заказа BIGART.", notFound: "Заказ не найден", notFoundBody: "Проверьте ссылку. Возможно, она была скопирована не полностью.", error: "Не удалось загрузить заказ", home: "Вернуться на главную", customer: "Клиент", phone: "Телефон", city: "Город", created: "Создан", items: "Картины в заказе", quantity: "Количество", history: "История заказа", new: "Новый", pending_confirmation: "Ожидает подтверждения", confirmed: "Подтверждён", processing: "В обработке", packaging: "Упаковывается", shipped: "Передан в доставку", delivered: "Доставлен", cancelled: "Отменён",
  },
  uz: {
    eyebrow: "Buyurtmani kuzatish", title: "Buyurtmangiz", body: "Bu yerda BIGART buyurtmasining joriy holatini tekshirishingiz mumkin.", notFound: "Buyurtma topilmadi", notFoundBody: "Havolani tekshiring. U to'liq ko'chirilmagan bo'lishi mumkin.", error: "Buyurtmani yuklab bo'lmadi", home: "Bosh sahifaga qaytish", customer: "Mijoz", phone: "Telefon", city: "Shahar", created: "Yaratilgan", items: "Buyurtmadagi rasmlar", quantity: "Soni", history: "Buyurtma tarixi", new: "Yangi", pending_confirmation: "Tasdiqlash kutilmoqda", confirmed: "Tasdiqlangan", processing: "Tayyorlanmoqda", packaging: "Qadoqlanmoqda", shipped: "Yetkazib berishga topshirilgan", delivered: "Yetkazilgan", cancelled: "Bekor qilingan",
  },
} as const;

export function OrderTrackingPage() {
  const { trackingToken } = useParams();
  const { locale } = useLocale();
  const text = copy[locale];
  const orderQuery = usePublicOrderTracking(trackingToken);
  const order = orderQuery.data;

  if (orderQuery.isLoading) return <PageWrapper className="container grid gap-4 py-10"><Skeleton className="h-24 w-full" /><Skeleton className="h-80 w-full" /></PageWrapper>;
  if (orderQuery.isError) return <TrackingMessage title={text.error} body={getSupabaseErrorMessage(orderQuery.error)} action={text.home} />;
  if (!order) return <TrackingMessage title={text.notFound} body={text.notFoundBody} action={text.home} />;

  const activeIndex = statusOrder.indexOf(order.status);

  return (
    <PageWrapper className="container max-w-5xl py-8 sm:py-12">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">{text.eyebrow}</p>
      <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">{text.title} <span className="text-primary">{order.orderCode}</span></h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">{text.body}</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="grid gap-6">
          <Card><CardContent className="grid gap-5 p-5 sm:grid-cols-2">
            <Info label={text.customer} value={order.customerName} /><Info label={text.phone} value={order.maskedPhone} /><Info label={text.city} value={order.city} /><Info label={text.created} value={formatDate(order.createdAt)} />
          </CardContent></Card>
          <Card><CardContent className="p-5"><h2 className="text-xl font-semibold">{text.items}</h2><div className="mt-4 grid gap-3">{order.items.map((item, index) => <div key={`${item.title}-${index}`} className="flex items-center gap-3 border-t border-border pt-3"><PackageSearch className="h-5 w-5 text-primary" /><span className="flex-1 font-medium">{item.title}</span><span className="text-sm text-muted-foreground">{text.quantity}: {item.quantity}</span></div>)}</div></CardContent></Card>
        </div>
        <Card><CardContent className="p-5"><h2 className="text-lg font-semibold">{text.history}</h2><div className="mt-5 grid">{statusOrder.map((status, index) => {
          const completed = order.status !== "cancelled" && index <= activeIndex;
          const history = order.history.find((item) => item.status === status);
          return <div key={status} className="relative flex min-h-14 gap-3"><div className="relative flex w-5 justify-center">{completed ? <Check className="z-10 h-5 w-5 rounded-full bg-primary p-1 text-primary-foreground" /> : <Circle className="z-10 h-5 w-5 bg-card text-muted-foreground" />}{index < statusOrder.length - 1 ? <span className="absolute top-5 h-full w-px bg-border" /> : null}</div><div><p className={completed ? "text-sm font-medium" : "text-sm text-muted-foreground"}>{text[status]}</p>{history ? <p className="mt-1 text-xs text-muted-foreground">{formatDate(history.createdAt)}</p> : null}</div></div>;
        })}{order.status === "cancelled" ? <p className="mt-2 text-sm font-medium text-destructive">{text.cancelled}</p> : null}</div></CardContent></Card>
      </div>
    </PageWrapper>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p><p className="mt-1 font-medium">{value}</p></div>;
}

function TrackingMessage({ title, body, action }: { title: string; body: string; action: string }) {
  return <PageWrapper className="container grid min-h-[70vh] place-items-center py-10 text-center"><div><h1 className="text-3xl font-semibold">{title}</h1><p className="mt-2 text-muted-foreground">{body}</p><Button className="mt-5" asChild><Link to="/">{action}</Link></Button></div></PageWrapper>;
}
