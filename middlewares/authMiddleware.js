// middlewares/authMiddleware.js
import createError from "http-errors";
import jwt from "jsonwebtoken";
import Organization from "../models/Organization.js";
import { signWithOrgSecret, verifyWithOrgSecret } from "../utils/tokenHelper.js";
import { env } from "../config/validateEnv.js";

export async function issueToken(req, res, next) {
  try {
    const { orgId, apiKey, userId } = req.body;
    const org = await Organization.findOne({ orgId });
    if (!org) throw createError(401, "Invalid organization");

    const ok = await org.verifyApiKey(apiKey);
    if (!ok) throw createError(401, "Invalid apiKey");

    const token = signWithOrgSecret({
      org,
      payload: { orgId: org.orgId, userId },
      expiresIn: env.JWT_DEFAULT_TTL,
    });

    res.json({ token, org: { orgId: org.orgId, name: org.name } });
  } catch (err) {
    next(err);
  }
}

// middlewares/authMiddleware.js
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw createError(401, "Missing or invalid Authorization header");
    }

    const token = authHeader.split(" ")[1];

    // Decode first to extract orgId
    const decoded = jwt.decode(token);
    if (!decoded?.orgId) throw createError(401, "Invalid token payload");

    const org = await Organization.findOne({ orgId: decoded.orgId });
    if (!org) throw createError(401, "Organization not found");

    // Verify token with org’s secret
    const payload = verifyWithOrgSecret(token, org.jwtSecret);

    // ✅ Attach `auth` object that controllers expect
    req.auth = {
      org: { orgId: org.orgId, name: org.name },
      userId: payload.userId,
      email: payload.email,
    };

    next();
  } catch (err) {
    next(createError(401, "Unauthorized"));
  }
}
