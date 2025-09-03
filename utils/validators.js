import { z } from "zod";

export const authTokenSchema = z.object({
  orgId: z.string().min(1),
  apiKey: z.string().min(2, "API key must be at least 32 characters"), // 🔒 security fix
  userId: z.string().min(1),
});

export const createLogSchema = z.object({
  eventType: z.string().min(1),
  resource: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(), // ✅ ensure metadata is object
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
  fuzzy: z.enum(["true", "false"]).optional(),
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
  query: z.object({}).catchall(z.any()),   // ✅ flexible object
  sort: z.object({}).catchall(z.any()).optional(),
});

// ✅ New schema for /logs/stats
export const statsSchema = z.object({
  interval: z.enum(["hour", "day", "month"]).default("hour"),
  userId: z.string().optional(),
  userEmail: z.string().optional(),
  eventType: z.string().optional(),
  resource: z.string().optional(),
  start: z.coerce.date().optional(),
  end: z.coerce.date().optional(),
});
