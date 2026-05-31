import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Circle, PackageCheck, Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useLocale } from "@/contexts/LocaleContext";
import { useAdminOrder, useDeleteOrder, useUpdateOrderStatus } from "@/hooks/useAdmin";
import { getSupabaseErrorMessage } from "@/lib/supabase";
import { formatDate, formatPrice } from "@/lib/utils";
import type { OrderItem, OrderStatus } from "@/types/order";

const statuses: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
const progressStatuses: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered"];

const content = {
  ru: {
    eyebrow: "Заказы", title: "Детали заказа", back: "Вернуться к заказам", notFound: "Заказ не найден", notFoundBody: "Проверьте ссылку или вернитесь к списку заказов.", overview: "Информация о заказе", customer: "Клиент", delivery: "Доставка", items: "Картины в заказе", history: "История заказа", orderId: "ID заказа", status: "Статус", created: "Создан", name: "Имя и фамилия", phone: "Телефон", email: "Email", address: "Адрес доставки", payment: "Способ оплаты", paymentValue: "По согласованию", total: "Общая сумма", sku: "Артикул", quantity: "Кол-во", unitPrice: "Цена за единицу", itemTotal: "Итого", changeStatus: "Изменить статус", print: "Распечатать заказ", delete: "Удалить заказ", deleted: "Заказ удалён", updated: "Статус заказа обновлён", pending: "Создан", confirmed: "Подтверждён", shipped: "Передан в доставку", delivered: "Доставлен", cancelled: "Отменён", error: "Не удалось загрузить заказ", noItems: "В заказе нет картин", noEmail: "Не указан",
  },
  uz: {
    eyebrow: "Buyurtmalar", title: "Buyurtma tafsilotlari", back: "Buyurtmalarga qaytish", notFound: "Buyurtma topilmadi", notFoundBody: "Havolani tekshiring yoki buyurtmalar ro'yxatiga qayting.", overview: "Buyurtma ma'lumotlari", customer: "Mijoz", delivery: "Yetkazib berish", items: "Buyurtmadagi rasmlar", history: "Buyurtma tarixi", orderId: "Buyurtma ID", status: "Holat", created: "Yaratilgan", name: "Ism va familiya", phone: "Telefon", email: "Email", address: "Yetkazib berish manzili", payment: "To'lov usuli", paymentValue: "Kelishilgan holda", total: "Umumiy summa", sku: "Artikul", quantity: "Soni", unitPrice: "Bir dona narxi", itemTotal: "Jami", changeStatus: "Holatni o'zgartirish", print: "Buyurtmani chop etish", delete: "Buyurtmani o'chirish", deleted: "Buyurtma o'chirildi", updated: "Buyurtma holati yangilandi", pending: "Yaratilgan", confirmed: "Tasdiqlangan", shipped: "Yetkazib berishga topshirilgan", delivered: "Yetkazilgan", cancelled: "Bekor qilingan", error: "Buyurtmani yuklab bo'lmadi", noItems: "Buyurtmada rasmlar yo'q", noEmail: "Ko'rsatilmagan",
  },
} as const;

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-semibold uppercase text-muted-foreground">{label}</dt><dd className="mt-1 text-sm font-medium text-foreground">{value}</dd></div>;
}

function getSku(item: OrderItem) {
  return `BA-${(item.product_id ?? item.id).slice(0, 8).toUpperCase()}`;
}

export function OrderDetailPage() {
  const { id } = useParams();
  const { locale } = useLocale();
  const text = content[locale];
  const navigate = useNavigate();
  const orderQuery = useAdminOrder(id);
  const updateStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteOrder();
  const order = orderQuery.data;
  const [nextStatus, setNextStatus] = useState<OrderStatus | null>(null);

  if (orderQuery.isLoading) return <PageWrapper className="container grid gap-4 py-10"><Skeleton className="h-20 w-full" /><Skeleton className="h-80 w-full" /></PageWrapper>;

  if (orderQuery.isError) return <Message title={text.error} body={getSupabaseErrorMessage(orderQuery.error)} back={text.back} />;
  if (!order) return <Message title={text.notFound} body={text.notFoundBody} back={text.back} />;

  const selectedStatus = nextStatus ?? order.status;
  const shortId = order.id.slice(0, 8);
  const address = [order.shipping_address.address, order.shipping_address.city].filter(Boolean).join(", ");

  async function handleStatusChange() {
    if (!order || selectedStatus === order.status) return;
    try {
      await updateStatus.mutateAsync({ orderId: order.id, status: selectedStatus });
      toast({ title: text.updated, description: `#${shortId}` });
      setNextStatus(null);
    } catch (error) {
      toast({ title: text.error, description: getSupabaseErrorMessage(error), variant: "destructive" });
    }
  }

  async function handleDelete() {
    if (!order) return;
    try {
      await deleteOrder.mutateAsync(order.id);
      toast({ title: text.deleted, description: `#${shortId}` });
      navigate("/admin");
    } catch (error) {
      toast({ title: text.error, description: getSupabaseErrorMessage(error), variant: "destructive" });
    }
  }

  return (
    <PageWrapper className="container py-8 sm:py-10">
      <Button variant="ghost" asChild className="mb-5"><Link to="/admin"><ArrowLeft className="h-4 w-4" />{text.back}</Link></Button>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div><p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">{text.eyebrow}</p><h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">{text.title} <span className="text-primary">#{shortId}</span></h1></div>
        <div className="flex flex-wrap gap-2 print:hidden"><Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" />{text.print}</Button><Button variant="destructive" onClick={() => void handleDelete()} disabled={deleteOrder.isPending}><Trash2 className="h-4 w-4" />{text.delete}</Button></div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_19rem]">
        <div className="grid gap-6">
          <Card><CardContent className="grid gap-6 p-5 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label={text.orderId} value={order.id} /><Detail label={text.status} value={text[order.status]} /><Detail label={text.created} value={formatDate(order.created_at)} /><Detail label={text.name} value={order.shipping_address.fullName} /><Detail label={text.phone} value={order.shipping_address.phone} /><Detail label={text.email} value={order.shipping_address.email || text.noEmail} />
          </CardContent></Card>

          <Card><CardContent className="p-0"><div className="border-b border-border p-5"><h2 className="text-xl font-semibold">{text.items}</h2></div><div className="grid gap-0">
            {order.order_items?.map((item) => <div key={item.id} className="grid gap-4 border-b border-border p-4 last:border-b-0 sm:grid-cols-[4.5rem_1fr_auto] sm:items-center">
              {item.product?.images[0] ? <img src={item.product.images[0]} alt={item.product_title ?? ""} className="h-20 w-20 rounded-md object-cover sm:h-16 sm:w-16" /> : <div className="grid h-16 w-16 place-items-center rounded-md bg-secondary"><PackageCheck className="h-5 w-5 text-primary" /></div>}
              <div><p className="font-semibold">{item.product_title ?? item.product?.title}</p><p className="mt-1 text-xs text-muted-foreground">{text.sku}: {getSku(item)}</p><p className="mt-2 text-sm text-muted-foreground">{text.quantity}: {item.quantity} · {text.unitPrice}: {formatPrice(item.price_at_purchase)}</p></div>
              <p className="font-semibold text-primary">{formatPrice(item.price_at_purchase * item.quantity)}</p>
            </div>)}
            {!order.order_items?.length ? <p className="p-5 text-sm text-muted-foreground">{text.noItems}</p> : null}
          </div></CardContent></Card>
        </div>

        <aside className="grid content-start gap-6">
          <Card><CardContent className="grid gap-4 p-5"><h2 className="text-lg font-semibold">{text.delivery}</h2><Detail label={text.address} value={address} /><Detail label={text.payment} value={text.paymentValue} /><Separator /><div className="flex justify-between gap-3 font-semibold"><span>{text.total}</span><span className="text-primary">{formatPrice(order.total_price)}</span></div></CardContent></Card>
          <Card className="print:hidden"><CardContent className="grid gap-3 p-5"><h2 className="text-lg font-semibold">{text.status}</h2><select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={selectedStatus} onChange={(event) => setNextStatus(event.target.value as OrderStatus)}>{statuses.map((status) => <option key={status} value={status}>{text[status]}</option>)}</select><Button onClick={() => void handleStatusChange()} disabled={selectedStatus === order.status || updateStatus.isPending}>{text.changeStatus}</Button></CardContent></Card>
          <Card><CardContent className="p-5"><h2 className="text-lg font-semibold">{text.history}</h2><div className="mt-5 grid gap-0">{progressStatuses.map((status, index) => {
            const currentIndex = progressStatuses.indexOf(order.status);
            const completed = order.status !== "cancelled" && index <= currentIndex;
            return <div key={status} className="relative flex min-h-14 gap-3"><div className="relative flex w-5 justify-center">{completed ? <Check className="z-10 h-5 w-5 rounded-full bg-primary p-1 text-primary-foreground" /> : <Circle className="z-10 h-5 w-5 bg-card text-muted-foreground" />}{index < progressStatuses.length - 1 ? <span className="absolute top-5 h-full w-px bg-border" /> : null}</div><div><p className={completed ? "text-sm font-medium" : "text-sm text-muted-foreground"}>{text[status]}</p>{status === "pending" ? <p className="mt-1 text-xs text-muted-foreground">{formatDate(order.created_at)}</p> : null}</div></div>;
          })}{order.status === "cancelled" ? <div className="mt-2 flex gap-3 text-destructive"><Circle className="h-5 w-5" /><p className="text-sm font-medium">{text.cancelled}</p></div> : null}</div></CardContent></Card>
        </aside>
      </div>
    </PageWrapper>
  );
}

function Message({ title, body, back }: { title: string; body: string; back: string }) {
  return <PageWrapper className="container grid min-h-[70vh] place-items-center py-10 text-center"><div><h1 className="text-3xl font-semibold">{title}</h1><p className="mt-2 text-muted-foreground">{body}</p><Button className="mt-5" asChild><Link to="/admin"><ArrowLeft className="h-4 w-4" />{back}</Link></Button></div></PageWrapper>;
}
