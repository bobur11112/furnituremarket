import { z } from "zod";

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(120),
  email: z.union([z.string().trim().email("Enter a valid email").max(160), z.literal("")]),
  phone: z.string().trim().min(9, "Phone must be at least 9 digits").max(32),
  address: z.string().trim().min(5, "Address must be at least 5 characters").max(240),
  city: z.string().trim().min(2, "City is required").max(80),
  comment: z.string().trim().max(500).optional(),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
