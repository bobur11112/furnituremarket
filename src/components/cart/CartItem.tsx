import { useEffect, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useCart } from "@/hooks/useCart";
import { useDebounce } from "@/hooks/useDebounce";
import { formatPrice } from "@/lib/utils";
import type { CartLine } from "@/stores/cartStore";
import { useLocale } from "@/contexts/LocaleContext";

type CartItemProps = {
  item: CartLine;
};

export function CartItem({ item }: CartItemProps) {
  const { removeItem, updateQuantity, addItem } = useCart();
  const { t } = useLocale();
  const [quantity, setQuantity] = useState(item.quantity);
  const debouncedQuantity = useDebounce(quantity, 180);

  useEffect(() => {
    updateQuantity(item.product.id, debouncedQuantity);
  }, [debouncedQuantity, item.product.id, updateQuantity]);

  useEffect(() => {
    setQuantity(item.quantity);
  }, [item.quantity]);

  function handleRemove() {
    removeItem(item.product.id);
    toast({
      title: t("removed"),
      description: item.product.title,
      action: (
        <Button
          size="sm"
          variant="outline"
          onClick={() => addItem(item.product, item.quantity)}
          aria-label={`Undo removing ${item.product.title}`}
        >
          {t("undo")}
        </Button>
      ),
    });
  }

  return (
    <div className="grid grid-cols-[5rem_1fr] gap-4 rounded-lg border border-border bg-card p-3">
      <img src={item.product.images[0]} alt={item.product.title} className="h-20 w-20 rounded-md object-cover" />
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="line-clamp-1 font-semibold">{item.product.title}</h3>
            <p className="text-sm text-muted-foreground">{formatPrice(item.product.price)}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRemove} aria-label={`Remove ${item.product.title}`}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center rounded-md border border-border">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              aria-label={`Decrease quantity for ${item.product.title}`}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="w-8 text-center text-sm font-semibold" aria-live="polite">
              {quantity}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setQuantity((value) => Math.min(item.product.stock_count || value + 1, value + 1))}
              aria-label={`Increase quantity for ${item.product.title}`}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="font-semibold text-primary">{formatPrice(item.product.price * item.quantity)}</p>
        </div>
      </div>
    </div>
  );
}
