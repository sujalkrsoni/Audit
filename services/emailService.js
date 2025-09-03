import nodemailer from "nodemailer";
import { env } from "../config/validateEnv.js";
import Organization from "../models/Organization.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE === true,
  auth:
    env.SMTP_USER && env.SMTP_PASS
      ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
      : undefined,
});

/**
 * Send email with fallback:
 * - Prefer explicit `to` if passed
 * - Else prefer org-specific emailForAlerts
 * - Else fallback to global env.ALERTS_TO
 */
export async function sendMail({ to, orgId, subject, text, html }) {
  let recipient = to;

  if (!recipient && orgId) {
    const org = await Organization.findOne({ orgId }).lean();
    if (org?.emailForAlerts) {
      recipient = org.emailForAlerts;
    }
  }

  if (!recipient) {
    recipient = env.ALERTS_TO;
  }

  if (!recipient) {
    throw new Error("No recipient configured for alert email");
  }

  const from = env.ALERTS_FROM;
  return transporter.sendMail({ to: recipient, from, subject, text, html });
}
