import { Link } from "react-router-dom";
import { BarChart3, DollarSign, Package, Plus, ShieldCheck, Trash2, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useAdminDashboard, useDeleteOrder, useUpdateOrderStatus } from "@/hooks/useAdmin";
import { getSupabaseErrorMessage } from "@/lib/supabase";
import { formatDate, formatPrice } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types/order";
import { useLocale, type Locale } from "@/contexts/LocaleContext";

const orderStatuses: OrderStatus[] = ["new", "pending_confirmation", "confirmed", "processing", "packaging", "shipped", "delivered", "cancelled"];

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

const adminText = {
  ru: { updated: "Заказ обновлён", updateFailed: "Не удалось обновить заказ", deleted: "Заказ удалён", deleteFailed: "Не удалось удалить заказ", title: "Управление магазином", manage: "Управлять картинами", add: "Добавить картину", connection: "Ошибка подключения Supabase", products: "Картины", orders: "Заказы", users: "Пользователи", revenue: "Выручка", order: "Заказ", customer: "Клиент", total: "Сумма", status: "Статус", date: "Дата", actions: "Действия", emptyOrders: "Заказов пока нет.", guest: "Гость", price: "Цена", published: "Опубликовано", draft: "Черновик", name: "Имя", role: "Роль", joined: "Добавлен", new: "Новый", pending_confirmation: "Ожидает подтверждения", confirmed: "Подтверждён", processing: "В обработке", packaging: "Упаковывается", shipped: "Отправлен", delivered: "Доставлен", cancelled: "Отменён" },
  uz: { updated: "Buyurtma yangilandi", updateFailed: "Buyurtmani yangilab bo'lmadi", deleted: "Buyurtma o'chirildi", deleteFailed: "Buyurtmani o'chirib bo'lmadi", title: "Do'kon boshqaruvi", manage: "Rasmlarni boshqarish", add: "Rasm qo'shish", connection: "Supabase ulanish xatosi", products: "Rasmlar", orders: "Buyurtmalar", users: "Foydalanuvchilar", revenue: "Tushum", order: "Buyurtma", customer: "Mijoz", total: "Jami", status: "Holat", date: "Sana", actions: "Amallar", emptyOrders: "Hozircha buyurtmalar yo'q.", guest: "Mehmon", price: "Narx", published: "Nashr qilingan", draft: "Qoralama", name: "Ism", role: "Rol", joined: "Qo'shilgan", new: "Yangi", pending_confirmation: "Tasdiqlash kutilmoqda", confirmed: "Tasdiqlangan", processing: "Tayyorlanmoqda", packaging: "Qadoqlanmoqda", shipped: "Jo'natilgan", delivered: "Yetkazilgan", cancelled: "Bekor qilingan" },
} as const;

function OrderStatusSelect({ order, locale }: { order: Order; locale: Locale }) {
  const updateStatus = useUpdateOrderStatus();
  const text = adminText[locale];

  async function handleChange(status: OrderStatus) {
    try {
      await updateStatus.mutateAsync({ orderId: order.id, status });
      toast({ title: text.updated, description: `#${order.id.slice(0, 8)}: ${text[status]}.` });
    } catch (error) {
      toast({
        title: text.updateFailed,
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <select
      className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      disabled={updateStatus.isPending}
      value={order.status}
      onChange={(event) => void handleChange(event.target.value as OrderStatus)}
      aria-label={`Update order ${order.order_code} status`}
    >
      {orderStatuses.map((status) => (
        <option key={status} value={status}>
          {text[status]}
        </option>
      ))}
    </select>
  );
}

export function AdminDashboardPage() {
  const dashboardQuery = useAdminDashboard();
  const { locale } = useLocale();
  const text = adminText[locale];
  const deleteOrder = useDeleteOrder();
  const data = dashboardQuery.data;

  async function handleDeleteOrder(order: Order) {
    try {
      await deleteOrder.mutateAsync(order.id);
      toast({ title: text.deleted, description: `#${order.id.slice(0, 8)}` });
    } catch (error) {
      toast({
        title: text.deleteFailed,
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <PageWrapper className="container py-10">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Admin</p>
          <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">{text.title}</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link to="/seller/dashboard">{text.manage}</Link>
          </Button>
          <Button asChild>
            <Link to="/seller/add-product">
              <Plus className="h-4 w-4" />
              {text.add}
            </Link>
          </Button>
        </div>
      </div>

      {dashboardQuery.isError ? (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold">{text.connection}</h2>
            <p className="mt-2 text-sm text-destructive">
              {getSupabaseErrorMessage(dashboardQuery.error)}
            </p>
          </CardContent>
        </Card>
      ) : dashboardQuery.isLoading || !data ? (
        <div className="grid gap-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      ) : (
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard icon={Package} label={text.products} value={String(data.summary.totalProducts)} />
            <StatCard icon={BarChart3} label={text.orders} value={String(data.summary.totalOrders)} />
            <StatCard icon={UsersRound} label={text.users} value={String(data.summary.totalUsers)} />
            <StatCard icon={DollarSign} label={text.revenue} value={formatPrice(data.summary.totalRevenue)} />
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="border-b border-border p-5">
                <h2 className="text-xl font-semibold">{text.orders}</h2>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{text.order}</TableHead><TableHead>{text.customer}</TableHead><TableHead>{text.total}</TableHead><TableHead>{text.status}</TableHead><TableHead>{text.date}</TableHead><TableHead className="text-right">{text.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <Link className="text-primary underline-offset-4 hover:underline" to={`/orders/${order.id.slice(0, 8)}`}>
                          {order.order_code}
                        </Link>
                      </TableCell>
                      <TableCell>{order.shipping_address.fullName || order.shipping_address.email || order.buyer_id?.slice(0, 8) || text.guest}</TableCell>
                      <TableCell>{formatPrice(order.total_price)}</TableCell>
                      <TableCell>
                        <OrderStatusSelect order={order} locale={locale} />
                      </TableCell>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deleteOrder.isPending}
                          onClick={() => void handleDeleteOrder(order)}
                          aria-label={`Delete order ${order.id.slice(0, 8)}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        {text.emptyOrders}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardContent className="p-0">
                <div className="border-b border-border p-5">
                  <h2 className="text-xl font-semibold">{text.products}</h2>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{text.products}</TableHead><TableHead>{text.price}</TableHead><TableHead>{text.status}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.products.slice(0, 8).map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.title}</TableCell>
                        <TableCell>{formatPrice(product.price)}</TableCell>
                        <TableCell>
                          <Badge variant={product.is_published ? "default" : "muted"}>
                            {product.is_published ? text.published : text.draft}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <div className="flex items-center gap-2 border-b border-border p-5">
                  <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
                  <h2 className="text-xl font-semibold">{text.users}</h2>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{text.name}</TableHead><TableHead>{text.role}</TableHead><TableHead>{text.joined}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.profiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">{profile.full_name ?? profile.id.slice(0, 8)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{profile.role}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(profile.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
