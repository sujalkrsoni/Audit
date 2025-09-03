import mongoose from "mongoose";

export function buildLogQuery({ orgId, params = {}, operator = "AND" }) {
  const { userId, userEmail, eventType, resource, start, end, q, contains, fuzzy } = params;

  // ✅ Always enforce orgId
  const base = [{ orgId }];

  if (userId) base.push({ userId: String(userId) }); // ✅ sanitize
  if (userEmail) base.push({ userEmail: new RegExp(escapeRegex(String(userEmail)), "i") });
  if (eventType) base.push({ eventType: new RegExp(`^${escapeRegex(String(eventType))}$`, "i") });
  if (resource) base.push({ resource: new RegExp(escapeRegex(String(resource)), "i") });

  if (start || end) {
    const range = {};
    if (start && !isNaN(Date.parse(start))) range.$gte = new Date(start);
    if (end && !isNaN(Date.parse(end))) range.$lte = new Date(end);
    if (Object.keys(range).length) base.push({ timestamp: range });
  }

  if (contains) {
    const safeContains = sanitizeSearchTerm(contains);
    const r =
      fuzzy === "true"
        ? buildFuzzyRegex(safeContains)
        : new RegExp(escapeRegex(safeContains), "i");

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
    const safeQ = sanitizeSearchTerm(q);
    base.push({ $text: { $search: safeQ } });
  }

  // ✅ handle AND/OR operator safely
  const op = operator === "OR" ? "$or" : "$and";
  return { [op]: base };
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

// ✅ Escape regex meta characters
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ✅ Sanitize search term to prevent ReDoS / injection
function sanitizeSearchTerm(input) {
  if (typeof input !== "string") throw new Error("Invalid search term");
  if (input.length > 50) {
    throw new Error("Search term too long (max 50 chars)");
  }
  return input;
}

// ✅ Fuzzy regex with lazy quantifier, limited input
function buildFuzzyRegex(input) {
  if (input.length > 20) {
    throw new Error("Fuzzy search term too long (max 20 chars)");
  }
  const pattern = input.split("").map((ch) => escapeRegex(ch)).join(".*?"); // lazy
  return new RegExp(pattern, "i");
}
