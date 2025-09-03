import createError from "http-errors";
import Organization from "../models/Organization.js";
import {
  signWithOrgSecret,
  verifyWithOrgSecret,
  decodeToken,
} from "../utils/tokenHelper.js";
import { env } from "../config/validateEnv.js"; // ✅ keep only for JWT_DEFAULT_TTL
import logger from "../utils/logger.js";

// In-memory org cache with TTL
const orgCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function setOrgCache(org) {
  orgCache.set(org.orgId, { org, expires: Date.now() + CACHE_TTL_MS });
}

function getOrgCache(orgId) {
  const entry = orgCache.get(orgId);
  if (entry && entry.expires > Date.now()) {
    return entry.org;
  }
  orgCache.delete(orgId);
  return null;
}

// ✅ Issue token (login/auth)
export async function issueToken(req, res, next) {
  try {
    const { orgId, apiKey, userId, email } = req.body;

    const org = await Organization.findOne({ orgId });
    if (!org) throw createError(401, "Invalid organization");

    const ok = await org.verifyApiKey(apiKey);
    if (!ok) throw createError(401, "Invalid API key");

    const token = signWithOrgSecret({
      org,
      payload: { orgId: org.orgId, userId, email },
      expiresIn: env.JWT_DEFAULT_TTL,
    });

    res.json({
      token,
      org: { orgId: org.orgId, name: org.name },
    });
  } catch (err) {
    logger.error({ msg: "issueToken error", error: err.message });
    next(err);
  }
}

// ✅ Protect routes
export async function requireAuth(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw createError(401, "Missing or invalid Authorization header");
    }

    const token = authHeader.split(" ")[1];
    const decoded = decodeToken(token);
    if (!decoded?.orgId) throw createError(401, "Invalid token payload");

    let org = getOrgCache(decoded.orgId);
    if (!org) {
      org = await Organization.findOne({ orgId: decoded.orgId }).lean();
      if (!org) throw createError(401, "Organization not found");
      setOrgCache(org);
    }

    let payload;
    try {
      payload = verifyWithOrgSecret(token, org.jwtSecret);
    } catch (err) {
      logger.warn({ msg: "Token verification failed", error: err.message });
      throw createError(401, "Unauthorized");
    }

    // ✅ Always attach consistent auth object
    req.auth = {
      org: { orgId: org.orgId, name: org.name },
      userId: payload.userId,
      email: payload.email,
    };

    next();
  } catch (err) {
    logger.error({ msg: "Auth middleware error", error: err.message });
    next(createError(401, "Unauthorized"));
  }
}
