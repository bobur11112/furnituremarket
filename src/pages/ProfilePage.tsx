import { Link, useSearchParams } from "react-router-dom";
import { LogOut, PackageCheck, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useAuth } from "@/hooks/useAuth";
import { useOrders, useRealtimeOrders } from "@/hooks/useOrders";
import { formatDate, formatPrice } from "@/lib/utils";

export function ProfilePage() {
  const [searchParams] = useSearchParams();
  const { user, profile, signOut } = useAuth();
  const ordersQuery = useOrders(user?.id);
  useRealtimeOrders(user?.id);

  return (
    <PageWrapper className="container py-10">
      {searchParams.get("order") === "success" ? (
        <div className="mb-6 rounded-lg border border-primary/40 bg-primary/10 p-4 text-sm text-primary">
          Order received. Realtime status updates will appear here without refreshing.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <Card className="self-start">
          <CardContent className="p-6">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
              <UserRound className="h-7 w-7" aria-hidden="true" />
            </div>
            <h1 className="mt-5 text-2xl font-semibold">{profile?.full_name ?? user?.email}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
            <Badge className="mt-4" variant="outline">
              {profile?.role ?? "buyer"}
            </Badge>
            <div className="mt-6 grid gap-3">
              {profile?.role === "seller" || profile?.role === "admin" ? (
                <Button asChild>
                  <Link to="/seller/dashboard">Seller dashboard</Link>
                </Button>
              ) : null}
              <Button variant="outline" onClick={() => void signOut()}>
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>

        <section>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Orders</p>
              <h2 className="mt-2 font-display text-4xl font-bold">Purchase history</h2>
            </div>
          </div>

          {ordersQuery.isLoading ? (
            <div className="grid gap-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (ordersQuery.data ?? []).length === 0 ? (
            <div className="grid min-h-80 place-items-center rounded-lg border border-dashed border-border bg-card p-8 text-center">
              <div>
                <PackageCheck className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />
                <h3 className="mt-4 text-xl font-semibold">No orders yet</h3>
                <p className="mt-2 text-muted-foreground">Save your first room-defining piece.</p>
                <Button className="mt-5" asChild>
                  <Link to="/catalog">Browse catalog</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {(ordersQuery.data ?? []).map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-5">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div>
                        <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <Badge>{order.status}</Badge>
                        <p className="mt-2 font-semibold text-primary">{formatPrice(order.total_price)}</p>
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-muted-foreground">
                      Ships to {order.shipping_address.fullName}, {order.shipping_address.city}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageWrapper>
  );
}
