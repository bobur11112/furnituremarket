import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchManagedProducts } from "@/hooks/useProducts";
import { jsonToShippingAddress, requireSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Order, OrderStatus } from "@/types/order";

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

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      requireSupabaseConfigured();
      const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
      if (error) throw error;
      return { orderId, status };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] }),
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
    },
  });
}
