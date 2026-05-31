import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, beforeEach } from "vitest";
import { testProducts as products } from "@/test/fixtures";
import { useCartStore } from "@/stores/cartStore";
import { ProductCard } from "./ProductCard";

describe("ProductCard", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], isOpen: false });
  });

  it("renders title and price", () => {
    render(
      <MemoryRouter>
        <ProductCard product={products[0]} />
      </MemoryRouter>,
    );

    expect(screen.getByText(products[0].title)).toBeInTheDocument();
    expect(screen.getByText(/1\s480 сум/)).toBeInTheDocument();
  });

  it("adds the product to cart", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ProductCard product={products[0]} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: `Add ${products[0].title} to cart` }));

    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].product.id).toBe(products[0].id);
  });
});
