import nodemailer from "nodemailer";
import { env } from "../config/validateEnv.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE === true,
  auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
});

export function sendMail({ to = env.ALERTS_TO, from = env.ALERTS_FROM, subject, text, html }) {
  return transporter.sendMail({ to, from, subject, text, html });
}
