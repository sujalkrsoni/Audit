// schemas/saveSearchSchema.js
import { z } from "zod";

export const saveSearchSchema = z.object({
  name: z.string().min(1, "Name is required"),
  query: z.object({}).catchall(z.any({})),
  sort: z.object({}).catchall(z.any({})).optional(),
});