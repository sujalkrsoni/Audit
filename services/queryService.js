import mongoose from "mongoose";

export function buildLogQuery({ orgId, params = {}, operator = "AND" }) {
  const { userId, userEmail, eventType, resource, start, end, q, contains, fuzzy } = params;

  // ✅ sabse pehle ensure orgId condition
  const base = [{ orgId }];

  if (userId) base.push({ userId });
  if (userEmail) base.push({ userEmail: new RegExp(escapeRegex(userEmail), "i") });
  if (eventType) base.push({ eventType: new RegExp(`^${escapeRegex(eventType)}$`, "i") });
  if (resource) base.push({ resource: new RegExp(escapeRegex(resource), "i") });

  if (start || end) {
    base.push({
      timestamp: {
        ...(start ? { $gte: new Date(start) } : {}),
        ...(end ? { $lte: new Date(end) } : {}),
      },
    });
  }

  if (contains) {
    const r = fuzzy === "true" ? buildFuzzyRegex(contains) : new RegExp(escapeRegex(contains), "i");
    base.push({
      $or: [
        { description: r },
        { eventType: r },
        { resource: r },
        { userEmail: r },
        { metadataText: r },
      ],
    });
  }

  if (q) {
    base.push({ $text: { $search: q } });
  }

  // ✅ handle AND/OR operator
  if (base.length === 0) return {};
  return operator === "OR" ? { $or: base } : { $and: base };
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
