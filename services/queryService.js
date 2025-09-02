import mongoose from "mongoose";

export function buildLogQuery({ orgId, params = {} }) {
  const { userId, userEmail, eventType, resource, start, end, q, contains, fuzzy } = params;
  const and = [{ orgId }];

  if (userId) and.push({ userId });
  if (userEmail) and.push({ userEmail: new RegExp(escapeRegex(userEmail), "i") });
  if (eventType) and.push({ eventType: new RegExp(`^${escapeRegex(eventType)}$`, "i") });
  if (resource) and.push({ resource: new RegExp(escapeRegex(resource), "i") });

  if (start || end) {
    and.push({
      timestamp: {
        ...(start ? { $gte: new Date(start) } : {}),
        ...(end ? { $lte: new Date(end) } : {}),
      },
    });
  }

  if (contains) {
    const r = fuzzy === "true" ? buildFuzzyRegex(contains) : new RegExp(escapeRegex(contains), "i");
    and.push({
      $or: [
        { description: r },
        { eventType: r },
        { resource: r },
        { userEmail: r },
        { metadataText: r },
      ],
    });
  }

  if (q) and.push({ $text: { $search: q } });

  return and.length ? { $and: and } : {};
}

export function buildSort({ sortBy = "timestamp", order = "desc" }) {
  const dir = order === "asc" ? 1 : -1;
  const allowed = ["timestamp", "eventType", "userId", "userEmail"];
  const field = allowed.includes(sortBy) ? sortBy : "timestamp";
  return { [field]: dir };
}

export function buildPagination({ page = 1, limit = 20, after, before }) {
  const lim = Math.min(Math.max(Number(limit) || 20, 1), 200);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * lim;
  let cursor = {};
  if (after) cursor = { _id: { $gt: new mongoose.Types.ObjectId(after) } };
  if (before) cursor = { _id: { $lt: new mongoose.Types.ObjectId(before) } };
  return { limit: lim, skip, cursor };
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function buildFuzzyRegex(input) {
  const pattern = input.split("").map((ch) => escapeRegex(ch)).join(".*");
  return new RegExp(pattern, "i");
}
