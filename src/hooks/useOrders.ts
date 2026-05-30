import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requireSupabaseConfigured, supabase } from "@/lib/supabase";
import type { CartLine } from "@/stores/cartStore";
import type { CheckoutInput, Order } from "@/types/order";

type CreateOrderInput = {
  checkout: CheckoutInput;
  items: CartLine[];
};

export async function createOrder({ checkout, items }: CreateOrderInput) {
  requireSupabaseConfigured();

  const shippingAddress = {
    fullName: checkout.fullName,
    email: checkout.email,
    phone: checkout.phone,
    address: checkout.address,
    city: checkout.city,
  };

  const { data: orderId, error } = await supabase.rpc("place_public_order", {
    shipping: shippingAddress,
    items: items.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
    })),
  });
  if (error) throw error;

  return {
    id: orderId,
    buyer_id: null,
    status: "pending",
    total_price: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0) + 90,
    shipping_address: shippingAddress,
    created_at: new Date().toISOString(),
  } satisfies Order;
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
