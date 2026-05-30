import { beforeEach, describe, expect, it } from "vitest";
import { testProducts as products } from "@/test/fixtures";
import { useCartStore } from "./cartStore";

describe("cartStore", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], isOpen: false });
  });

  it("adds and removes items", () => {
    useCartStore.getState().addItem(products[0], 2);
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].quantity).toBe(2);

    useCartStore.getState().removeItem(products[0].id);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("updates quantity and calculates totals", () => {
    useCartStore.getState().addItem(products[0], 1);
    useCartStore.getState().addItem(products[1], 1);
    useCartStore.getState().updateQuantity(products[0].id, 3);

    expect(useCartStore.getState().items[0].quantity).toBe(3);
    expect(useCartStore.getState().subtotal()).toBe(products[0].price * 3 + products[1].price);
    expect(useCartStore.getState().totalQuantity()).toBe(4);
  });

  it("clears the cart", () => {
    useCartStore.getState().addItem(products[0]);
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toEqual([]);
  });
});
