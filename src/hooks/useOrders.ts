import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { demoOrders } from "@/lib/mockData";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { CartLine } from "@/stores/cartStore";
import type { CheckoutInput, Order } from "@/types/order";

type CreateOrderInput = {
  buyerId: string;
  checkout: CheckoutInput;
  items: CartLine[];
};

async function delay(ms = 250) {
  await new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function fetchOrders(buyerId: string) {
  if (!isSupabaseConfigured) {
    await delay();
    return demoOrders.map((order) => ({ ...order, buyer_id: buyerId }));
  }

  const { data, error } = await supabase.from("orders").select("*").eq("buyer_id", buyerId).order("created_at", { ascending: false });
  if (error) throw error;

  return data.map<Order>((order) => ({
    ...order,
    total_price: Number(order.total_price),
    shipping_address: order.shipping_address,
  }));
}

export async function createOrder({ buyerId, checkout, items }: CreateOrderInput) {
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingAddress = {
    fullName: checkout.fullName,
    email: checkout.email,
    phone: checkout.phone,
    address: checkout.address,
    city: checkout.city,
  };

  if (!isSupabaseConfigured) {
    await delay(350);
    return {
      id: crypto.randomUUID(),
      buyer_id: buyerId,
      status: "pending",
      total_price: total,
      shipping_address: shippingAddress,
      created_at: new Date().toISOString(),
      order_items: items.map((item) => ({
        id: crypto.randomUUID(),
        order_id: "demo",
        product_id: item.product.id,
        quantity: item.quantity,
        price_at_purchase: item.product.price,
        product: item.product,
      })),
    } satisfies Order;
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      buyer_id: buyerId,
      total_price: total,
      shipping_address: shippingAddress,
    })
    .select("*")
    .single();
  if (orderError) throw orderError;

  const { error: itemsError } = await supabase.from("order_items").insert(
    items.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      price_at_purchase: item.product.price,
    })),
  );
  if (itemsError) throw itemsError;

  return {
    ...order,
    total_price: Number(order.total_price),
    shipping_address: order.shipping_address,
  } satisfies Order;
}

export function useOrders(buyerId: string | undefined) {
  return useQuery({
    queryKey: ["orders", buyerId],
    queryFn: () => fetchOrders(buyerId ?? ""),
    enabled: Boolean(buyerId),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrder,
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["orders", order.buyer_id] });
    },
  });
}

export function useRealtimeOrders(buyerId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!buyerId || !isSupabaseConfigured) return undefined;

    const channel = supabase
      .channel(`orders:${buyerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `buyer_id=eq.${buyerId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["orders", buyerId] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [buyerId, queryClient]);
}
