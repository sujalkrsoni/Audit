// middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import createError from "http-errors";
import Organization from "../models/Organization.js";
import { signWithOrgSecret, verifyWithOrgSecret } from "../utils/tokenHelper.js";
import { env } from "../config/validateEnv.js";

// issueToken = for login/auth
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

// ✅ requireAuth = middleware to protect routes
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw createError(401, "Missing or invalid Authorization header");
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyWithOrgSecret(token); // use your helper
    req.user = payload;
    next();
  } catch (err) {
    next(createError(401, "Unauthorized"));
  }
}
