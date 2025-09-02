// services/alertService.js
import { env } from "../config/validateEnv.js";
import LogEntry from "../models/LogEntry.js";
import Organization from "../models/Organization.js";
import { sendMail } from "./emailService.js";

export async function detectAndNotifySuspiciousDeletes(orgId) {
  const windowMs = env.SUSPICIOUS_WINDOW_MINUTES * 60 * 1000;
  const since = new Date(Date.now() - windowMs);

  const count = await LogEntry.countDocuments({
    orgId,
    eventType: /delete/i,
    timestamp: { $gte: since },
  });

  if (count >= env.SUSPICIOUS_DELETE_THRESHOLD) {
    // org-specific alert email if configured
    const org = await Organization.findOne({ orgId }).lean();
    const to = org?.emailForAlerts || env.ALERTS_TO;

    await sendMail({
      to,
      subject: `[ALERT] High volume DELETE for org ${orgId}`,
      text: `Detected ${count} DELETE events in last ${env.SUSPICIOUS_WINDOW_MINUTES} minutes for org ${orgId}.`,
    });
    return { alerted: true, count };
  }

  return { alerted: false, count };
}
