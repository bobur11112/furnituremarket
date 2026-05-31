import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, MapPin, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useCart } from "@/hooks/useCart";
import { useCreateOrder } from "@/hooks/useOrders";
import { formatPrice } from "@/lib/utils";
import { getSupabaseErrorMessage } from "@/lib/supabase";
import { checkoutSchema, type CheckoutFormValues } from "@/schemas/order.schema";
import { useLocale } from "@/contexts/LocaleContext";

export function CheckoutPage() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const createOrderMutation = useCreateOrder();
  const { t } = useLocale();
  const steps = [
    { title: t("contact"), icon: UserRound, fields: ["fullName", "email", "phone"] as const },
    { title: t("shipping"), icon: MapPin, fields: ["address", "city"] as const },
  ];
  const methods = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      comment: "",
    },
  });

  async function nextStep() {
    const valid = await methods.trigger([...steps[step].fields]);
    if (valid) setStep((value) => Math.min(value + 1, steps.length - 1));
  }

  async function onSubmit(values: CheckoutFormValues) {
    if (items.length === 0) return;

    try {
      const createdOrder = await createOrderMutation.mutateAsync({ checkout: values, items });
      clearCart();
      toast({ title: t("orderPlaced"), description: t("orderPlacedBody") });
      navigate(`/order/success/${createdOrder.trackingToken}`);
    } catch (error) {
      toast({
        title: t("checkoutFailed"),
        description: getSupabaseErrorMessage(error),
        variant: "destructive",
      });
    }
  }

  if (items.length === 0) {
    return (
      <PageWrapper className="container grid min-h-[70vh] place-items-center py-10 text-center">
        <div>
          <h1 className="text-3xl font-semibold">{t("checkoutEmpty")}</h1>
          <p className="mt-2 text-muted-foreground">{t("chooseBeforeCheckout")}</p>
          <Button className="mt-5" asChild>
            <Link to="/catalog">{t("browseCatalog")}</Link>
          </Button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="container py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">{t("checkoutEyebrow")}</p>
        <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">{t("checkoutTitle")}</h1>
      </div>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-[1fr_24rem]">
          <Card>
            <CardContent className="p-6">
              <div className="mb-8 grid grid-cols-2 gap-3">
                {steps.map((item, index) => (
                  <div
                    key={item.title}
                    className={`rounded-lg border p-3 ${index === step ? "border-primary bg-primary/10" : "border-border bg-secondary/40"}`}
                  >
                    <item.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    <p className="mt-2 text-sm font-semibold">{item.title}</p>
                  </div>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25 }}
                  className="grid gap-4"
                >
                  {step === 0 ? (
                    <>
                      <Field id="fullName" label={t("fullName")} error={methods.formState.errors.fullName?.message} />
                      <Field id="email" type="email" label="Email" error={methods.formState.errors.email?.message} />
                      <Field id="phone" label={t("phone")} error={methods.formState.errors.phone?.message} />
                    </>
                  ) : null}
                  {step === 1 ? (
                    <>
                      <Field id="address" label={t("address")} error={methods.formState.errors.address?.message} />
                      <Field id="city" label={t("city")} error={methods.formState.errors.city?.message} />
                      <div className="grid gap-2">
                        <Label htmlFor="comment">{t("comment")}</Label>
                        <Textarea id="comment" {...methods.register("comment")} />
                        {methods.formState.errors.comment?.message ? <p className="text-sm text-destructive">{methods.formState.errors.comment.message}</p> : null}
                      </div>
                    </>
                  ) : null}
                </motion.div>
              </AnimatePresence>

              <div className="mt-8 flex justify-between">
                <Button type="button" variant="outline" onClick={() => setStep((value) => Math.max(value - 1, 0))} disabled={step === 0}>
                  {t("back")}
                </Button>
                {step < steps.length - 1 ? (
                  <Button type="button" onClick={() => void nextStep()}>
                    {t("continue")}
                  </Button>
                ) : (
                  <Button type="submit" disabled={createOrderMutation.isPending}>
                    {createOrderMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {t("placeOrder")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <aside className="self-start rounded-lg border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">{t("orderSummary")}</h2>
            <div className="mt-4 grid gap-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-3">
                  <img src={item.product.images[0]} alt={item.product.title} className="h-16 w-16 rounded-md object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 font-medium">{item.product.title}</p>
                    <p className="text-sm text-muted-foreground">{t("quantity")} {item.quantity}</p>
                  </div>
                  <p className="font-semibold">{formatPrice(item.product.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <Separator className="my-5" />
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>{t("subtotal")}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t("delivery")}</span>
                <span>{t("deliveryValue")}</span>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <span>{t("total")}</span>
                <span className="text-primary">{formatPrice(subtotal)}</span>
              </div>
            </div>
          </aside>
        </form>
      </FormProvider>
    </PageWrapper>
  );
}

function Field({
  id,
  label,
  error,
  type = "text",
}: {
  id: keyof CheckoutFormValues;
  label: string;
  error?: string;
  type?: string;
}) {
  const methods = useFormContextSafe();
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} {...methods.register(id)} />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function useFormContextSafe() {
  return useFormContext<CheckoutFormValues>();
}
