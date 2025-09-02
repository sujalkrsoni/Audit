import { Router } from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { perOrgRateLimit } from "../middlewares/rateLimit.js";
import {
  countByEventType,
  uniqueUsers,
  topEvents,
  dailyTrend,
} from "../controllers/aggregationController.js";

const router = Router();

router.use(requireAuth);
router.use(perOrgRateLimit);

// Aggregation endpoints
router.get("/count-by-event", countByEventType);
router.get("/unique-users", uniqueUsers);
router.get("/top-events", topEvents);
router.get("/daily-trend", dailyTrend);

export default router;
