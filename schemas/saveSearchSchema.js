// schemas/saveSearchSchema.js
import { z } from "zod";

export const saveSearchSchema = z.object({
  orgId: z.string().min(1, "orgId is required"), // ✅ enforce org isolation
  name: z.string().min(1, "Name is required"),
  query: z.record(z.any()), // flexible query object
  sort: z.record(z.any()).optional(),
});
