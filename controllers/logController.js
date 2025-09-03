// controllers/logController.js
import createError from "http-errors";
import LogEntry from "../models/LogEntry.js";
import { buildLogQuery, buildSort } from "../services/queryService.js";
import { detectAndNotifySuspiciousDeletes } from "../services/alertService.js";

function success(message, data = null, extra = {}) {
  return { success: true, message, data, ...extra };
}

// ✅ Create a new log entry
export async function createLog(req, res, next) {
  try {
    const { orgId, userId: authUserId } = req.user;
    const {
      eventType,
      resource,
      description,
      metadata,
      timestamp,
      userId,
      userEmail,
    } = req.body;

    if (!eventType) throw createError(400, "eventType is required");

    const doc = await LogEntry.create({
      orgId,
      userId: userId || authUserId,
      userEmail: userEmail || null,
      eventType,
      resource,
      description,
      metadata,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    // Fire-and-forget alert check
    detectAndNotifySuspiciousDeletes(orgId).catch(() => {});

    res
      .status(201)
      .json(success("Log entry created successfully", doc));
  } catch (err) {
    next(err);
  }
}

// ✅ List logs (filters + cursor pagination + full-text + fuzzy search)
export async function listLogs(req, res, next) {
  try {
    const { orgId } = req.user;
    const {
      page = 1,
      limit = 10,
      sortBy = "timestamp",
      order = "desc",
      after,
      search,
      operator = "AND",
      ...filters
    } = req.validatedQuery;

    let query = buildLogQuery({ orgId, params: filters, operator });

    // ✅ Full-text / fuzzy search
    if (search) {
      query.$or = [
        { $text: { $search: search } },
        { description: { $regex: search, $options: "i" } },
        { metadataText: { $regex: search, $options: "i" } },
      ];
    }

    const sort = buildSort({ sortBy, order });

    // ✅ Cursor-based pagination
    if (after) {
      query._id = { $gt: after };
      const docs = await LogEntry.find(query)
        .sort(sort)
        .limit(parseInt(limit, 10))
        .lean();

      return res.json(
        success("Logs fetched successfully", docs, {
          nextCursor: docs.length > 0 ? docs[docs.length - 1]._id : null,
        })
      );
    }

    // ✅ Page/limit pagination
    const result = await LogEntry.paginate(query, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort,
      lean: true,
    });

    res.json(
      success("Logs fetched successfully", result.docs, {
        pagination: {
          totalDocs: result.totalDocs,
          totalPages: result.totalPages,
          page: result.page,
          limit: result.limit,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
          nextPage: result.nextPage,
          prevPage: result.prevPage,
        },
      })
    );
  } catch (err) {
    next(err);
  }
}

// ✅ Stats aggregation (eventType, uniqueUsers, topResources, timeSeries)
export async function stats(req, res, next) {
  try {
    const { orgId } = req.user;
    const { interval = "hour", ...params } = req.query;

    const match = buildLogQuery({ orgId, params });

    let dateTruncUnit = "hour";
    if (interval === "day") dateTruncUnit = "day";
    if (interval === "month") dateTruncUnit = "month";

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
          timeSeries: [
            {
              $group: {
                _id: { $dateTrunc: { date: "$timestamp", unit: dateTruncUnit } },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ];

    const [result] = await LogEntry.aggregate(pipeline);

    res.json(
      success("Stats fetched successfully", {
        byEventType: result.byEventType.map((x) => ({
          eventType: x._id || "unknown",
          count: x.count,
        })),
        uniqueUsers: result.uniqueUsers[0]?.uniqueUsers || 0,
        topResources: result.topResources.map((x) => ({
          resource: x._id || "unknown",
          count: x.count,
        })),
        timeSeries: result.timeSeries.map((x) => ({
          interval: x._id,
          count: x.count,
        })),
      })
    );
  } catch (err) {
    next(err);
  }
}
