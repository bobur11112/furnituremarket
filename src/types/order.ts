import type { Product } from "@/types/product";

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

export type ShippingAddress = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  product?: Product;
};

export type Order = {
  id: string;
  buyer_id: string;
  status: OrderStatus;
  total_price: number;
  shipping_address: ShippingAddress;
  created_at: string;
  order_items?: OrderItem[];
};

export type CheckoutInput = ShippingAddress & {
  paymentMethod: "card" | "cash_on_delivery";
};
