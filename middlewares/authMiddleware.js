// middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import createError from "http-errors";
import Organization from "../models/Organization.js";
import { signWithOrgSecret, verifyWithOrgSecret } from "../utils/tokenHelper.js";
import { env } from "../config/validateEnv.js";

// Issue token (login/auth)
export async function issueToken(req, res, next) {
  try {
    const { orgId, apiKey, userId, email } = req.body;

    const org = await Organization.findOne({ orgId });
    if (!org) throw createError(401, "Invalid organization");

    const ok = await org.verifyApiKey(apiKey);
    if (!ok) throw createError(401, "Invalid apiKey");

    // payload me orgId + user info
    const token = signWithOrgSecret({
      org,
      payload: { orgId: org.orgId, userId, email },
      expiresIn: env.JWT_DEFAULT_TTL,
    });

    res.json({ token, org: { orgId: org.orgId, name: org.name } });
  } catch (err) {
    next(err);
  }
}

// Protect routes
export async function requireAuth(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw createError(401, "Missing or invalid Authorization header");
    }

    const token = authHeader.split(" ")[1];

    // Step 1: decode to get orgId
    const decoded = jwt.decode(token);
    if (!decoded?.orgId) throw createError(401, "Invalid token payload");

    // Step 2: find org & verify with its secret
    const org = await Organization.findOne({ orgId: decoded.orgId });
    if (!org) throw createError(401, "Organization not found");

    const payload = verifyWithOrgSecret(token, org.jwtSecret);

    // Step 3: attach auth (canonical)
    req.auth = {
      org: { orgId: org.orgId, name: org.name },
      userId: payload.userId,
      email: payload.email,
    };

    // 🔙 Backward-compat: kuch jagah pe req.user destructure ho raha tha
    // taaki crash na ho, yeh bhi set kar dete hain
    req.user = {
      orgId: org.orgId,
      userId: payload.userId,
      email: payload.email,
    };

    next();
  } catch (err) {
    next(createError(401, "Unauthorized"));
  }
}
