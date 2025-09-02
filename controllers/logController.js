import createError from "http-errors";
import LogEntry from "../models/LogEntry.js";
import { buildLogQuery, buildSort } from "../services/queryService.js";
import { detectAndNotifySuspiciousDeletes } from "../services/alertService.js";

// Create a new log entry
export async function createLog(req, res, next) {
  try {
    const { org } = req.auth;
    const { eventType, resource, description, metadata, timestamp, userId, userEmail } = req.body;
    if (!eventType) throw createError(400, "eventType required");

    const doc = await LogEntry.create({
      orgId: org.orgId,
      userId: userId || req.auth.userId,
      userEmail,
      eventType,
      resource,
      description,
      metadata,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    // fire-and-forget alert check
    detectAndNotifySuspiciousDeletes(org.orgId).catch(() => {});
    res.status(201).json({ data: doc });
  } catch (err) {
    next(err);
  }
}

// List logs with pagination
export async function listLogs(req, res, next) {
  try {
    const { org } = req.auth;
    const { page = 1, limit = 10, sortBy = "timestamp", order = "desc", ...filters } =
      req.validatedQuery; // ✅ use validatedQuery here

    const query = buildLogQuery({ orgId: org.orgId, params: filters });
    const sort = buildSort({ sortBy, order });

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort,
      lean: true,
    };

    const result = await LogEntry.paginate(query, options);
    res.json(result);
  } catch (err) {
    next(err);
  }
}


// Stats aggregation
export async function stats(req, res, next) {
  try {
    const { org } = req.auth;

    // Safe deep clone
    const safeParams = JSON.parse(JSON.stringify(req.query));

    const match = buildLogQuery({ orgId: org.orgId, params: safeParams });

    const pipeline = [
      { $match: match },
      {
        $facet: {
          byEventType: [
            { $group: { _id: "$eventType", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          uniqueUsers: [{ $group: { _id: "$userId" } }, { $count: "uniqueUsers" }],
          topResources: [
            { $group: { _id: "$resource", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ],
          byHour: [
            {
              $group: {
                _id: { $dateTrunc: { date: "$timestamp", unit: "hour" } },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ];

    const [result] = await LogEntry.aggregate(pipeline);
    res.json({
      byEventType: result.byEventType.map((x) => ({ eventType: x._id || "unknown", count: x.count })),
      uniqueUsers: result.uniqueUsers[0]?.uniqueUsers || 0,
      topResources: result.topResources.map((x) => ({ resource: x._id || "unknown", count: x.count })),
      byHour: result.byHour.map((x) => ({ hour: x._id, count: x.count })),
    });
  } catch (err) {
    next(err);
  }
}


