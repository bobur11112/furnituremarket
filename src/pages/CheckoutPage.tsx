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
import { toast } from "@/components/ui/toast";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useCart } from "@/hooks/useCart";
import { useCreateOrder } from "@/hooks/useOrders";
import { formatPrice } from "@/lib/utils";
import { checkoutSchema, type CheckoutFormValues } from "@/schemas/order.schema";

const steps = [
  { title: "Contact", icon: UserRound, fields: ["fullName", "email", "phone"] as const },
  { title: "Shipping", icon: MapPin, fields: ["address", "city"] as const },
];

export function CheckoutPage() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const createOrderMutation = useCreateOrder();
  const methods = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
    },
  });

  async function nextStep() {
    const valid = await methods.trigger([...steps[step].fields]);
    if (valid) setStep((value) => Math.min(value + 1, steps.length - 1));
  }

  async function onSubmit(values: CheckoutFormValues) {
    if (items.length === 0) return;

    try {
      await createOrderMutation.mutateAsync({ checkout: values, items });
      clearCart();
      toast({ title: "Order placed", description: "Your seller will confirm availability shortly." });
      navigate("/catalog");
    } catch (error) {
      toast({
        title: "Checkout failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  if (items.length === 0) {
    return (
      <PageWrapper className="container grid min-h-[70vh] place-items-center py-10 text-center">
        <div>
          <h1 className="text-3xl font-semibold">Your cart is empty</h1>
          <p className="mt-2 text-muted-foreground">Choose a product before checkout.</p>
          <Button className="mt-5" asChild>
            <Link to="/catalog">Browse catalog</Link>
          </Button>
        </div>
      </PageWrapper>
    );
  }

  const shipping = subtotal > 0 ? 90 : 0;

  return (
    <PageWrapper className="container py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Checkout</p>
        <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">Secure order</h1>
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
                      <Field id="fullName" label="Full name" error={methods.formState.errors.fullName?.message} />
                      <Field id="email" type="email" label="Email" error={methods.formState.errors.email?.message} />
                      <Field id="phone" label="Phone" error={methods.formState.errors.phone?.message} />
                    </>
                  ) : null}
                  {step === 1 ? (
                    <>
                      <Field id="address" label="Street address" error={methods.formState.errors.address?.message} />
                      <Field id="city" label="City" error={methods.formState.errors.city?.message} />
                    </>
                  ) : null}
                </motion.div>
              </AnimatePresence>

              <div className="mt-8 flex justify-between">
                <Button type="button" variant="outline" onClick={() => setStep((value) => Math.max(value - 1, 0))} disabled={step === 0}>
                  Back
                </Button>
                {step < steps.length - 1 ? (
                  <Button type="button" onClick={() => void nextStep()}>
                    Continue
                  </Button>
                ) : (
                  <Button type="submit" disabled={createOrderMutation.isPending}>
                    {createOrderMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Place order
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <aside className="self-start rounded-lg border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">Order summary</h2>
            <div className="mt-4 grid gap-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-3">
                  <img src={item.product.images[0]} alt={item.product.title} className="h-16 w-16 rounded-md object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 font-medium">{item.product.title}</p>
                    <p className="text-sm text-muted-foreground">Qty {item.quantity}</p>
                  </div>
                  <p className="font-semibold">{formatPrice(item.product.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <Separator className="my-5" />
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery</span>
                <span>{formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span className="text-primary">{formatPrice(subtotal + shipping)}</span>
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
