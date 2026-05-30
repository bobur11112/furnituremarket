import { describe, expect, it } from "vitest";
import { checkoutSchema } from "./order.schema";

const validCheckout = {
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  phone: "+998901112233",
  address: "21 Gallery Avenue",
  city: "Tashkent",
  paymentMethod: "card" as const,
};

describe("checkoutSchema", () => {
  it("accepts valid checkout details", () => {
    expect(checkoutSchema.safeParse(validCheckout).success).toBe(true);
  });

  it("rejects short names and invalid emails", () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, fullName: "A", email: "not-email" });
    expect(result.success).toBe(false);
  });

  it("rejects unsupported payment methods", () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, paymentMethod: "wire" });
    expect(result.success).toBe(false);
  });
});
