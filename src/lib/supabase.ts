import { createClient } from "@supabase/supabase-js";
import type { ProductDimensions } from "@/types/product";
import type { OrderStatus, ShippingAddress } from "@/types/order";
import type { UserRole } from "@/types/user";

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          created_at?: string;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          image_url: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          image_url?: string | null;
        };
        Update: {
          name?: string;
          slug?: string;
          image_url?: string | null;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          seller_id: string;
          category_id: string;
          title: string;
          description: string | null;
          price: number;
          stock_count: number;
          images: string[] | null;
          dimensions: ProductDimensions | null;
          material: string | null;
          color: string | null;
          style: string | null;
          is_published: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          category_id: string;
          title: string;
          description?: string | null;
          price: number;
          stock_count?: number;
          images?: string[] | null;
          dimensions?: ProductDimensions | null;
          material?: string | null;
          color?: string | null;
          style?: string | null;
          is_published?: boolean;
          created_at?: string;
        };
        Update: {
          category_id?: string;
          title?: string;
          description?: string | null;
          price?: number;
          stock_count?: number;
          images?: string[] | null;
          dimensions?: ProductDimensions | null;
          material?: string | null;
          color?: string | null;
          style?: string | null;
          is_published?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          buyer_id: string;
          status: OrderStatus;
          total_price: number;
          shipping_address: ShippingAddress;
          created_at: string;
        };
        Insert: {
          id?: string;
          buyer_id: string;
          status?: OrderStatus;
          total_price: number;
          shipping_address: ShippingAddress;
          created_at?: string;
        };
        Update: {
          status?: OrderStatus;
          total_price?: number;
          shipping_address?: ShippingAddress;
        };
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey";
            columns: ["buyer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          price_at_purchase: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          quantity: number;
          price_at_purchase: number;
        };
        Update: {
          quantity?: number;
          price_at_purchase?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured =
  Boolean(supabaseUrl && supabaseAnonKey) &&
  supabaseUrl !== "https://xxxx.supabase.co" &&
  supabaseAnonKey !== "your-anon-key";

export const supabase = createClient<Database>(
  supabaseUrl ?? "https://demo.supabase.co",
  supabaseAnonKey ?? "demo-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export function jsonToShippingAddress(value: Json | ShippingAddress | null): ShippingAddress {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { fullName: "", email: "", phone: "", address: "", city: "" };
  }

  const record = value as Record<string, Json>;
  return {
    fullName: typeof record.fullName === "string" ? record.fullName : "",
    email: typeof record.email === "string" ? record.email : "",
    phone: typeof record.phone === "string" ? record.phone : "",
    address: typeof record.address === "string" ? record.address : "",
    city: typeof record.city === "string" ? record.city : "",
  };
}
