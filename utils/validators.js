import { z } from "zod";

export const authTokenSchema = z.object({
  orgId: z.string().min(1),
  apiKey: z.string().min(1),
  userId: z.string().min(1),
});

export const createLogSchema = z.object({
  eventType: z.string().min(1),
  resource: z.string().optional(),
  description: z.string().optional(),
  metadata: z.any().optional(),
  timestamp: z.coerce.date().optional(),
  userId: z.string().optional(),
  userEmail: z.string().email().optional(),
});

export const listLogsSchema = z.object({
  userId: z.string().optional(),
  userEmail: z.string().optional(),
  eventType: z.string().optional(),
  resource: z.string().optional(),

  // Date range filters
  start: z.coerce.date().optional(),
  end: z.coerce.date().optional(),

  // Search filters
  q: z.string().optional(), // full-text search
  contains: z.string().optional(), // regex/fuzzy search
  fuzzy: z.enum(["true", "false"]).optional(), // restrict values
  operator: z.enum(["AND", "OR"]).default("AND"),

  // Sorting & pagination
  sortBy: z.enum(["timestamp", "eventType", "userId", "userEmail"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),

  // Cursor pagination
  after: z.string().optional(),
  before: z.string().optional(),
});

export const saveSearchSchema = z.object({
  name: z.string().min(1, "name is required"),
  query: z.object({}).catchall(z.any()),   // ✅ allow any keys/values
  sort: z.object({}).catchall(z.any()).optional(), // ✅ allow any keys/values
});
