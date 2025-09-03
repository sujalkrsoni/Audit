// controllers/logController.js
import createError from "http-errors";
import LogEntry from "../models/LogEntry.js";
import { buildLogQuery, buildSort } from "../services/queryService.js";
import { detectAndNotifySuspiciousDeletes } from "../services/alertService.js";
import logger from "../utils/logger.js"; // ✅ use structured logger

function success(message, data = null, extra = {}) {
  return { success: true, message, data, ...extra };
}

// ✅ Create a new log entry
export async function createLog(req, res, next) {
  try {
    const { org, userId: authUserId, email: authEmail } = req.auth;
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
      orgId: org.orgId,
      userId: userId || authUserId,
      userEmail: userEmail || authEmail || null,
      eventType,
      resource,
      description,
      metadata,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    // Fire-and-forget alert check
    detectAndNotifySuspiciousDeletes(org.orgId).catch(() => {});

    // ✅ Audit log for monitoring (Issue #11)
    logger.info(
      { orgId: org.orgId, userId: userId || authUserId, eventType },
      "[LOG CREATED]"
    );

    res.status(201).json(success("Log entry created successfully", doc));
  } catch (err) {
    next(err);
  }
}

// ✅ List logs (filters + cursor pagination + full-text + fuzzy search)
export async function listLogs(req, res, next) {
  try {
    const { org } = req.auth;
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

    // ✅ enforce safe limit (Issue #6)
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 200);

    let query = buildLogQuery({ orgId: org.orgId, params: filters, operator });

    // ✅ Full-text / fuzzy search
    if (search) {
      const safeSearch = search.length > 50 ? search.substring(0, 50) : search;
      query.$or = [
        { $text: { $search: safeSearch } },
        { description: { $regex: safeSearch, $options: "i" } },
        { metadataText: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const sort = buildSort({ sortBy, order });

    // ✅ Cursor-based pagination
    if (after) {
      query._id = { $gt: after };
      const docs = await LogEntry.find(query)
        .sort(sort)
        .limit(safeLimit)
        .lean();

      logger.info(
        { orgId: org.orgId, after, limit: safeLimit, count: docs.length },
        "[LOG LIST - CURSOR]"
      );

      return res.json(
        success("Logs fetched successfully", docs, {
          nextCursor: docs.length > 0 ? docs[docs.length - 1]._id : null,
        })
      );
    }

    // ✅ Page/limit pagination
    const result = await LogEntry.paginate(query, {
      page: Math.max(parseInt(page, 10), 1),
      limit: safeLimit,
      sort,
      lean: true,
    });

    logger.info(
      {
        orgId: org.orgId,
        page,
        limit: safeLimit,
        returned: result.docs.length,
      },
      "[LOG LIST - PAGINATION]"
    );

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
    const { org } = req.auth;
    const { interval = "hour", ...params } = req.query;

    const match = buildLogQuery({ orgId: org.orgId, params });

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
          uniqueUsers: [
            { $group: { _id: "$userId" } },
            { $count: "uniqueUsers" },
          ],
          topResources: [
            { $group: { _id: "$resource", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ],
          timeSeries: [
            {
              $group: {
                _id: {
                  $dateTrunc: { date: "$timestamp", unit: dateTruncUnit },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ];

    const [result] = await LogEntry.aggregate(pipeline);

    logger.info({ orgId: org.orgId, interval }, "[LOG STATS]");

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
