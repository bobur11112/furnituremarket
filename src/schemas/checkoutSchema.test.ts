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

  it("rejects invalid emails", () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, email: "not-email" });
    expect(result.success).toBe(false);
  });

  it("allows guest checkout without contact and delivery details and rejects oversized comments", () => {
    expect(checkoutSchema.safeParse({ fullName: "", email: "", phone: "", address: "", city: "" }).success).toBe(true);
    expect(checkoutSchema.safeParse({ ...validCheckout, comment: "x".repeat(501) }).success).toBe(false);
  });
});
