import createError from "http-errors";
import LogEntry from "../models/LogEntry.js";

/**
 * Aggregate: Total log count per event type
 */
export async function countByEventType(req, res, next) {
  try {
    const { orgId } = req.auth.org;

    const results = await LogEntry.aggregate([
      { $match: { orgId } },
      { $group: { _id: "$eventType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json(results.map(r => ({ eventType: r._id, count: r.count, data : r })));
  } catch (err) {
    next(err);
  }
}

/**
 * Aggregate: Unique users active in timeframe
 */
export async function uniqueUsers(req, res, next) {
  try {
    const { orgId } = req.auth.org;
    const { since, until } = req.query;

    const match = { orgId };
    if (since || until) {
      match.timestamp = {};
      if (since) match.timestamp.$gte = new Date(since);
      if (until) match.timestamp.$lte = new Date(until);
    }

    const results = await LogEntry.aggregate([
      { $match: match },
      { $group: { _id: "$userId" } },
      { $count: "uniqueUsers" },
    ]);

    res.json({ uniqueUsers: results[0]?.uniqueUsers || 0 });
  } catch (err) {
    next(err);
  }
}

/**
 * Aggregate: Most common events (chart-ready)
 */
export async function topEvents(req, res, next) {
  try {
    const { orgId } = req.auth.org;
    const { limit = 5 } = req.query;

    const results = await LogEntry.aggregate([
      { $match: { orgId } },
      { $group: { _id: "$eventType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit, 10) },
    ]);

    res.json(results.map(r => ({ eventType: r._id, count: r.count })));
  } catch (err) {
    next(err);
  }
}

/**
 * Aggregate: Daily activity trend
 */
export async function dailyTrend(req, res, next) {
  try {
    const { orgId } = req.auth.org;
    const { days = 7 } = req.query;

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const results = await LogEntry.aggregate([
      { $match: { orgId, timestamp: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(results.map(r => ({ date: r._id, count: r.count })));
  } catch (err) {
    next(err);
  }
}
