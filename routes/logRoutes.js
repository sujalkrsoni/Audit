import { Router } from "express";
import { createLog, listLogs, stats } from "../controllers/logController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { perOrgRateLimit } from "../middlewares/rateLimit.js";
import { validateBody, validateQuery } from "../middlewares/validate.js";
import { createLogSchema, listLogsSchema } from "../utils/validators.js";

const router = Router();

// Apply auth + rate limit middleware
router.use(requireAuth);
router.use(perOrgRateLimit);

router.post("/", validateBody(createLogSchema), createLog);
router.get("/", validateQuery(listLogsSchema), listLogs);
router.get("/stats", validateQuery(listLogsSchema), stats);

export default router;
