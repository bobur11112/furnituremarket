import type { Product } from "@/types/product";

export type OrderStatus =
  | "new"
  | "pending_confirmation"
  | "confirmed"
  | "processing"
  | "packaging"
  | "shipped"
  | "delivered"
  | "cancelled";

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
  product_id: string | null;
  product_title?: string | null;
  quantity: number;
  price_at_purchase: number;
  product?: Product;
};

export type Order = {
  id: string;
  buyer_id: string | null;
  order_code: string;
  tracking_token: string;
  status: OrderStatus;
  total_price: number;
  shipping_address: ShippingAddress;
  comment: string | null;
  admin_note: string | null;
  payment_method: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
  status_history?: OrderStatusHistory[];
};

export type OrderStatusHistory = {
  id: string;
  order_id: string;
  old_status: OrderStatus | null;
  new_status: OrderStatus;
  changed_by_admin_id: string | null;
  created_at: string;
};

export type PublicTrackingItem = {
  title: string;
  quantity: number;
};

export type PublicTrackingHistory = {
  status: OrderStatus;
  createdAt: string;
};

export type PublicOrderTracking = {
  orderCode: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  maskedPhone: string;
  city: string;
  items: PublicTrackingItem[];
  history: PublicTrackingHistory[];
};

export type CheckoutInput = ShippingAddress & { comment?: string };
