import { Router } from "express";
import { createLog, listLogs, stats } from "../controllers/logController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { perOrgRateLimit } from "../middlewares/rateLimit.js";
import { validateBody, validateQuery } from "../middlewares/validate.js";
import { createLogSchema, listLogsSchema, statsSchema } from "../utils/validators.js";


const router = Router();

// ✅ Global middlewares: authentication + per-org rate limiting
router.use(requireAuth, perOrgRateLimit);

/**
 * @route POST /api/v1/logs
 * @desc Create a new log entry
 */
router.post("/", validateBody(createLogSchema), createLog);

/**
 * @route GET /api/v1/logs
 * @desc List logs with filters (AND/OR, search, fuzzy, pagination)
 */
router.get("/", validateQuery(listLogsSchema), listLogs);

/**
 * @route GET /api/v1/logs/stats
 * @desc Aggregation stats (chart-ready data)
 */
router.get("/stats", validateQuery(statsSchema), stats);

export default router;
