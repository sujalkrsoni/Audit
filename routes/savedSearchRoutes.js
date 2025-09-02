// routes/savedSearchRoutes.js

import { Router } from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { perOrgRateLimit } from "../middlewares/rateLimit.js";
import {
  createOrUpdateSavedSearch,
  listSavedSearches,
  getSavedSearch,
  deleteSavedSearch,
} from "../controllers/savedSearchController.js";
import { validateBody } from "../middlewares/validate.js";
import { saveSearchSchema } from "../utils/validators.js"; // ⬅️ Corrected path

const router = Router();

// Middlewares (auth + rate limit per org)
router.use(requireAuth);
router.use(perOrgRateLimit);

// Routes
router.post("/", validateBody(saveSearchSchema), createOrUpdateSavedSearch);
router.get("/", listSavedSearches);
router.get("/:name", getSavedSearch);
router.delete("/:name", deleteSavedSearch);

export default router;