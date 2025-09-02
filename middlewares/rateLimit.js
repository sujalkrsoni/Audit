// middlewares/rateLimit.js
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

export const perOrgRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    // Prefer org-based key; fallback to IP
    return req.auth?.org?.orgId || req.user?.orgId || ipKeyGenerator(req, res);
  },
  message: { error: "Too many requests, please try again later." },
});
