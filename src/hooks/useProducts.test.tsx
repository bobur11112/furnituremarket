import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PropsWithChildren } from "react";
import { testProducts } from "@/test/fixtures";
import { catalogMaxPrice, type ProductFilters } from "@/types/product";

const filters: ProductFilters = {
  categories: [],
  styles: [],
  materials: [],
  minPrice: 0,
  maxPrice: catalogMaxPrice,
  sort: "newest",
  search: "",
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useProducts", () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("returns loading and success states with Supabase data", async () => {
    vi.doMock("@/lib/supabase", () => ({
      requireSupabaseConfigured: () => undefined,
      supabase: {
        from: () => ({
          select: () => ({
            is: () => ({
              eq: () => ({
                order: () => Promise.resolve({ data: testProducts, error: null }),
              }),
            }),
          }),
        }),
      },
    }));

    const { useProducts } = await import("./useProducts");
    const { result } = renderHook(() => useProducts(filters), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.length).toBeGreaterThan(0);
  });

  it("surfaces Supabase errors", async () => {
    const supabaseError = new Error("Supabase is unavailable");
    vi.doMock("@/lib/supabase", () => ({
      requireSupabaseConfigured: () => undefined,
      supabase: {
        from: () => ({
          select: () => ({
            is: () => ({
              eq: () => ({
                order: () => Promise.resolve({ data: [], error: supabaseError }),
              }),
            }),
          }),
        }),
      },
    }));

    const { useProducts } = await import("./useProducts");
    const { result } = renderHook(() => useProducts(filters), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(supabaseError);
  });
});
