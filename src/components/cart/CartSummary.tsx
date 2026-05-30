import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";

type CartSummaryProps = {
  subtotal: number;
  disabled?: boolean;
  onCheckout?: () => void;
};

export function CartSummary({ subtotal, disabled = false, onCheckout }: CartSummaryProps) {
  const shipping = subtotal > 0 ? 90 : 0;
  const total = subtotal + shipping;

  return (
    <div className="grid gap-4 rounded-lg border border-border bg-card p-5">
      <h2 className="text-lg font-semibold">Order summary</h2>
      <div className="grid gap-3 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Insured delivery</span>
          <span>{formatPrice(shipping)}</span>
        </div>
      </div>
      <Separator />
      <div className="flex justify-between font-semibold">
        <span>Total</span>
        <span className="text-primary">{formatPrice(total)}</span>
      </div>
      {disabled || subtotal <= 0 ? (
        <Button disabled>Proceed to checkout</Button>
      ) : (
        <Button asChild onClick={onCheckout}>
          <Link to="/checkout">Proceed to checkout</Link>
        </Button>
      )}
    </div>
  );
}
