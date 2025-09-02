// utils/tokenHelper.js
import jwt from "jsonwebtoken";

export function signWithOrgSecret({ org, payload, expiresIn }) {
  const secret = org.jwtSecret;
  if (!secret) throw new Error("Organization is missing jwtSecret");
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyWithOrgSecret(token, orgSecret) {
  if (!orgSecret) throw new Error("Missing org secret for token verification");
  return jwt.verify(token, orgSecret);
}
