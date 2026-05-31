import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLocale } from "@/contexts/LocaleContext";
import { formatPrice } from "@/lib/utils";

export function CartSummary({ subtotal, disabled = false, onCheckout }: { subtotal: number; disabled?: boolean; onCheckout?: () => void }) {
  const { t } = useLocale();
  return (
    <div className="grid gap-4 rounded-lg border border-border bg-card p-5">
      <h2 className="text-lg font-semibold">{t("orderSummary")}</h2>
      <div className="grid gap-3 text-sm">
        <div className="flex justify-between text-muted-foreground"><span>{t("subtotal")}</span><span>{formatPrice(subtotal)}</span></div>
        <div className="flex justify-between text-muted-foreground"><span>{t("delivery")}</span><span>{t("deliveryValue")}</span></div>
      </div>
      <Separator />
      <div className="flex justify-between font-semibold"><span>{t("total")}</span><span className="text-primary">{formatPrice(subtotal)}</span></div>
      {disabled || subtotal <= 0 ? <Button disabled>{t("checkout")}</Button> : <Button asChild onClick={onCheckout}><Link to="/checkout">{t("checkout")}</Link></Button>}
    </div>
  );
}
