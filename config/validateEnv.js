import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Mongo
  MONGODB_URI: z
    .string()
    .regex(/^mongodb(\+srv)?:\/\//, "Must be a valid MongoDB connection string"),

  // JWT
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters long"),
  JWT_DEFAULT_TTL: z.string().default("1h"),

  // SMTP
  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_SECURE: z.preprocess(
    (v) => v === "true" || v === true,
    z.boolean()
  ).default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  ALERTS_FROM: z.string().email().default("noreply@example.com"),
  ALERTS_TO: z.string().email().default("security@example.com"),

  // Alerts
  SUSPICIOUS_WINDOW_MINUTES: z.coerce.number().int().positive().default(10),
  SUSPICIOUS_DELETE_THRESHOLD: z.coerce.number().int().positive().default(20),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

// Extra runtime check: no weak secrets in production
if (parsed.success && parsed.data.NODE_ENV === "production") {
  if (
    parsed.data.JWT_SECRET === "secret" ||
    parsed.data.JWT_SECRET.length < 32
  ) {
    console.error("❌ Weak JWT_SECRET is not allowed in production");
    process.exit(1);
  }
}

export const env = parsed.data;
