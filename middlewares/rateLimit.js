// middlewares/rateLimit.js
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

export const perOrgRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    // ✅ enforce org-level rate limiting when authenticated
    if (req.auth?.org?.orgId) {
      return `org:${req.auth.org.orgId}`;
    }

    // ✅ fallback to IP-based limiting for unauthenticated requests
    return `ip:${ipKeyGenerator(req, res)}`;
  },
  message: { error: "Too many requests, please try again later." },
});
