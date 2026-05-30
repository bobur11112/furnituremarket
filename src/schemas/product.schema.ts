import { z } from "zod";

export const furnitureStyles = ["modern", "classic", "scandinavian", "industrial", "minimalist"] as const;

const numberFromInput = z.coerce.number({ invalid_type_error: "Enter a valid number" });

export const dimensionsSchema = z.object({
  width: numberFromInput.positive("Width must be positive"),
  height: numberFromInput.positive("Height must be positive"),
  depth: numberFromInput.positive("Depth must be positive"),
  unit: z.enum(["cm", "inch"]),
});

export const productSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().min(20, "Description must be at least 20 characters"),
  price: numberFromInput.positive("Price must be positive"),
  stock_count: numberFromInput.int().min(0, "Stock cannot be negative"),
  category_id: z.string().uuid("Choose a category"),
  material: z.string().min(2, "Material is required"),
  color: z.string().min(2, "Color is required"),
  style: z.enum(furnitureStyles),
  dimensions: dimensionsSchema,
});

export type ProductFormValues = z.infer<typeof productSchema>;
