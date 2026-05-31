import { useState } from "react";
import { ArrowLeft, Clipboard, PackageCheck, Printer, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useLocale } from "@/contexts/LocaleContext";
import { useAdminOrder, useDeleteOrder, useUpdateOrderStatus } from "@/hooks/useAdmin";
import { getSupabaseErrorMessage } from "@/lib/supabase";
import { formatDate, formatPrice } from "@/lib/utils";
import type { Order, OrderItem, OrderStatus } from "@/types/order";

const statuses: OrderStatus[] = ["new", "pending_confirmation", "confirmed", "processing", "packaging", "shipped", "delivered", "cancelled"];

const copy = {
  ru: { eyebrow: "Заказы", title: "Детали заказа", back: "Вернуться к заказам", notFound: "Заказ не найден", notFoundBody: "Проверьте ссылку или вернитесь к списку заказов.", error: "Не удалось загрузить заказ", customer: "Клиент", delivery: "Доставка", items: "Картины в заказе", history: "История заказа", code: "Код заказа", status: "Статус", created: "Создан", name: "Имя и фамилия", phone: "Телефон", email: "Email", address: "Адрес доставки", payment: "Способ оплаты", paymentValue: "По согласованию", total: "Общая сумма", sku: "Артикул", quantity: "Кол-во", unitPrice: "Цена за единицу", print: "Распечатать заказ", delete: "Удалить заказ", deleted: "Заказ удалён", updated: "Статус заказа обновлён", changeStatus: "Изменить статус", note: "Заметка администратора", sms: "SMS для клиента", copySms: "Скопировать SMS", copied: "SMS скопировано", noItems: "В заказе нет картин", noEmail: "Не указан", new: "Новый", pending_confirmation: "Ожидает подтверждения", confirmed: "Подтверждён", processing: "В обработке", packaging: "Упаковывается", shipped: "Передан в доставку", delivered: "Доставлен", cancelled: "Отменён" },
  uz: { eyebrow: "Buyurtmalar", title: "Buyurtma tafsilotlari", back: "Buyurtmalarga qaytish", notFound: "Buyurtma topilmadi", notFoundBody: "Havolani tekshiring yoki buyurtmalar ro'yxatiga qayting.", error: "Buyurtmani yuklab bo'lmadi", customer: "Mijoz", delivery: "Yetkazib berish", items: "Buyurtmadagi rasmlar", history: "Buyurtma tarixi", code: "Buyurtma kodi", status: "Holat", created: "Yaratilgan", name: "Ism va familiya", phone: "Telefon", email: "Email", address: "Yetkazib berish manzili", payment: "To'lov usuli", paymentValue: "Kelishilgan holda", total: "Umumiy summa", sku: "Artikul", quantity: "Soni", unitPrice: "Bir dona narxi", print: "Buyurtmani chop etish", delete: "Buyurtmani o'chirish", deleted: "Buyurtma o'chirildi", updated: "Buyurtma holati yangilandi", changeStatus: "Holatni o'zgartirish", note: "Administrator izohi", sms: "Mijoz uchun SMS", copySms: "SMSni nusxalash", copied: "SMS nusxalandi", noItems: "Buyurtmada rasmlar yo'q", noEmail: "Ko'rsatilmagan", new: "Yangi", pending_confirmation: "Tasdiqlash kutilmoqda", confirmed: "Tasdiqlangan", processing: "Tayyorlanmoqda", packaging: "Qadoqlanmoqda", shipped: "Yetkazib berishga topshirilgan", delivered: "Yetkazilgan", cancelled: "Bekor qilingan" },
} as const;

function Info({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-semibold uppercase text-muted-foreground">{label}</dt><dd className="mt-1 text-sm font-medium">{value}</dd></div>;
}

function getSku(item: OrderItem) {
  return `BA-${(item.product_id ?? item.id).slice(0, 8).toUpperCase()}`;
}

function getSms(order: Order, origin: string, locale: "ru" | "uz") {
  const url = `${origin}/order/track/${order.tracking_token}`;
  const ru: Partial<Record<OrderStatus, string>> = {
    confirmed: `Ваш заказ ${order.order_code} подтверждён. Отслеживание: ${url}`,
    processing: `Ваш заказ ${order.order_code} принят в обработку. Статус: ${url}`,
    packaging: `Ваш заказ ${order.order_code} упаковывается. Статус: ${url}`,
    shipped: `Ваш заказ ${order.order_code} передан в доставку. Отслеживание: ${url}`,
    delivered: `Ваш заказ ${order.order_code} доставлен. Спасибо за покупку!`,
  };
  const uz: Partial<Record<OrderStatus, string>> = {
    confirmed: `${order.order_code} buyurtmangiz tasdiqlandi. Kuzatuv: ${url}`,
    processing: `${order.order_code} buyurtmangiz tayyorlanmoqda. Holat: ${url}`,
    packaging: `${order.order_code} buyurtmangiz qadoqlanmoqda. Holat: ${url}`,
    shipped: `${order.order_code} buyurtmangiz yetkazib berishga topshirildi. Kuzatuv: ${url}`,
    delivered: `${order.order_code} buyurtmangiz yetkazildi. Xaridingiz uchun rahmat!`,
  };
  return (locale === "ru" ? ru : uz)[order.status] ?? `${order.order_code}: ${url}`;
}

export function OrderDetailPage() {
  const { id } = useParams();
  const { locale } = useLocale();
  const text = copy[locale];
  const navigate = useNavigate();
  const orderQuery = useAdminOrder(id);
  const updateStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteOrder();
  const order = orderQuery.data;
  const [nextStatus, setNextStatus] = useState<OrderStatus | null>(null);
  const [adminNote, setAdminNote] = useState<string | null>(null);

  if (orderQuery.isLoading) return <PageWrapper className="container grid gap-4 py-10"><Skeleton className="h-20 w-full" /><Skeleton className="h-80 w-full" /></PageWrapper>;
  if (orderQuery.isError) return <Message title={text.error} body={getSupabaseErrorMessage(orderQuery.error)} back={text.back} />;
  if (!order) return <Message title={text.notFound} body={text.notFoundBody} back={text.back} />;

  const selectedStatus = nextStatus ?? order.status;
  const address = [order.shipping_address.address, order.shipping_address.city].filter(Boolean).join(", ");
  const sms = getSms(order, window.location.origin, locale);

  async function handleStatusChange() {
    if (!order) return;
    try {
      await updateStatus.mutateAsync({ orderId: order.id, status: selectedStatus, adminNote: adminNote ?? order.admin_note });
      toast({ title: text.updated, description: order.order_code });
      setNextStatus(null);
    } catch (error) {
      toast({ title: text.error, description: getSupabaseErrorMessage(error), variant: "destructive" });
    }
  }

  async function handleDelete() {
    if (!order) return;
    try {
      await deleteOrder.mutateAsync(order.id);
      toast({ title: text.deleted, description: order.order_code });
      navigate("/admin");
    } catch (error) {
      toast({ title: text.error, description: getSupabaseErrorMessage(error), variant: "destructive" });
    }
  }

  async function copySms() {
    await navigator.clipboard.writeText(sms);
    toast({ title: text.copied });
  }

  return (
    <PageWrapper className="container py-8 sm:py-10">
      <Button variant="ghost" asChild className="mb-5"><Link to="/admin"><ArrowLeft className="h-4 w-4" />{text.back}</Link></Button>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div><p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">{text.eyebrow}</p><h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">{text.title} <span className="text-primary">{order.order_code}</span></h1></div>
        <div className="flex flex-wrap gap-2 print:hidden"><Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" />{text.print}</Button><Button variant="destructive" onClick={() => void handleDelete()} disabled={deleteOrder.isPending}><Trash2 className="h-4 w-4" />{text.delete}</Button></div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="grid gap-6">
          <Card><CardContent className="grid gap-6 p-5 sm:grid-cols-2 lg:grid-cols-3"><Info label={text.code} value={order.order_code} /><Info label={text.status} value={text[order.status]} /><Info label={text.created} value={formatDate(order.created_at)} /><Info label={text.name} value={order.shipping_address.fullName} /><Info label={text.phone} value={order.shipping_address.phone} /><Info label={text.email} value={order.shipping_address.email || text.noEmail} /></CardContent></Card>
          <Card><CardContent className="p-0"><div className="border-b border-border p-5"><h2 className="text-xl font-semibold">{text.items}</h2></div>{order.order_items?.map((item) => <div key={item.id} className="grid gap-4 border-b border-border p-4 last:border-b-0 sm:grid-cols-[4.5rem_1fr_auto] sm:items-center">{item.product?.images[0] ? <img src={item.product.images[0]} alt={item.product_title ?? ""} className="h-16 w-16 rounded-md object-cover" /> : <div className="grid h-16 w-16 place-items-center rounded-md bg-secondary"><PackageCheck className="h-5 w-5 text-primary" /></div>}<div><p className="font-semibold">{item.product_title ?? item.product?.title}</p><p className="mt-1 text-xs text-muted-foreground">{text.sku}: {getSku(item)}</p><p className="mt-2 text-sm text-muted-foreground">{text.quantity}: {item.quantity} · {text.unitPrice}: {formatPrice(item.price_at_purchase)}</p></div><p className="font-semibold text-primary">{formatPrice(item.price_at_purchase * item.quantity)}</p></div>)}{!order.order_items?.length ? <p className="p-5 text-sm text-muted-foreground">{text.noItems}</p> : null}</CardContent></Card>
        </div>

        <aside className="grid content-start gap-6">
          <Card><CardContent className="grid gap-4 p-5"><h2 className="text-lg font-semibold">{text.delivery}</h2><Info label={text.address} value={address} /><Info label={text.payment} value={text.paymentValue} /><Separator /><div className="flex justify-between gap-3 font-semibold"><span>{text.total}</span><span className="text-primary">{formatPrice(order.total_price)}</span></div></CardContent></Card>
          <Card className="print:hidden"><CardContent className="grid gap-3 p-5"><h2 className="text-lg font-semibold">{text.status}</h2><select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={selectedStatus} onChange={(event) => setNextStatus(event.target.value as OrderStatus)}>{statuses.map((status) => <option key={status} value={status}>{text[status]}</option>)}</select><Label htmlFor="admin-note">{text.note}</Label><Textarea id="admin-note" value={adminNote ?? order.admin_note ?? ""} onChange={(event) => setAdminNote(event.target.value)} /><Button onClick={() => void handleStatusChange()} disabled={updateStatus.isPending}>{text.changeStatus}</Button></CardContent></Card>
          <Card className="print:hidden"><CardContent className="grid gap-3 p-5"><h2 className="text-lg font-semibold">{text.sms}</h2><p className="break-words text-sm text-muted-foreground">{sms}</p><Button variant="outline" onClick={() => void copySms()}><Clipboard className="h-4 w-4" />{text.copySms}</Button></CardContent></Card>
          <Card><CardContent className="p-5"><h2 className="text-lg font-semibold">{text.history}</h2><div className="mt-4 grid gap-3">{order.status_history?.map((entry) => <div key={entry.id} className="border-l border-primary pl-3"><p className="text-sm font-medium">{text[entry.new_status]}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(entry.created_at)}</p></div>)}</div></CardContent></Card>
        </aside>
      </div>
    </PageWrapper>
  );
}

function Message({ title, body, back }: { title: string; body: string; back: string }) {
  return <PageWrapper className="container grid min-h-[70vh] place-items-center py-10 text-center"><div><h1 className="text-3xl font-semibold">{title}</h1><p className="mt-2 text-muted-foreground">{body}</p><Button className="mt-5" asChild><Link to="/admin"><ArrowLeft className="h-4 w-4" />{back}</Link></Button></div></PageWrapper>;
}
