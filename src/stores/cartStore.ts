import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types/product";

export type CartLine = {
  product: Product;
  quantity: number;
};

type CartState = {
  items: CartLine[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: () => number;
  totalQuantity: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      addItem: (product, quantity = 1) =>
        set((state) => {
          const current = state.items.find((item) => item.product.id === product.id);
          if (current) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock_count || item.quantity + quantity) }
                  : item,
              ),
              isOpen: true,
            };
          }

          return {
            items: [...state.items, { product, quantity: Math.min(quantity, product.stock_count || quantity) }],
            isOpen: true,
          };
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        })),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.product.id === productId
                ? { ...item, quantity: Math.max(1, Math.min(quantity, item.product.stock_count || quantity)) }
                : item,
            )
            .filter((item) => item.quantity > 0),
        })),
      clearCart: () => set({ items: [], isOpen: false }),
      subtotal: () => get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
      totalQuantity: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: "bigart-cart",
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
