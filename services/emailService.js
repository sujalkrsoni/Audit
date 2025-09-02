import nodemailer from "nodemailer";
import { env } from "../config/validateEnv.js";
import Organization from "../models/Organization.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE === true,
  auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
});

/**
 * Send email with fallback:
 * - Prefer org-specific emailForAlerts
 * - Else fallback to global env.ALERTS_TO
 */
export async function sendMail({ orgId, subject, text, html }) {
  let to = env.ALERTS_TO;

  if (orgId) {
    const org = await Organization.findOne({ orgId }).lean();
    if (org?.emailForAlerts) {
      to = org.emailForAlerts;
    }
  }

  const from = env.ALERTS_FROM;
  return transporter.sendMail({ to, from, subject, text, html });
}
