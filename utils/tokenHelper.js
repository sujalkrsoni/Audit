// utils/tokenHelper.js
import jwt from "jsonwebtoken";

/**
 * Sign a JWT using the organization's secret
 */
export function signWithOrgSecret({ org, payload, expiresIn }) {
  if (!org?.jwtSecret) {
    throw new Error("Organization is missing jwtSecret");
  }
  return jwt.sign(payload, org.jwtSecret, { expiresIn });
}

/**
 * Verify a JWT with the org’s secret
 */
export function verifyWithOrgSecret(token, orgSecret) {
  if (!orgSecret) {
    throw new Error("Missing org secret for token verification");
  }
  return jwt.verify(token, orgSecret);
}

/**
 * Decode a JWT without verifying (for orgId extraction only)
 */
export function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch {
    throw new Error("Failed to decode token");
  }
}
