import { describe, expect, it } from "vitest";
import { checkoutSchema } from "./order.schema";

const validCheckout = {
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  phone: "+998901112233",
  address: "21 Gallery Avenue",
  city: "Tashkent",
};

describe("checkoutSchema", () => {
  it("accepts valid checkout details", () => {
    expect(checkoutSchema.safeParse(validCheckout).success).toBe(true);
  });

  it("rejects short names and invalid emails", () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, fullName: "A", email: "not-email" });
    expect(result.success).toBe(false);
  });

  it("allows guest checkout without email and rejects oversized comments", () => {
    expect(checkoutSchema.safeParse({ ...validCheckout, email: "" }).success).toBe(true);
    expect(checkoutSchema.safeParse({ ...validCheckout, comment: "x".repeat(501) }).success).toBe(false);
  });
});
