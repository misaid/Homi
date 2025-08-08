// zod schemas for this module
import { z } from "zod";

export const IdParam = z.object({ id: z.string().uuid() });

export const PaginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PageQuery = z.infer<typeof PaginationQuery>;
