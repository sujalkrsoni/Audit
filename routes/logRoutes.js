import { Router } from "express";
import { createLog, listLogs, stats } from "../controllers/logController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { perOrgRateLimit } from "../middlewares/rateLimit.js";
import { validateBody, validateQuery } from "../middlewares/validate.js";
import { createLogSchema, listLogsSchema } from "../utils/validators.js";

const router = Router();

// Global middlewares (auth + rate limiting)
router.use(requireAuth, perOrgRateLimit);

/**
 * @route POST /api/v1/logs
 * @desc Create a new log entry
 */
router.post("/", validateBody(createLogSchema), createLog);

/**
 * @route GET /api/v1/logs
 * @desc List logs with filters (supports AND/OR operators, full-text, fuzzy, pagination)
 */
router.get("/", validateQuery(listLogsSchema), listLogs);

/**
 * @route GET /api/v1/logs/stats
 * @desc Aggregation stats (chart-ready data)
 */
router.get("/stats", validateQuery(listLogsSchema), stats);

export default router;
