import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchManagedProducts } from "@/hooks/useProducts";
import { jsonToShippingAddress, requireSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Order, OrderItem, OrderStatus } from "@/types/order";

type AdminSummary = {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
};

async function fetchAdminOrders() {
  requireSupabaseConfigured();
  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (error) throw error;

  return data.map<Order>((row) => ({
    ...row,
    total_price: Number(row.total_price),
    shipping_address: jsonToShippingAddress(row.shipping_address),
  }));
}

export async function fetchAdminOrder(reference: string) {
  requireSupabaseConfigured();
  const orders = await fetchAdminOrders();
  const order = orders.find((item) => item.id === reference || item.id.startsWith(reference));
  if (!order) return null;

  const { data: itemRows, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", order.id)
    .order("id");
  if (itemsError) throw itemsError;

  const productIds = itemRows.map((item) => item.product_id).filter((id): id is string => Boolean(id));
  const products = productIds.length > 0 ? await fetchManagedProducts() : [];
  const orderItems: OrderItem[] = itemRows.map((item) => ({
    ...item,
    quantity: Number(item.quantity),
    price_at_purchase: Number(item.price_at_purchase),
    product: products.find((product) => product.id === item.product_id),
  }));

  const { data: history, error: historyError } = await supabase
    .from("order_status_history")
    .select("*")
    .eq("order_id", order.id)
    .order("created_at");
  if (historyError) throw historyError;

  return { ...order, order_items: orderItems, status_history: history };
}

async function fetchAdminProfiles() {
  requireSupabaseConfigured();
  const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin-dashboard"],
    refetchInterval: 5_000,
    queryFn: async () => {
      const [products, orders, profiles] = await Promise.all([fetchManagedProducts(), fetchAdminOrders(), fetchAdminProfiles()]);
      const summary: AdminSummary = {
        totalProducts: products.length,
        totalOrders: orders.length,
        totalUsers: profiles.length,
        totalRevenue: orders.reduce((sum, order) => sum + order.total_price, 0),
      };

      return { products, orders, profiles, summary };
    },
  });
}

export function useAdminOrder(reference: string | undefined) {
  return useQuery({
    queryKey: ["admin-order", reference],
    queryFn: () => fetchAdminOrder(reference ?? ""),
    enabled: Boolean(reference),
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status, adminNote }: { orderId: string; status: OrderStatus; adminNote?: string | null }) => {
      requireSupabaseConfigured();
      const { error } = await supabase.rpc("update_order_status", {
        order_id_input: orderId,
        new_status_input: status,
        admin_note_input: adminNote || null,
      });
      if (error) throw error;
      return { orderId, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["admin-order"] });
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      requireSupabaseConfigured();
      const { error } = await supabase.from("orders").delete().eq("id", orderId);
      if (error) throw error;
      return orderId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["seller-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-order"] });
    },
  });
}
