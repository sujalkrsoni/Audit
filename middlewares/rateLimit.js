// middlewares/rateLimit.js
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

export const perOrgRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,  // Disable the `X-RateLimit-*` headers
  keyGenerator: (req, res) => {
    // Example: use orgId if available, otherwise fallback to IP
    return req.user?.orgId || ipKeyGenerator(req, res);
  },
  message: { error: "Too many requests, please try again later." },
});
