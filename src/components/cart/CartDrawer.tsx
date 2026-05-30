import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/hooks/useCart";
import { CartItem } from "./CartItem";
import { CartSummary } from "./CartSummary";

export function CartDrawer() {
  const { items, isOpen, closeCart, subtotal } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => (open ? undefined : closeCart())}>
      <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Your cart</SheetTitle>
          <SheetDescription>{items.length} curated piece{items.length === 1 ? "" : "s"} selected.</SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="grid flex-1 place-items-center text-center">
            <div>
              <ShoppingBag className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />
              <h3 className="mt-4 text-xl font-semibold">Your cart is quiet</h3>
              <p className="mt-2 text-sm text-muted-foreground">Add a chair, a lamp, or a whole room.</p>
              <Button className="mt-5" asChild onClick={closeCart}>
                <Link to="/catalog">Browse catalog</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-6 grid flex-1 gap-3">
              {items.map((item) => (
                <CartItem key={item.product.id} item={item} />
              ))}
            </div>
            <div className="mt-6">
              <CartSummary subtotal={subtotal} onCheckout={closeCart} />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
