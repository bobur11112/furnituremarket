import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { requireSupabaseConfigured, supabase } from "@/lib/supabase";
import type { CartLine } from "@/stores/cartStore";
import type { CheckoutInput, PublicOrderTracking } from "@/types/order";

type CreateOrderInput = {
  checkout: CheckoutInput;
  items: CartLine[];
};

export type CreatedOrder = {
  orderCode: string;
  trackingToken: string;
};

function isCreatedOrder(value: unknown): value is CreatedOrder {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return typeof record.orderCode === "string" && typeof record.trackingToken === "string";
}

function isPublicOrderTracking(value: unknown): value is PublicOrderTracking {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return typeof record.orderCode === "string" && typeof record.status === "string";
}

export async function createOrder({ checkout, items }: CreateOrderInput) {
  requireSupabaseConfigured();

  const shippingAddress = {
    fullName: checkout.fullName,
    email: checkout.email,
    phone: checkout.phone,
    address: checkout.address,
    city: checkout.city,
  };

  const { data, error } = await supabase.rpc("place_public_order", {
    shipping: shippingAddress,
    items: items.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
    })),
    customer_comment: checkout.comment || null,
  });
  if (error) throw error;
  if (!isCreatedOrder(data)) throw new Error("Order confirmation is unavailable.");

  return data;
}

export async function fetchPublicOrderTracking(trackingToken: string) {
  requireSupabaseConfigured();
  const { data, error } = await supabase.rpc("get_public_order_tracking", {
    tracking_token_input: trackingToken,
  });
  if (error) throw error;
  return isPublicOrderTracking(data) ? data : null;
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function usePublicOrderTracking(trackingToken: string | undefined) {
  return useQuery({
    queryKey: ["public-order-tracking", trackingToken],
    queryFn: () => fetchPublicOrderTracking(trackingToken ?? ""),
    enabled: Boolean(trackingToken),
  });
}
