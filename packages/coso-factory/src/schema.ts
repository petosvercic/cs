import { z } from "zod";

export const ProductConfigSchema = z.object({
  productSlug: z.string().min(1),
  editionSlug: z.string().min(1),
  locale: z.enum(["sk", "cz", "en"]),
  title: z.string().min(1)
});

export type ProductConfig = z.infer<typeof ProductConfigSchema>;
