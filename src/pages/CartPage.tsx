import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { useCart } from "@/hooks/useCart";

export function CartPage() {
  const { items, subtotal } = useCart();

  return (
    <PageWrapper className="container py-10">
      <h1 className="font-display text-4xl font-bold md:text-5xl">Cart</h1>
      {items.length === 0 ? (
        <div className="grid min-h-96 place-items-center text-center">
          <div>
            <ShoppingBag className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-semibold">No items yet</h2>
            <p className="mt-2 text-muted-foreground">The catalog is ready when you are.</p>
            <Button className="mt-5" asChild>
              <Link to="/catalog">Browse catalog</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_24rem]">
          <div className="grid gap-3">
            {items.map((item) => (
              <CartItem key={item.product.id} item={item} />
            ))}
          </div>
          <CartSummary subtotal={subtotal} />
        </div>
      )}
    </PageWrapper>
  );
}
